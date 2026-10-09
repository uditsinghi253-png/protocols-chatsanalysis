import { describe, it, expect } from 'vitest';
import { sniffAndParseChat } from '../src/adapters/sniffer';
import { extractL1Signals } from '../src/engine/deterministicSignals';
import { resolveUnreadCursor, getUnreadMessages } from '../src/engine/cursor';
import { runTriagePipeline } from '../src/engine/pipeline';
import { DEFAULT_CONFIG } from '../src/config';
import { IdentityProfile } from '../src/types/schema';
import { execSync } from 'child_process';
import fs from 'fs';

describe('Real User Chat Benchmark (WhatsApp Chat - Rudra.zip)', () => {
  const zipPath = '/Users/uditsinghi/Downloads/WhatsApp Chat - Rudra.zip';

  it('correctly ingests and benchmarks the real user export', () => {
    if (!fs.existsSync(zipPath)) {
      console.warn('Real chat zip not present, skipping benchmark.');
      return;
    }

    const raw = execSync(`unzip -p "${zipPath}" _chat.txt`).toString('utf-8');
    expect(raw.length).toBeGreaterThan(100000);

    const t0 = performance.now();
    const result = sniffAndParseChat(raw, 'real_rudra_chat');
    const tParse = performance.now() - t0;

    console.log(`Parsed ${result.messages.length} real messages in ${tParse.toFixed(2)}ms`);
    console.log(`Format detected: ${result.formatDetected}`);
    console.log(`Participants found:`, result.participants);

    expect(result.messages.length).toBeGreaterThan(100);
    expect(result.participants.length).toBeGreaterThanOrEqual(1);

    // Profile for Udit
    const profile: IdentityProfile = {
      names: ['Udit', 'Udit Jain', 'Udit Singhi'],
      aliases: ['Udit', 'Udit Jain'],
      handles: ['@udit'],
      timezone: 'Asia/Kolkata',
      locale: 'en-US',
      confirmedByUser: true,
    };

    const state = resolveUnreadCursor(result.messages, 'real_rudra_chat', profile.aliases);
    console.log(`Cursor source: ${state.cursorSource} - ${state.cursorExplanation}`);

    const unread = getUnreadMessages(result.messages, state);
    console.log(`Unread messages count: ${unread.length}`);

    const t1 = performance.now();
    const l1 = extractL1Signals(unread.slice(0, 500), profile, DEFAULT_CONFIG);
    const tExtract = performance.now() - t1;

    console.log(`Extracted ${l1.items.length} items from unread in ${tExtract.toFixed(2)}ms`);
    console.log(`Unanswered asks: ${l1.unansweredQuestionsCount}`);
    console.log(`Deadlines: ${l1.upcomingDeadlinesCount}`);

    // Benchmark across Full Conversation (7,097 messages)
    const tFull = performance.now();
    const l1Full = extractL1Signals(result.messages, profile, DEFAULT_CONFIG);
    const dFull = performance.now() - tFull;
    console.log(`\n=== FULL CHAT BENCHMARK (7,097 messages) ===`);
    console.log(`Execution time: ${dFull.toFixed(2)}ms`);
    console.log(`Total items extracted: ${l1Full.items.length}`);
    console.log(`Questions: ${l1Full.items.filter(i => i.kind === 'question_for_user').length}`);
    console.log(`Decisions: ${l1Full.items.filter(i => i.kind === 'decision').length}`);
    console.log(`Deadlines: ${l1Full.items.filter(i => i.kind === 'deadline').length}`);
    console.log(`Action items: ${l1Full.items.filter(i => i.kind === 'action_item').length}`);

    // Inspect the first 10 extracted items from full conversation
    for (let k = 0; k < Math.min(10, l1Full.items.length); k++) {
      const itm = l1Full.items[k];
      const quote = itm.evidence[0]?.quote || '';
      console.log(`  [${itm.kind}] ${itm.title} | Source: "${quote.slice(0, 50)}..."`);
    }

    // Benchmark Scope = 'last_7d' through End-to-End Pipeline
    const t7 = performance.now();
    const pipe7 = runTriagePipeline({
      existingMessages: result.messages,
      profile,
      config: DEFAULT_CONFIG,
      scope: 'last_7d',
    });
    // await the promise
    return pipe7.then(res7 => {
      const d7 = performance.now() - t7;
      console.log(`\n=== LAST 7 DAYS PIPELINE BENCHMARK ===`);
      console.log(`Messages in scope: ${res7.unreadMessages.length}`);
      console.log(`Items extracted: ${res7.items.length}`);
      console.log(`Pipeline duration: ${d7.toFixed(2)}ms (Engine recorded: ${res7.durationMs}ms)`);
      console.log(`Grounding report: verified ${res7.groundingReport.verifiedCount}, unverified ${res7.groundingReport.unverifiedCount}, allGrounded=${res7.groundingReport.allGrounded}`);
      res7.items.forEach(it => {
        console.log(`  - [${it.kind}] ${it.title} (${it.owner}): "${it.evidence[0]?.quote}"`);
      });
      expect(res7.items.length).toBeGreaterThan(0);
      expect(res7.groundingReport.allGrounded).toBe(true);
    });
  });
});
