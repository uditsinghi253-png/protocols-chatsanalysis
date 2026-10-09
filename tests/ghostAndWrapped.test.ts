import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { sniffAndParseChat } from '../src/adapters/sniffer';
import { detectGhostedThreads } from '../src/engine/ghostDetector';
import { computeWrappedAnalytics } from '../src/engine/wrappedAnalytics';
import { enrichItemsWithFlaggers } from '../src/engine/flaggers';
import { extractL1Signals } from '../src/engine/deterministicSignals';
import { DEFAULT_CONFIG } from '../src/config';
import { IdentityProfile, Message } from '../src/types/schema';

describe('Ghosted Threads, Wrapped Analytics & Flaggers', () => {
  const mockProfile: IdentityProfile = {
    names: ['Udit', 'Udit Jain'],
    aliases: ['Udit', 'Singhi'],
    handles: ['@udit'],
    timezone: 'Asia/Kolkata',
    locale: 'en-US',
    confirmedByUser: true,
  };

  it('detects unreturned inquiries and computes ghosting severity', () => {
    const testMessages: Message[] = [
      {
        id: 'msg_1',
        conversationId: 'c1',
        sender: 'Rudra',
        senderId: 'rudra',
        text: 'Hey Udit, can you send over the API documentation for auth?',
        ts: '2026-04-10T10:00:00.000Z',
        ordinal: 1,
      },
      // Udit has not replied for 36 hours
    ];

    const refTime = new Date('2026-04-11T22:00:00.000Z'); // 36 hours later
    const ghosts = detectGhostedThreads(testMessages, mockProfile, refTime);

    expect(ghosts.length).toBe(1);
    expect(ghosts[0].isOutgoing).toBe(false); // Incoming to Udit, Udit owes Rudra
    expect(ghosts[0].sender).toBe('Rudra');
    expect(ghosts[0].hoursSilent).toBe(36);
    expect(ghosts[0].daysSilent).toBe(1.5);
    expect(ghosts[0].inquiryType).toBe('action_request');
    expect(ghosts[0].suggestedAction).toContain('Reply to Rudra');
  });

  it('detects outgoing questions left unanswered', () => {
    const testMessages: Message[] = [
      {
        id: 'msg_1',
        conversationId: 'c1',
        sender: 'Udit Jain',
        senderId: 'udit',
        text: 'Did we finalize the budget for the server cluster?',
        ts: '2026-04-10T10:00:00.000Z',
        ordinal: 1,
      },
    ];

    const refTime = new Date('2026-04-14T10:00:00.000Z'); // 4 days later
    const ghosts = detectGhostedThreads(testMessages, mockProfile, refTime);

    expect(ghosts.length).toBe(1);
    expect(ghosts[0].isOutgoing).toBe(true); // Udit asked, Rudra ghosted
    expect(ghosts[0].inquiryType).toBe('decision_needed');
    expect(ghosts[0].severity).toBe('high');
    expect(ghosts[0].daysSilent).toBe(4);
    expect(ghosts[0].suggestedAction).toContain('Following up on: Did we finalize');
  });

  it('enriches items with readable statistical markers (Awaiting Reply, Active Discussion, blocking, resource)', () => {
    const testMessages: Message[] = [
      { id: 'm1', conversationId: 'c1', sender: 'Rudra', senderId: 'r', text: 'Hey wait hold on let me check first', ts: '2026-04-10T10:00:00.000Z', ordinal: 1 },
      { id: 'm2', conversationId: 'c1', sender: 'Udit', senderId: 'u', text: 'Check out https://github.com/protocol/repo', ts: '2026-04-10T10:01:00.000Z', ordinal: 2 },
      { id: 'm3', conversationId: 'c1', sender: 'Rudra', senderId: 'r', text: 'Hey Udit when can you send the report?', ts: '2026-04-09T10:00:00.000Z', ordinal: 3 },
    ];

    const { items } = extractL1Signals(testMessages, mockProfile, DEFAULT_CONFIG);
    const enriched = enrichItemsWithFlaggers(items, testMessages, new Date('2026-04-10T12:00:00.000Z'));

    const resourceItem = enriched.find(it => it.evidence[0]?.messageId === 'm2');
    expect(resourceItem?.flaggers?.some(f => f.type === 'resource_anchor')).toBe(true);

    const questionItem = enriched.find(it => it.evidence[0]?.messageId === 'm3');
    const awaitFlag = questionItem?.flaggers?.find(f => f.type === 'ghost_risk');
    expect(awaitFlag?.label).toContain('Awaiting Reply');
  });

  it('executes Ghosted and Wrapped analytics across real WhatsApp export (7,097 messages)', () => {
    const zipPath = path.join(os.homedir(), 'Downloads', 'WhatsApp Chat - Rudra.zip');
    if (!fs.existsSync(zipPath)) {
      console.warn('Real chat zip not present in ~/Downloads, skipping real export benchmark in CI.');
      return;
    }

    const rawChat = execSync(`unzip -p "${zipPath}" _chat.txt`).toString('utf-8');
    const parsed = sniffAndParseChat(rawChat);

    expect(parsed.messages.length).toBe(7097);

    // 1. Detect Ghosted Threads
    const lastMsgTs = new Date(parsed.messages[parsed.messages.length - 1].ts);
    const ghosted = detectGhostedThreads(parsed.messages, mockProfile, lastMsgTs);

    expect(ghosted.length).toBeGreaterThan(0);
    const youOwe = ghosted.filter(g => !g.isOutgoing);
    const theyOwe = ghosted.filter(g => g.isOutgoing);

    console.log(`\n=== GHOSTED CHATS ON REAL EXPORT ===`);
    console.log(`Total ghosted / unreturned inquiries found: ${ghosted.length}`);
    console.log(`You owe Rudra: ${youOwe.length}`);
    console.log(`Rudra owes you: ${theyOwe.length}`);
    console.log(`Sample Ghosted thread: "${ghosted[0].text}" (${ghosted[0].daysSilent}d silent)`);

    // 2. Compute Wrapped Analytics
    const { items } = extractL1Signals(parsed.messages, mockProfile, DEFAULT_CONFIG);
    const wrapped = computeWrappedAnalytics(parsed.messages, items, mockProfile);

    expect(wrapped.totalMessages).toBe(7097);
    expect(wrapped.participants.length).toBe(2);
    expect(wrapped.peakActivity.busiestDate).toBeTruthy();
    expect(wrapped.conversationArchetype.title).toBeTruthy();

    console.log(`\n=== COLLABORATION WRAPPED ON REAL EXPORT ===`);
    console.log(`Total Messages: ${wrapped.totalMessages} | Words: ${wrapped.totalWords}`);
    console.log(`Archetype: "${wrapped.conversationArchetype.title}" - ${wrapped.conversationArchetype.subtitle}`);
    console.log(`Dynamic Narrative: ${wrapped.conversationArchetype.dynamicDescription}`);
    console.log(`Peak Chaos Day: ${wrapped.peakActivity.busiestDate} (${wrapped.peakActivity.busiestDateCount} messages)`);
    console.log(`Peak Hour: ${wrapped.peakActivity.busiestHourOfDay}:00`);

    for (const p of wrapped.participants) {
      console.log(`- Participant: ${p.name} | Msgs: ${p.messageCount} (${p.percentage}%) | Median Reply: ${(p.medianReplyMinutes * 60).toFixed(0)}s`);
    }

    console.log(`Top Keywords: ${wrapped.topKeywords.slice(0, 5).map(k => k.word).join(', ')}`);
    console.log(`Top Domains: ${wrapped.topDomains.slice(0, 5).map(d => d.domain).join(', ')}`);
  });
});
