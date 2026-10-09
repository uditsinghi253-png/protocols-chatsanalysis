import { describe, it, expect } from 'vitest';
import { sniffAndParseChat } from '../src/adapters/sniffer';
import { resolveUnreadCursor, getUnreadMessages } from '../src/engine/cursor';
import { extractL1Signals, resolveRelativeDate, calculateShoutingRatio } from '../src/engine/deterministicSignals';
import { verifyItemsGrounding } from '../src/engine/groundingVerifier';
import { calculateItemUrgency } from '../src/engine/scoring';
import { egressGuard } from '../src/security/egressGuard';
import { DEFAULT_CONFIG } from '../src/config';
import { IdentityProfile, Item } from '../src/types/schema';

describe('Tier 1 Core Pipeline & Acceptance Tests', () => {
  const testProfile: IdentityProfile = {
    names: ['Udit', 'Udit Singhi'],
    aliases: ['Udit', 'Singhi'],
    handles: ['@udit'],
    timezone: 'Asia/Kolkata',
    locale: 'en-US',
    confirmedByUser: true,
  };

  // --- 1. Ingest Sniffer Tests ---
  describe('Ingest & Sniffer', () => {
    it('correctly sniffs and parses WhatsApp bracketed format with multi-lines', () => {
      const rawChat = `
[12/10/2026, 10:15:00] Sarah Connor: Hey team, we need to finalize the contract.
Can everyone review before EOD?
[12/10/2026, 10:18:22] John Doe: Looking into it now.
[12/10/2026, 10:20:00] Sarah Connor: @udit can you take the deployment checklist?
Deadline is tomorrow at 5pm.
      `.trim();

      const result = sniffAndParseChat(rawChat, 'test_chat');
      expect(result.formatDetected).toBe('whatsapp_bracketed');
      expect(result.messages.length).toBe(3);
      expect(result.participants).toContain('Sarah Connor');
      expect(result.participants).toContain('John Doe');
      // Multi-line verification
      expect(result.messages[0].text).toContain('Can everyone review before EOD?');
      // Stable ID verification
      expect(result.messages[0].id).toMatch(/^msg_[a-f0-9]+$/);
    });

    it('correctly parses standard Android WhatsApp format', () => {
      const rawChat = `
12/10/2026, 14:00 - Alice Smith: Please send the slides.
12/10/2026, 14:05 - Bob Jones: Done!
      `.trim();

      const result = sniffAndParseChat(rawChat, 'android_chat');
      expect(result.formatDetected).toBe('whatsapp_standard');
      expect(result.messages.length).toBe(2);
      expect(result.messages[0].sender).toBe('Alice Smith');
    });

    it('handles empty input gracefully (Edge case E9)', () => {
      const result = sniffAndParseChat('', 'empty_chat');
      expect(result.messages.length).toBe(0);
      expect(result.formatDetected).toBe('unknown');
    });
  });

  // --- 2. Unread Cursor Tests ---
  describe('Unread Cursor Resolution', () => {
    it('falls back to starting after user’s last sent message with labeled explanation', () => {
      const rawChat = `
[10/10/2026, 09:00:00] Sarah: Good morning
[10/10/2026, 09:05:00] Udit: I have merged the PR
[10/10/2026, 09:10:00] Sarah: Great, @udit did you test on staging?
[10/10/2026, 09:12:00] Alex: Staging looks ready.
      `.trim();

      const ingest = sniffAndParseChat(rawChat, 'conv_cursor');
      const state = resolveUnreadCursor(ingest.messages, 'conv_cursor', ['Udit']);
      expect(state.cursorSource).toBe('last_own_reply_fallback');
      expect(state.cursorExplanation).toContain('Fallback: Starting after your last sent message');
      
      const unread = getUnreadMessages(ingest.messages, state);
      expect(unread.length).toBe(2);
      expect(unread[0].sender).toBe('Sarah');
      expect(unread[1].sender).toBe('Alex');
    });

    it('honors manual cursor position when specified by user', () => {
      const rawChat = `
[10/10/2026, 09:00:00] Sarah: Msg 1
[10/10/2026, 09:05:00] John: Msg 2
[10/10/2026, 09:10:00] Sarah: Msg 3
      `.trim();

      const ingest = sniffAndParseChat(rawChat, 'manual_conv');
      const manualId = ingest.messages[0].id;
      const state = resolveUnreadCursor(ingest.messages, 'manual_conv', ['Udit'], manualId);
      expect(state.cursorSource).toBe('user_manual');
      
      const unread = getUnreadMessages(ingest.messages, state);
      expect(unread.length).toBe(2);
    });
  });

  // --- 3. L1 Deterministic Signals & Edge Cases ---
  describe('L1 Signal Layer', () => {
    it('resolves relative dates relative to message timestamp (Edge case E1)', () => {
      const messageTs = '2026-10-15T10:00:00.000Z';
      const resolved = resolveRelativeDate('Deadline is tomorrow at 3pm', messageTs, 'UTC');
      expect(resolved).not.toBeNull();
      expect(resolved?.isUnclearDate).toBe(false);
      
      const targetDate = new Date(resolved!.iso);
      expect(targetDate.getUTCDate()).toBe(16); // Day 15 + 1 = 16
    });

    it('marks ambiguous dates as unclear rather than hallucinating (Edge case E1)', () => {
      const messageTs = '2026-10-15T10:00:00.000Z';
      const resolved = resolveRelativeDate('We will sync after the exam', messageTs, 'UTC');
      expect(resolved).not.toBeNull();
      expect(resolved?.isUnclearDate).toBe(true);
    });

    it('detects unanswered questions directed at user', () => {
      const rawChat = `
[10/10/2026, 11:00:00] Sarah: @udit what is the status of the database migration?
[10/10/2026, 11:05:00] Dave: I think Sarah asked a good question.
      `.trim();

      const ingest = sniffAndParseChat(rawChat, 'unanswered_conv');
      const l1 = extractL1Signals(ingest.messages, testProfile, DEFAULT_CONFIG);
      expect(l1.unansweredQuestionsCount).toBe(1);
      expect(l1.items[0].kind).toBe('question_for_user');
      expect(l1.items[0].relevanceToMe.score).toBe(1.0);
    });

    it('penalizes false urgency shouting (Edge case E6)', () => {
      const shoutText = 'URGENT URGENT PLEASE FIX THIS RIGHT NOW IMMEDIATELY!!!';
      const ratio = calculateShoutingRatio(shoutText, DEFAULT_CONFIG);
      expect(ratio).toBeGreaterThan(0.6);
    });
  });

  // --- 4. L3 Grounding Verifier ---
  describe('L3 Grounding Verifier', () => {
    it('verifies items with exact or normalized source quotes', () => {
      const rawChat = `[10/10/2026, 12:00:00] Manager: We agreed to launch the beta next Friday.`;
      const ingest = sniffAndParseChat(rawChat, 'ground_conv');
      const item: Item = {
        id: 'test_item',
        kind: 'decision',
        title: 'Launch beta',
        detail: 'Launch beta next Friday',
        status: 'open',
        evidence: [{ messageId: ingest.messages[0].id, quote: 'We agreed to launch' }],
        signals: [],
        urgency: { score: 0.5, level: 'normal', explanation: 'Decision' },
        relevanceToMe: { score: 0.5, explanation: 'Team' },
        createdFrom: { engine: 'rule', timestamp: new Date().toISOString() },
      };

      const result = verifyItemsGrounding([item], ingest.messages);
      expect(result.allGrounded).toBe(true);
      expect(result.verifiedItems.length).toBe(1);
    });

    it('strictly downgrades items with hallucinated quotes to unverified (Prime Directive 4)', () => {
      const rawChat = `[10/10/2026, 12:00:00] Manager: We will review the budget.`;
      const ingest = sniffAndParseChat(rawChat, 'hallucination_conv');
      const fakeItem: Item = {
        id: 'fake_item',
        kind: 'deadline',
        title: 'Fake Deadline',
        detail: 'Fabricated quote',
        status: 'open',
        evidence: [{ messageId: ingest.messages[0].id, quote: 'Deliver the client prototype by 5pm' }],
        signals: [],
        urgency: { score: 0.9, level: 'critical', explanation: 'Fake' },
        relevanceToMe: { score: 0.5, explanation: 'Fake' },
        createdFrom: { engine: 'llm', timestamp: new Date().toISOString() },
      };

      const result = verifyItemsGrounding([fakeItem], ingest.messages);
      expect(result.allGrounded).toBe(false);
      expect(result.unverifiedItems.length).toBe(1);
      expect(result.unverifiedItems[0].status).toBe('unverified');
    });
  });

  // --- 5. L4 Explainable Urgency Scoring ---
  describe('L4 Scoring & Overdue Saturation', () => {
    it('saturates overdue items to critical with explicit explanation', () => {
      const pastDateIso = new Date(Date.now() - 3600 * 1000 * 2).toISOString(); // 2 hours ago
      const item: Item = {
        id: 'overdue_item',
        kind: 'deadline',
        title: 'Project Submission',
        detail: 'Submit report',
        status: 'open',
        due: { iso: pastDateIso, confidence: 1.0, rawPhrase: 'by 2 hours ago' },
        evidence: [],
        signals: [],
        urgency: { score: 0.5, level: 'normal', explanation: '' },
        relevanceToMe: { score: 0.8, explanation: '' },
        createdFrom: { engine: 'rule', timestamp: new Date().toISOString() },
      };

      const scored = calculateItemUrgency(item, DEFAULT_CONFIG, new Date());
      expect(scored.level).toBe('critical');
      expect(scored.score).toBeGreaterThanOrEqual(0.9);
      expect(scored.explanation).toContain('CRITICAL');
    });
  });

  // --- 6. Security Egress Guard ---
  describe('Local-First Egress Guard', () => {
    it('allows loopback and localhost requests', () => {
      expect(egressGuard.isLoopback('http://127.0.0.1:11434/api/tags')).toBe(true);
      expect(egressGuard.isLoopback('http://localhost:5173/assets/index.js')).toBe(true);
      expect(egressGuard.isLoopback('/local-route')).toBe(true);
    });

    it('strictly identifies and rejects external cloud domains', () => {
      expect(egressGuard.isLoopback('https://api.openai.com/v1/chat/completions')).toBe(false);
      expect(egressGuard.isLoopback('https://telemetry.analytics.com/track')).toBe(false);
      expect(egressGuard.isLoopback('https://fonts.googleapis.com/css')).toBe(false);
    });
  });

  // --- 7. Metamorphic Test ---
  describe('Metamorphic Tests (§8 & Prime Directive 1)', () => {
    it('dynamically adapts when participants are renamed and timestamps shifted by 3 days', () => {
      // 15/10/2026 unambiguously proves DMY (15 > 12)
      const originalChat = `
[15/10/2026, 10:00:00] Alice: @udit please review the budget by tomorrow.
      `.trim();

      const shiftedChat = `
[18/10/2026, 10:00:00] Zara: @udit please review the budget by tomorrow.
      `.trim();

      const ingest1 = sniffAndParseChat(originalChat, 'conv_1');
      const ingest2 = sniffAndParseChat(shiftedChat, 'conv_2');

      const l1_1 = extractL1Signals(ingest1.messages, testProfile, DEFAULT_CONFIG);
      const l1_2 = extractL1Signals(ingest2.messages, testProfile, DEFAULT_CONFIG);

      // Outputs must differ dynamically reflecting shifted dates and renamed participant
      expect(ingest1.participants).toEqual(['Alice']);
      expect(ingest2.participants).toEqual(['Zara']);

      const due1 = new Date(l1_1.items[0].due!.iso);
      const due2 = new Date(l1_2.items[0].due!.iso);

      const dayDifference = Math.round((due2.getTime() - due1.getTime()) / (86400 * 1000));
      expect(dayDifference).toBe(3); // Exactly 3 days shifted!
    });
  });
});
