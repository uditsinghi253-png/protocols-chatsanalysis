/**
 * End-to-End Triage Pipeline Orchestrator
 * Coordinates Ingest -> Normalization -> L1 Rules -> L2 Local LLM -> L3 Grounding -> L4 Scoring -> Summary.
 * Why: Ties together the entire architecture into an auditable, progressive vertical slice.
 */

import { sniffAndParseChat } from '../adapters/sniffer';
import { resolveUnreadCursor, getUnreadMessages, getScopedMessages, TriageScope } from './cursor';
import { extractL1Signals } from './deterministicSignals';
import { modelRuntime } from './modelRuntime';
import { verifyItemsGrounding } from './groundingVerifier';
import { resolveSupersessions } from './supersession';
import { rescoreAllItems } from './scoring';
import { generateDeterministicSummary } from './summarizer';
import { Message, Item, IdentityProfile, ConversationState, TriageSummary } from '../types/schema';
import { AppConfig } from '../config';

export interface PipelineOptions {
  rawContent?: string;
  existingMessages?: Message[];
  conversationId?: string;
  profile: IdentityProfile;
  config: AppConfig;
  manualCursorId?: string;
  scope?: TriageScope;
  referenceNow?: Date;
  onProgress?: (stage: string) => void;
}

export interface PipelineResult {
  messages: Message[];
  unreadMessages: Message[];
  conversationState: ConversationState;
  scopeUsed: TriageScope;
  items: Item[];
  summary: TriageSummary;
  engineUsed: 'deterministic_rule' | 'local_llm';
  formatDetected: string;
  groundingReport: {
    verifiedCount: number;
    unverifiedCount: number;
    allGrounded: boolean;
  };
  durationMs: number;
}

export async function runTriagePipeline(options: PipelineOptions): Promise<PipelineResult> {
  const startTime = performance.now();
  const convId = options.conversationId || 'active_chat';
  const referenceNow = options.referenceNow || new Date();

  options.onProgress?.('Ingesting and parsing messages...');

  // 1. Ingest / Sniff messages
  let messages: Message[] = [];
  let formatDetected = 'in_memory';

  if (options.rawContent) {
    const ingest = sniffAndParseChat(options.rawContent, convId);
    messages = ingest.messages;
    formatDetected = ingest.formatDetected;
  } else if (options.existingMessages) {
    messages = options.existingMessages;
  }

  // 2. Resolve Unread Cursor & Active Scope Window
  options.onProgress?.('Resolving unread cursor and scope...');
  const userAliases = [...options.profile.names, ...options.profile.aliases, ...options.profile.handles];
  const conversationState = resolveUnreadCursor(messages, convId, userAliases, options.manualCursorId);
  const unreadMessages = getUnreadMessages(messages, conversationState);

  // If unread messages slice is tiny (<= 2) in a large chat and no explicit scope was forced,
  // default to last_7d so the user immediately gets rich, actionable insights
  let scopeUsed: TriageScope = options.scope || 'unread';
  if (!options.scope && unreadMessages.length <= 2 && messages.length > 20) {
    scopeUsed = 'last_7d';
  }

  const activeMessages = getScopedMessages(messages, conversationState, scopeUsed, referenceNow);

  if (activeMessages.length === 0) {
    const emptySummary = generateDeterministicSummary([], [], convId);
    return {
      messages,
      unreadMessages: [],
      conversationState,
      scopeUsed,
      items: [],
      summary: emptySummary,
      engineUsed: 'deterministic_rule',
      formatDetected,
      groundingReport: { verifiedCount: 0, unverifiedCount: 0, allGrounded: true },
      durationMs: Math.round(performance.now() - startTime),
    };
  }

  // 3. L1 Instant Deterministic Signals pass
  options.onProgress?.('Extracting deterministic signals (L1)...');
  const l1Result = extractL1Signals(activeMessages, options.profile, options.config, referenceNow);
  let accumulatedItems = [...l1Result.items];
  let engineUsed: 'deterministic_rule' | 'local_llm' = 'deterministic_rule';
  let llmSummary: string | undefined;

  // 4. L2 Local Model Inference (if active and available)
  const runtimeStatus = modelRuntime.getStatus();
  if (runtimeStatus.isOnline && runtimeStatus.activeModel) {
    options.onProgress?.(`Enriching with local model (${runtimeStatus.activeModel})...`);
    try {
      const llmResult = await modelRuntime.extractWithLocalModel(
        activeMessages,
        options.profile,
        options.config,
        referenceNow
      );
      if (llmResult && llmResult.items.length > 0) {
        accumulatedItems = [...accumulatedItems, ...llmResult.items];
        engineUsed = 'local_llm';
      }
      if (llmResult?.summary) {
        llmSummary = llmResult.summary;
      }
    } catch {
      // Graceful degradation to L1 deterministic layer
    }
  }

  // 5. L3 Grounding Verifier
  options.onProgress?.('Verifying citations and evidence grounding (L3)...');
  const grounding = verifyItemsGrounding(accumulatedItems, activeMessages);
  // Show verified items, keep unverified accessible if requested
  const verifiedItems = grounding.verifiedItems;

  // 5b. Resolve Decision / Deadline Supersessions (Edge Case E2)
  const nonSupersededItems = resolveSupersessions(verifiedItems, activeMessages);

  // 6. L4 Explainable Urgency Scoring
  options.onProgress?.('Calculating explainable urgency scores (L4)...');
  const scoredItems = rescoreAllItems(nonSupersededItems, options.config, referenceNow);

  // 7. Summarization
  options.onProgress?.('Compiling unread triage summary...');
  const summary = generateDeterministicSummary(activeMessages, scoredItems, convId);
  if (llmSummary) {
    summary.overallSummary = `${llmSummary} (${summary.overallSummary})`;
    summary.engineUsed = 'local_llm';
  }

  const durationMs = Math.round(performance.now() - startTime);

  return {
    messages,
    unreadMessages: activeMessages,
    conversationState,
    scopeUsed,
    items: scoredItems,
    summary,
    engineUsed,
    formatDetected,
    groundingReport: {
      verifiedCount: grounding.verifiedItems.length,
      unverifiedCount: grounding.unverifiedItems.length,
      allGrounded: grounding.allGrounded,
    },
    durationMs,
  };
}
