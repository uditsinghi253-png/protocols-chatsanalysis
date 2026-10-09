import { describe, it, expect } from 'vitest';
import { sniffAndParseChat } from '../src/adapters/sniffer';
import { extractL1Signals, resolveRelativeDate, isUserAddressed, isSystemOrDeletedMessage } from '../src/engine/deterministicSignals';
import { resolveSupersessions } from '../src/engine/supersession';
import { segmentMessagesByContextBudget } from '../src/engine/summarizer';
import { verifyItemsGrounding } from '../src/engine/groundingVerifier';
import { DEFAULT_CONFIG } from '../src/config';
import { IdentityProfile, Item } from '../src/types/schema';

describe('Tier 2 & Comprehensive Edge Cases Suite (E1 through E12)', () => {
  const profile: IdentityProfile = {
    names: ['Udit', 'Udit Singhi'],
    aliases: ['Udit'],
    handles: ['@udit'],
    timezone: 'Asia/Kolkata',
    locale: 'en-US',
    confirmedByUser: true,
  };

  // E1: Relative & Ambiguous Dates
  it('E1: resolves relative dates against message timestamp and flags ambiguous phrases', () => {
    const msgTs = '2026-10-10T08:00:00.000Z';
    const tomorrowRes = resolveRelativeDate('Submit by tomorrow at 4pm', msgTs, 'Asia/Kolkata');
    expect(tomorrowRes?.isUnclearDate).toBe(false);
    expect(new Date(tomorrowRes!.iso).getUTCDate()).toBe(11);

    const vagueRes = resolveRelativeDate('We will finalize after the exam', msgTs, 'Asia/Kolkata');
    expect(vagueRes?.isUnclearDate).toBe(true);
  });

  // E2: Decision Superseded Later
  it('E2: marks earlier decision as superseded when subsequent message changes it', () => {
    const rawChat = `
[10/10/2026, 09:00:00] Alice: We agreed to launch on Friday.
[10/10/2026, 11:00:00] Alice: Actually let's go with Monday instead.
    `.trim();

    const ingest = sniffAndParseChat(rawChat, 'e2_conv');
    const l1 = extractL1Signals(ingest.messages, profile, DEFAULT_CONFIG);
    expect(l1.items.length).toBe(2);

    const resolved = resolveSupersessions(l1.items, ingest.messages);
    expect(resolved[0].status).toBe('superseded');
    expect(resolved[0].supersededBy).toBe(resolved[1].id);
    expect(resolved[1].supersedes).toContain(resolved[0].id);
  });

  // E3: Code-mixed, Emoji, and Slang
  it('E3: parses code-mixed text and emoji safely without dropping messages', () => {
    const rawChat = `
[10/10/2026, 09:00:00] Rahul: Bro please review kar do PR jaldi 🙏🚀
[10/10/2026, 09:05:00] Sneha: Haan bhai 👍 looking now!
    `.trim();

    const ingest = sniffAndParseChat(rawChat, 'e3_conv');
    expect(ingest.messages.length).toBe(2);
    expect(ingest.messages[0].text).toContain('🙏🚀');
    expect(ingest.messages[1].text).toContain('👍');
  });

  // E4: Chat Longer than Model Context
  it('E4: segments oversized conversation into budgeted chunks with context overlap', () => {
    const messages = Array.from({ length: 50 }, (_, i) => ({
      id: `msg_${i}`,
      conversationId: 'long_chat',
      ts: new Date(Date.now() + i * 60000).toISOString(),
      sender: i % 2 === 0 ? 'Alice' : 'Bob',
      senderId: i % 2 === 0 ? 'alice' : 'bob',
      text: `Message number ${i} with substantial detailed operational discussion content.`,
      ordinal: i,
    }));

    // With a tight token budget (e.g. 200 tokens)
    const chunks = segmentMessagesByContextBudget(messages, DEFAULT_CONFIG, 200);
    expect(chunks.length).toBeGreaterThan(1);
    // Overlap verification: last message of chunk 0 is first of chunk 1
    expect(chunks[0][chunks[0].length - 1].id).toBe(chunks[1][0].id);
  });

  // E5: Invalid Model Output / Hallucinated Quote
  it('E5: catches hallucinated quotes and marks them unverified', () => {
    const messages = [{
      id: 'msg_1',
      conversationId: 'c1',
      ts: '2026-10-10T10:00:00Z',
      sender: 'Alice',
      senderId: 'alice',
      text: 'Please review the client slide deck.',
      ordinal: 0,
    }];

    const hallucinatedItem: Item = {
      id: 'hallucinated_item',
      kind: 'action_item',
      title: 'Deploy Production Cluster',
      detail: 'Deploy immediately',
      status: 'open',
      evidence: [{ messageId: 'msg_1', quote: 'Deploy the production cluster by midnight' }],
      signals: [],
      urgency: { score: 0.9, level: 'critical', explanation: '' },
      relevanceToMe: { score: 0.5, explanation: '' },
      createdFrom: { engine: 'llm', timestamp: new Date().toISOString() },
    };

    const grounding = verifyItemsGrounding([hallucinatedItem], messages);
    expect(grounding.allGrounded).toBe(false);
    expect(grounding.unverifiedItems.length).toBe(1);
    expect(grounding.unverifiedItems[0].status).toBe('unverified');
  });

  // E6: False Urgency Shouting
  it('E6: applies shouting penalty when text is over 60% uppercase', () => {
    const rawChat = `
[10/10/2026, 12:00:00] Dan: @udit CAN YOU FIX THE SERVER NOW PLEASE URGENT ISSUE!!!
    `.trim();

    const ingest = sniffAndParseChat(rawChat, 'e6_conv');
    const l1 = extractL1Signals(ingest.messages, profile, DEFAULT_CONFIG);
    expect(l1.items.length).toBe(1);

    const hasPenalty = l1.items[0].signals.some(s => s.name === 'falseUrgencyPenalty');
    expect(hasPenalty).toBe(true);
  });

  // E7: Indirect Addressing in 1-on-1 Chats
  it('E7: detects indirect address in 1-on-1 conversations without explicit @handle', () => {
    // In a 1:1 conversation between Sarah and Udit
    const isDirectlyAddressed = isUserAddressed('Can you take the client demo today?', profile, true);
    expect(isDirectlyAddressed).toBe(true);

    // In a group chat (isOneOnOne = false), generic "can you" without tag is not attributed to user
    const isGroupAddressed = isUserAddressed('Can someone take the client demo today?', profile, false);
    expect(isGroupAddressed).toBe(false);
  });

  // E8: Deleted & Forwarded Messages
  it('E8: recognizes and skips WhatsApp deletion markers', () => {
    expect(isSystemOrDeletedMessage('This message was deleted')).toBe(true);
    expect(isSystemOrDeletedMessage('<Media omitted>')).toBe(true);
    expect(isSystemOrDeletedMessage('Please send the contract')).toBe(false);
  });

  // E9: Empty or Already Read Chat
  it('E9: handles empty input gracefully with friendly zero state', () => {
    const ingest = sniffAndParseChat('', 'empty');
    expect(ingest.messages.length).toBe(0);
  });

  // E11: Multiple People with Same Name
  it('E11: disambiguates senders using stable senderId', () => {
    const rawChat = `
[10/10/2026, 10:00:00] Alex: First update
[10/10/2026, 10:05:00] Alex: Second update
    `.trim();

    const ingest = sniffAndParseChat(rawChat, 'e11_conv');
    expect(ingest.messages[0].id).not.toBe(ingest.messages[1].id);
    expect(ingest.messages[0].senderId).toBe('alex');
  });

  // E12: Clock/Timezone Mismatch
  it('E12: unambiguously distinguishes DMY when day > 12', () => {
    const rawChat = `
[25/11/2026, 14:00:00] Maya: Meeting confirmed.
    `.trim();

    const ingest = sniffAndParseChat(rawChat, 'e12_conv');
    expect(ingest.inferredDateOrder).toBe('DMY');
    const msgDate = new Date(ingest.messages[0].ts);
    expect(msgDate.getUTCDate()).toBe(25);
    expect(msgDate.getUTCMonth()).toBe(10); // November (0-indexed = 10)
  });
});
