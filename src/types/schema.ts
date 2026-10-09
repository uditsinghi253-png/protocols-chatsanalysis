/**
 * Core Data Schemas for "What Did I Miss?"
 * Every schema is strictly typed with no hardcoded values.
 * Why: Typed schemas prevent vague runtime data bugs and enforce end-to-end grounding.
 */

export interface Message {
  id: string; // Stable hash: sha256(source + ts + sender + text + ordinal)
  conversationId: string;
  ts: string; // ISO-8601 string normalized with detected timezone
  sender: string; // Raw sender label from export
  senderId: string; // Normalized participant identifier
  text: string;
  replyToId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  ordinal: number;
  raw?: unknown;
}

export interface Participant {
  id: string;
  labels: string[];
  isMe: boolean;
  firstSeen: string;
  stats: {
    messageCount: number;
    replyLatencyMedianMs?: number;
  };
}

export interface IdentityProfile {
  names: string[];
  aliases: string[];
  handles: string[];
  timezone: string; // E.g., Intl.DateTimeFormat().resolvedOptions().timeZone
  locale: string; // E.g., navigator.language
  confirmedByUser: boolean;
}

export type ItemKind = 
  | 'action_item' 
  | 'decision' 
  | 'deadline' 
  | 'important_message' 
  | 'question_for_user';

export type ItemStatus = 
  | 'open' 
  | 'done' 
  | 'superseded' 
  | 'overdue' 
  | 'unverified';

export interface EvidenceCitation {
  messageId: string;
  quote: string; // Verifiable substring of message.text
}

export interface ItemSignal {
  name: string;
  value: number; // 0.0 to 1.0
  weight: number;
  source: 'rule' | 'llm' | 'history';
  description: string;
}

export interface ItemFlagger {
  id: string;
  type: 'ghost_risk' | 'blocking' | 'high_velocity' | 'overdue_risk' | 'resource_anchor';
  label: string;
  explanation: string;
}

export interface Item {
  id: string;
  kind: ItemKind;
  title: string;
  detail: string;
  owner?: string; // Participant label or id
  due?: {
    iso: string;
    confidence: number;
    rawPhrase: string;
    isUnclearDate?: boolean;
  };
  status: ItemStatus;
  evidence: EvidenceCitation[]; // REQUIRED: must pass L3 grounding
  supersedes?: string[]; // IDs of superseded items (Edge case E2)
  supersededBy?: string; // ID of new item that superseded this
  signals: ItemSignal[];
  flaggers?: ItemFlagger[];
  stats?: {
    replyLatencyMin?: number;
    burstVelocity?: number;
  };
  urgency: {
    score: number; // 0.0 to 1.0
    level: 'critical' | 'high' | 'normal' | 'low';
    explanation: string; // Visible human-readable "Why"
  };
  relevanceToMe: {
    score: number;
    explanation: string;
  };
  createdFrom: {
    engine: 'rule' | 'llm';
    modelId?: string;
    timestamp: string;
  };
}

export interface GhostedThread {
  id: string;
  sourceMessageId: string;
  sender: string;
  recipient: string;
  isOutgoing: boolean; // true if you asked and counterparty ghosted; false if counterparty asked and you ghosted
  text: string;
  ts: string;
  daysSilent: number;
  hoursSilent: number;
  severity: 'critical' | 'high' | 'normal';
  inquiryType: 'decision_needed' | 'information_request' | 'action_request' | 'meeting_request';
  suggestedAction: string;
}

export interface WrappedAnalytics {
  totalMessages: number;
  totalWords: number;
  dateRange: {
    start: string;
    end: string;
    daysCount: number;
  };
  participants: Array<{
    name: string;
    messageCount: number;
    wordCount: number;
    percentage: number;
    medianReplyMinutes: number;
    actionsCommitted: number;
    questionsAsked: number;
  }>;
  peakActivity: {
    busiestDate: string;
    busiestDateCount: number;
    busiestHourOfDay: number;
    fastestExchangeMsgsIn10Min: number;
  };
  conversationArchetype: {
    title: string;
    subtitle: string;
    dynamicDescription: string;
  };
  metrics: {
    decisionsFinalized: number;
    commitmentsTotal: number;
    linksShared: number;
    ghostedCount: number;
    balanceParityRatio: number;
  };
  topKeywords: Array<{ word: string; count: number }>;
  topDomains: Array<{ domain: string; count: number }>;
}

export interface ConversationState {
  id: string;
  name: string;
  totalMessages: number;
  cursorMessageId?: string;
  cursorSource: 'read_marker' | 'user_manual' | 'last_own_reply_fallback';
  cursorExplanation: string;
  lastAnalyzedAt?: string;
}

export interface TriageSummary {
  conversationId: string;
  unreadCount: number;
  timeRange: {
    from: string;
    to: string;
  };
  overallSummary: string;
  keyTopics: string[];
  readingTimeMinutes: number;
  engineUsed: 'deterministic_rule' | 'local_llm';
  generatedAt: string;
}

export interface EgressLogEntry {
  id: string;
  timestamp: string;
  url: string;
  method: string;
  status: 'allowed_loopback' | 'blocked_external';
  reason: string;
}

export interface EgressStats {
  totalOutboundAttempts: number;
  loopbackRequests: number;
  blockedRequests: number;
  cspActive: boolean;
  isAirplanModeVerified: boolean;
  logs: EgressLogEntry[];
}

export interface RuntimeProbeResult {
  engineType: 'ollama' | 'lmstudio' | 'none';
  endpoint: string;
  availableModels: Array<{
    name: string;
    contextLength?: number;
    sizeBytes?: number;
  }>;
  activeModel?: string;
  latencyMs?: number;
  isOnline: boolean;
}
