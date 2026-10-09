/**
 * L1 Deterministic Signal Layer (Instant, Zero Model Dependency)
 * Extracts temporal dates, user mentions, unanswered asks, and structural markers.
 * Strictly ZERO hardcoded urgency keyword lists.
 * Why: Delivers 0ms baseline triage, works completely offline, anchors LLM against hallucinations.
 */

import { Message, IdentityProfile, Item, ItemSignal } from '../types/schema';
import { AppConfig } from '../config';

export interface L1AnalysisResult {
  items: Item[];
  unansweredQuestionsCount: number;
  directMentionsCount: number;
  upcomingDeadlinesCount: number;
}

/**
 * Resolves temporal expressions relative to message's own timestamp
 * Why: Edge Case E1. "Tomorrow" sent on Friday means Saturday, not system clock tomorrow.
 */
/**
 * Sanitizes and truncates detail text to prevent unformatted markdown dumps
 * Why: Keeps card previews executive, clean, and concise without 15KB document dumps
 */
export function cleanDetailText(raw: string, maxLen = 280): string {
  const clean = raw.replace(/^#+\s*/gm, '').replace(/\r?\n+/g, ' ').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen).trim() + '...' : clean;
}

export function resolveRelativeDate(
  phrase: string,
  referenceTsIso: string,
  _userTimezone: string
): { iso: string; confidence: number; isUnclearDate: boolean } | null {
  const ref = new Date(referenceTsIso);
  if (isNaN(ref.getTime())) return null;

  const lower = phrase.toLowerCase().trim();

  // Pattern 1: "tomorrow" / "kal"
  if (/\b(tomorrow|kal)\b/i.test(lower)) {
    const target = new Date(ref);
    target.setDate(target.getDate() + 1);
    // Check if time is specified (e.g., "tomorrow at 3pm", "kal 15:00")
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch && !timeMatch[0].includes('tomorrow') && !timeMatch[0].includes('kal')) {
      let hours = parseInt(timeMatch[1], 10);
      const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      if (timeMatch[3]?.toLowerCase() === 'pm' && hours < 12) hours += 12;
      if (timeMatch[3]?.toLowerCase() === 'am' && hours === 12) hours = 0;
      target.setHours(hours, mins, 0, 0);
    } else {
      // Default to EOD 18:00
      target.setHours(18, 0, 0, 0);
    }
    return { iso: target.toISOString(), confidence: 0.9, isUnclearDate: false };
  }

  // Pattern 1b: "parso" (day after tomorrow)
  if (/\bparso\b/i.test(lower)) {
    const target = new Date(ref);
    target.setDate(target.getDate() + 2);
    target.setHours(18, 0, 0, 0);
    return { iso: target.toISOString(), confidence: 0.9, isUnclearDate: false };
  }

  // Pattern 2: "EOD" / "end of day" / "aaj"
  if (/\b(eod|end of day|by tonight|aaj\s+raat|aaj)\b/i.test(lower)) {
    const target = new Date(ref);
    target.setHours(18, 0, 0, 0); // 6:00 PM standard EOD
    return { iso: target.toISOString(), confidence: 0.85, isUnclearDate: false };
  }

  // Pattern 3: "in X hours" / "in X days"
  const inHoursMatch = lower.match(/in\s+(\d+)\s*(?:hour|hr|h)s?/i);
  if (inHoursMatch) {
    const hours = parseInt(inHoursMatch[1], 10);
    const target = new Date(ref.getTime() + hours * 3600 * 1000);
    return { iso: target.toISOString(), confidence: 0.95, isUnclearDate: false };
  }

  const inDaysMatch = lower.match(/in\s+(\d+)\s*(?:day|d)s?/i);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    const target = new Date(ref.getTime() + days * 86400 * 1000);
    return { iso: target.toISOString(), confidence: 0.9, isUnclearDate: false };
  }

  // Pattern 4: Day of week: "by Monday", "next Friday"
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let d = 0; d < dayNames.length; d++) {
    const dayRegex = new RegExp(`(?:by|on|next)\\s+${dayNames[d]}`, 'i');
    if (dayRegex.test(lower)) {
      const currentDay = ref.getDay();
      let diff = d - currentDay;
      if (diff <= 0) diff += 7; // Next occurrence
      const target = new Date(ref);
      target.setDate(target.getDate() + diff);
      target.setHours(18, 0, 0, 0);
      return { iso: target.toISOString(), confidence: 0.85, isUnclearDate: false };
    }
  }

  // Pattern 5: Explicit date format: "2026-10-15" or "15/10/2026"
  const isoMatch = lower.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) {
    const parsed = new Date(isoMatch[0]);
    if (!isNaN(parsed.getTime())) {
      return { iso: parsed.toISOString(), confidence: 0.95, isUnclearDate: false };
    }
  }

  // Ambiguous date phrases (Edge Case E1): "after the exam", "later this week", "soon"
  if (/\b(after\s+the\s+\w+|later\s+this\s+week|sometime\s+next\s+week)\b/i.test(lower)) {
    return { iso: ref.toISOString(), confidence: 0.3, isUnclearDate: true };
  }

  return null;
}

