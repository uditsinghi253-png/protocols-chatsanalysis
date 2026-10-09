/**
 * Hierarchical Conversation Summarizer
 * Generates concise "While you were away" summaries for unread chats.
 * Gracefully degrades to factual structured rollup when local LLM is offline.
 * Why: Hard constraint C1 & Edge Case E4 (long conversations exceeding context window).
 */

import { Message, Item, TriageSummary } from '../types/schema';
import { AppConfig } from '../config';

/**
 * Generates deterministic structured summary based on extracted items and conversation metadata
 * Why: Prime Directive 7. Guarantee a useful, factual summary in 0ms with zero hallucinations.
 */
export function generateDeterministicSummary(
  unreadMessages: Message[],
  items: Item[],
  conversationId: string
): TriageSummary {
  if (unreadMessages.length === 0) {
    return {
      conversationId,
      unreadCount: 0,
      timeRange: { from: new Date().toISOString(), to: new Date().toISOString() },
      overallSummary: 'You are all caught up! No unread messages in this conversation.',
      keyTopics: [],
      readingTimeMinutes: 0,
      engineUsed: 'deterministic_rule',
      generatedAt: new Date().toISOString(),
    };
  }

  const fromTs = unreadMessages[0].ts;
  const toTs = unreadMessages[unreadMessages.length - 1].ts;

  const participants = Array.from(new Set(unreadMessages.map(m => m.sender)));
  const totalWords = unreadMessages.reduce((sum, m) => sum + m.text.split(/\s+/).length, 0);
  const readingTime = Math.max(1, Math.ceil(totalWords / 200));

  const questions = items.filter(it => it.kind === 'question_for_user');
  const deadlines = items.filter(it => it.kind === 'deadline');
  const decisions = items.filter(it => it.kind === 'decision');
  const actionItems = items.filter(it => it.kind === 'action_item');

  const summaryParts: string[] = [];
  summaryParts.push(
    `Across ${unreadMessages.length} unread messages between ${new Date(fromTs).toLocaleTimeString()} and ${new Date(toTs).toLocaleTimeString()}, ${participants.length} participants (${participants.slice(0, 4).join(', ')}${participants.length > 4 ? '...' : ''}) were active.`
  );

  if (questions.length > 0) {
    summaryParts.push(
      `🚨 You have ${questions.length} unanswered question${questions.length > 1 ? 's' : ''} awaiting your direct reply.`
    );
  }

  if (deadlines.length > 0) {
    const overdue = deadlines.filter(d => d.status === 'overdue');
    if (overdue.length > 0) {
      summaryParts.push(`⚠️ ${overdue.length} deadline${overdue.length > 1 ? 's are' : ' is'} overdue!`);
    } else {
      summaryParts.push(`⏳ ${deadlines.length} upcoming deadline${deadlines.length > 1 ? 's' : ''} noted.`);
    }
  }

  if (decisions.length > 0) {
    summaryParts.push(`⚖️ ${decisions.length} decision${decisions.length > 1 ? 's were' : ' was'} agreed upon.`);
  }

  if (actionItems.length > 0) {
    summaryParts.push(`📋 ${actionItems.length} action item${actionItems.length > 1 ? 's' : ''} assigned.`);
  }

  const keyTopics = [
    ...questions.map(q => q.title),
    ...decisions.map(d => d.title),
    ...deadlines.map(d => d.title),
  ].slice(0, 5);

  return {
    conversationId,
    unreadCount: unreadMessages.length,
    timeRange: { from: fromTs, to: toTs },
    overallSummary: summaryParts.join(' '),
    keyTopics,
    readingTimeMinutes: readingTime,
    engineUsed: 'deterministic_rule',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Splits unread messages into token-budgeted chunks for hierarchical map-reduce
 * Why: Edge Case E4. Prevents model context overflow without dropping messages.
 */
export function segmentMessagesByContextBudget(
  messages: Message[],
  config: AppConfig,
  modelContextTokens?: number
): Message[][] {
  const maxTokens = (modelContextTokens || config.runtime.maxContextTokensDefault) * 
    (1 - config.runtime.contextSafetyMarginPercent / 100);

  const approxCharsPerToken = 4;
  const maxChars = maxTokens * approxCharsPerToken;

  const chunks: Message[][] = [];
  let currentChunk: Message[] = [];
  let currentChunkChars = 0;

  for (const msg of messages) {
    const msgChars = msg.text.length + msg.sender.length + 30;
    if (currentChunkChars + msgChars > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk);
      // Retain 1-message overlap for context continuity
      currentChunk = [currentChunk[currentChunk.length - 1], msg];
      currentChunkChars = currentChunk.reduce((s, m) => s + m.text.length + 30, 0);
    } else {
      currentChunk.push(msg);
      currentChunkChars += msgChars;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