export function isUserMentioned(text: string, profile: IdentityProfile): boolean {
  const allAliases = [...profile.names, ...profile.aliases, ...profile.handles].filter(Boolean);
  if (allAliases.length === 0) return false;

  const lower = text.toLowerCase();
  return allAliases.some(alias => {
    const clean = alias.toLowerCase().trim();
    if (!clean) return false;
    // Word boundary match or @handle match
    const regex = new RegExp(`(?:^|\\s|[@])(${clean.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})(?:$|\\s|[.,!?:])`, 'i');
    return regex.test(lower);
  });
}

/**
 * Checks if a message text directly mentions any alias in user's profile
 * Or indirectly addresses the user in 1-on-1 conversations (Edge Case E7)
 * Why: C4 and §5.4. Mentions aren't always explicit @handles in direct conversations.
 */
export function isUserAddressed(
  text: string,
  profile: IdentityProfile,
  isOneOnOne: boolean
): boolean {
  // 1. Direct alias match
  if (isUserMentioned(text, profile)) return true;

  // 2. Indirect addressing in 1:1 conversation (Edge Case E7)
  if (isOneOnOne) {
    const indirectPattern = /^(?:can\s+you|could\s+you|please|did\s+you|have\s+you|will\s+you|would\s+you)\b/i;
    if (indirectPattern.test(text.trim())) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a message text is a deletion marker or forwarded (Edge Case E8)
 * Why: Prevents deleted messages or forwarded clips from generating false tasks
 */
export function isSystemOrDeletedMessage(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return (
    lower === 'this message was deleted' ||
    lower === 'you deleted this message' ||
    lower === '<media omitted>' ||
    lower === 'image omitted' ||
    lower === 'video omitted' ||
    lower === 'audio omitted'
  );
}

/**
 * Detects whether text has high capital letters ratio (shouting)
 * Why: Config-driven heuristic for Edge Case E6 (false urgency penalty)
 */
export function calculateShoutingRatio(text: string, config: AppConfig): number {
  const lettersOnly = text.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length < config.heuristics.minLettersForShoutCheck) {
    return 0;
  }
  const upperCount = (lettersOnly.match(/[A-Z]/g) || []).length;
  return upperCount / lettersOnly.length;
}

/**
 * Executes L1 Deterministic Analysis across all unread messages
 * Why: Pure TS deterministic engine runs instantly without models or network
 */
export function extractL1Signals(
  messages: Message[],
  profile: IdentityProfile,
  config: AppConfig,
  referenceNow = new Date()
): L1AnalysisResult {
  const items: Item[] = [];
  let unansweredQuestionsCount = 0;
  let directMentionsCount = 0;
  let upcomingDeadlinesCount = 0;

  const userAliasSet = new Set(
    [...profile.names, ...profile.aliases, ...profile.handles].map(a => a.toLowerCase().trim())
  );

  // Precompute user message indices for O(1) subsequent reply lookup
  const userMessageIndices: number[] = [];
  for (let k = 0; k < messages.length; k++) {
    if (userAliasSet.has(messages[k].sender.toLowerCase().trim())) {
      userMessageIndices.push(k);
    }
  }

  const distinctSenders = new Set(messages.map(m => m.sender.toLowerCase().trim()));
  const isOneOnOne = distinctSenders.size === 2;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const text = msg.text;

    // Edge Case E8: Skip deleted or media-omitted placeholder lines
    if (isSystemOrDeletedMessage(text)) {
      continue;
    }

    const isMe = userAliasSet.has(msg.sender.toLowerCase().trim());
    const mentioned = !isMe && isUserAddressed(text, profile, isOneOnOne);
    const shoutingRatio = calculateShoutingRatio(text, config);

    if (mentioned) {
      directMentionsCount++;
    }

    // --- Signal 1: Question Detection & Unanswered Check ---
    // Supports standard questions and code-mixed inquiry syntax (Edge Case E3)
    const hasQuestionMark = text.includes('?');
    const isCodeMixedQuestion = /\b(kitne\s+baje|kab\s+milte|kidhar\s+h|kese\s+|kaise\s+|kya\s+hai|kya\s+h|kab\s+se|kaha\s+h|kya\s+scene)\b/i.test(text);
    const isQuestion = (hasQuestionMark || isCodeMixedQuestion) && text.length >= config.heuristics.minQuestionLength;

    if (isQuestion && (mentioned || isOneOnOne) && !isMe) {
      // Find first user reply index after this question
      let nextUserMsgIdx = -1;
      for (let u = 0; u < userMessageIndices.length; u++) {
        if (userMessageIndices[u] > i) {
          nextUserMsgIdx = userMessageIndices[u];
          break;
        }
      }

      let hasUserAnswered = false;
      if (nextUserMsgIdx !== -1) {
        const msgGap = nextUserMsgIdx - i;
        const timeGapMs = Math.abs(new Date(messages[nextUserMsgIdx].ts).getTime() - new Date(msg.ts).getTime());
        // Answered if user replied within 10 messages and within 12 hours
        if (msgGap <= 10 && timeGapMs <= 12 * 3600 * 1000) {
          hasUserAnswered = true;
        }
      }

      const signals: ItemSignal[] = [
        {
          name: 'directAddress',
          value: 1.0,
          weight: config.weights.directAddress,
          source: 'rule',
          description: `Direct question asked to you by ${msg.sender}`,
        },
      ];

      if (!hasUserAnswered) {
        unansweredQuestionsCount++;
        signals.push({
          name: 'unansweredAsk',
          value: 1.0,
          weight: config.weights.unansweredAsk,
          source: 'rule',
          description: 'No response from you after this question was asked',
        });
      }

      // False urgency penalty if shouting
      if (shoutingRatio >= config.heuristics.capsLockShoutRatio) {
        signals.push({
          name: 'falseUrgencyPenalty',
          value: shoutingRatio,
          weight: config.weights.falseUrgencyPenalty,
          source: 'rule',
          description: 'Excessive shouting/capitalization penalty applied',
        });
      }

      const quoteSnippet = text.length > 80 ? text.substring(0, 80) : text;

      items.push({
        id: `item_ask_${msg.id}`,
        kind: 'question_for_user',
        title: hasUserAnswered ? `Question: ${msg.sender}` : `Unanswered Ask from ${msg.sender}`,
        detail: cleanDetailText(text),
        owner: profile.names[0] || 'You',
        status: hasUserAnswered ? 'done' : 'open',
        evidence: [{ messageId: msg.id, quote: quoteSnippet }],
        signals,
        urgency: {
          score: hasUserAnswered ? 0.4 : 0.85,
          level: hasUserAnswered ? 'normal' : 'high',
          explanation: hasUserAnswered
            ? `Answered: Question from ${msg.sender} was addressed in subsequent messages.`
            : `High: Question addressed to you by ${msg.sender} with no reply yet.`,
        },
        relevanceToMe: {
          score: 1.0,
          explanation: 'Addressed directly to your handle/name in conversation.',
        },
        createdFrom: {
          engine: 'rule',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // --- Signal 2: Temporal Expressions / Deadlines ---
    const deadlinePattern = /\b(deadline|due\s+by|by\s+tomorrow|by\s+eod|by\s+\w+day|in\s+\d+\s+(?:hour|hr|day)s?|before\s+(?:tomorrow|midnight|noon|eod|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+[\w:]*)|kal\s+milte|kal\s+(?:subah|shaam|raat|ko)?|parso(?:\s+tak)?|aaj\s+raat|aaj\s+shaam)\b/i;
    const deadlineMatch = text.match(deadlinePattern);

    if (deadlineMatch) {
      const resolved = resolveRelativeDate(text, msg.ts, profile.timezone);
      if (resolved) {
        upcomingDeadlinesCount++;
        const dueDate = new Date(resolved.iso);
        const hoursRemaining = (dueDate.getTime() - referenceNow.getTime()) / (3600 * 1000);
        const isOverdue = hoursRemaining < 0;

        const signals: ItemSignal[] = [
          {
            name: 'deadlineProximity',
            value: isOverdue ? 1.0 : Math.max(0, 1 - hoursRemaining / config.horizons.normalDeadlineHours),
            weight: config.weights.deadlineProximity,
            source: 'rule',
            description: isOverdue ? 'Deadline is overdue!' : `Due in ${Math.round(hoursRemaining)} hours`,
          },
        ];

        if (isOverdue) {
          signals.push({
            name: 'overdueSaturation',
            value: 1.0,
            weight: config.weights.overdueSaturation,
            source: 'rule',
            description: 'Task is overdue beyond target timestamp',
          });
        }

        if (mentioned) {
          signals.push({
            name: 'directAddress',
            value: 1.0,
            weight: config.weights.directAddress,
            source: 'rule',
            description: 'You were directly mentioned in this deadline commitment',
          });
        }

        items.push({
          id: `item_dl_${msg.id}`,
          kind: 'deadline',
          title: `Deadline: ${deadlineMatch[0]}`,
          detail: cleanDetailText(text),
          due: {
            iso: resolved.iso,
            confidence: resolved.confidence,
            rawPhrase: deadlineMatch[0],
            isUnclearDate: resolved.isUnclearDate,
          },
          status: isOverdue ? 'overdue' : 'open',
          evidence: [{ messageId: msg.id, quote: deadlineMatch[0] }],
          signals,
          urgency: {
            score: isOverdue ? 0.95 : 0.75,
            level: isOverdue ? 'critical' : 'high',
            explanation: isOverdue 
              ? 'Critical: Deadline is overdue!' 
              : `High: Due approaching at ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}.`,
          },
          relevanceToMe: {
            score: mentioned ? 1.0 : 0.5,
            explanation: mentioned ? 'Mentions you directly' : 'Shared group deadline',
          },
          createdFrom: {
            engine: 'rule',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // --- Signal 3: Decision Markers ---
    const decisionPattern = /\b(we\s+agreed\s+to|let['’]s\s+go\s+with|final\s+decision|approved\s+by|decided\s+to|done\s+(?:bhai|bro|yaar|sir|team)|pakka\s+done|chal\s+done|final\s+hai|theek\s+h(?:ai)?|thik\s+h(?:h|ai)?|sahi\s+h(?:ai)?|deal\s+done|lelo\s+sabkoo)\b/i;
    const decMatch = text.match(decisionPattern);
    if (decMatch) {
      items.push({
        id: `item_dec_${msg.id}`,
        kind: 'decision',
        title: `Decision by ${msg.sender}`,
        detail: cleanDetailText(text),
        owner: msg.sender,
        status: 'open',
        evidence: [{ messageId: msg.id, quote: decMatch[0] }],
        signals: [
          {
            name: 'imperativeAction',
            value: 0.8,
            weight: config.weights.imperativeAction,
            source: 'rule',
            description: 'Decision consensus marker identified',
          },
        ],
        urgency: {
          score: 0.45,
          level: 'normal',
          explanation: `Decision finalized by ${msg.sender}`,
        },
        relevanceToMe: {
          score: mentioned ? 0.9 : 0.4,
          explanation: mentioned ? 'Involves your project area' : 'Team decision notice',
        },
        createdFrom: {
          engine: 'rule',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // --- Signal 4: Action Items & Commitments ---
    const actionPattern = /\b(please\s+\w+|can\s+you\s+\w+|make\s+sure\s+to|remember\s+to|action\s+item|todo:?|assigned\s+to|i\s+will\s+\w+|i['’]ll\s+\w+|will\s+(?:send|share|check|update|submit|call|book|verify|review|handle|do)|karta\s+hu|karti\s+hu|karunga|karungi|karlenge|kardenge|bhejta\s+hu|bhej\s+dunga|bhej\s+dena|bhej\s+de|bhejdo|send\s+kar|check\s+kar|dekh\s+let?a\s+hu|submit\s+kar|fill\s+kar|book\s+kar|register\s+kar|kardena|baat\s+karunga)\b/i;
    const actionMatch = text.match(actionPattern);
    if (actionMatch && !deadlineMatch) {
      const actionSignals: ItemSignal[] = [
        {
          name: 'imperativeAction',
          value: 0.9,
          weight: config.weights.imperativeAction,
          source: 'rule',
          description: 'Imperative task commitment detected',
        },
        ...(mentioned ? [{
          name: 'directAddress',
          value: 1.0,
          weight: config.weights.directAddress,
          source: 'rule' as const,
          description: 'Assigned directly to you',
        }] : []),
      ];

      // Edge case E6: False urgency penalty for shouting
      if (shoutingRatio >= config.heuristics.capsLockShoutRatio) {
        actionSignals.push({
          name: 'falseUrgencyPenalty',
          value: shoutingRatio,
          weight: config.weights.falseUrgencyPenalty,
          source: 'rule',
          description: 'Excessive shouting/capitalization penalty applied',
        });
      }

      const isUserCommitment = isMe && /\b(i\s+will|i['’]ll|karunga|karta\s+hu|bhejta\s+hu)\b/i.test(text);
      const isTaskForUser = mentioned || isUserCommitment;
      const owner = isTaskForUser ? (profile.names[0] || 'You') : msg.sender;

      items.push({
        id: `item_act_${msg.id}`,
        kind: 'action_item',
        title: `Action: ${msg.sender}`,
        detail: cleanDetailText(text),
        owner,
        status: 'open',
        evidence: [{ messageId: msg.id, quote: actionMatch[0] }],
        signals: actionSignals,
        urgency: {
          score: isTaskForUser ? 0.75 : 0.5,
          level: isTaskForUser ? 'high' : 'normal',
          explanation: isTaskForUser ? 'Task assigned directly to you' : 'Team action commitment',
        },
        relevanceToMe: {
          score: isTaskForUser ? 1.0 : 0.4,
          explanation: isTaskForUser ? 'Direct action required from you' : 'General team task',
        },
        createdFrom: {
          engine: 'rule',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // --- Signal 5: Shared Links & Key Resources ---
    const urlMatch = text.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) {
      let domain = 'link';
      try {
        const u = new URL(urlMatch[0]);
        domain = u.hostname.replace(/^www\./, '');
      } catch {}

      items.push({
        id: `item_res_${msg.id}`,
        kind: 'important_message',
        title: `Resource: ${domain}`,
        detail: cleanDetailText(text),
        owner: msg.sender,
        status: 'open',
        evidence: [{ messageId: msg.id, quote: urlMatch[0] }],
        signals: [
          {
            name: 'directAddress',
            value: 0.7,
            weight: config.weights.directAddress,
            source: 'rule',
            description: `Shared resource link from ${msg.sender}`,
          },
        ],
        urgency: {
          score: 0.45,
          level: 'normal',
          explanation: `Shared document or portal link by ${msg.sender}`,
        },
        relevanceToMe: {
          score: mentioned ? 0.8 : 0.5,
          explanation: 'Referenced link in team discussion',
        },
        createdFrom: {
          engine: 'rule',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  return {
    items,
    unansweredQuestionsCount,
    directMentionsCount,
    upcomingDeadlinesCount,
  };
}
