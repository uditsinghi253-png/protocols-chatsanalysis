/**
 * Ghosted Threads Detector
 * Identifies unreturned inquiries, dropped threads, and asymmetric responsiveness.
 * Why: High-impact executive intelligence on who owes whom a response and dropped asks.
 */

import { Message, IdentityProfile, GhostedThread } from '../types/schema';

export function detectGhostedThreads(
  messages: Message[],
  profile: IdentityProfile,
  referenceNow = new Date()
): GhostedThread[] {
  if (messages.length === 0) return [];

  const userAliasSet = new Set(
    [...profile.names, ...profile.aliases, ...profile.handles].map(a => a.toLowerCase().trim())
  );

  const threads: GhostedThread[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const text = msg.text.trim();

    // Skip deletion markers or system messages
    if (
      text.includes('omitted') ||
      text.includes('deleted this message') ||
      text.includes('message was deleted') ||
      text.length < 4
    ) {
      continue;
    }

    const isQuestion = text.includes('?') || /\b(kitne|kaha|kab|kya|kaise|why|when|where|what|how)\b/i.test(text);
    const isActionRequest = /\b(can you|please|pls|bhej de|bhej dena|kardena|check kar|send kar|dekh liyo)\b/i.test(text);

    if (!isQuestion && !isActionRequest) {
      continue;
    }

    const isMe = userAliasSet.has(msg.sender.toLowerCase().trim());
    const sender = isMe ? (profile.names[0] || 'You') : msg.sender;

    // Look for counterparty response
    let nextReplyIdx = -1;
    let nextReplyMsg: Message | null = null;

    for (let j = i + 1; j < messages.length; j++) {
      const candidateIsMe = userAliasSet.has(messages[j].sender.toLowerCase().trim());
      // Counterparty reply is when sender's "me-ness" flips
      if (candidateIsMe !== isMe) {
        nextReplyIdx = j;
        nextReplyMsg = messages[j];
        break;
      }
    }

    const msgTime = new Date(msg.ts).getTime();
    const refTime = referenceNow.getTime();

    if (nextReplyIdx === -1) {
      // Thread ended with no counterparty reply
      const hoursSilent = Math.max(1, Math.round((refTime - msgTime) / (3600 * 1000)));
      const daysSilent = parseFloat((hoursSilent / 24).toFixed(1));

      // Consider ghosted if silent for at least 12 hours (or in final export batch)
      if (hoursSilent >= 12 || i === messages.length - 1) {
        const isOutgoing = isMe; // If I asked, counterparty ghosted me
        const recipient = isMe ? (messages.find(m => !userAliasSet.has(m.sender.toLowerCase().trim()))?.sender || 'Counterparty') : (profile.names[0] || 'You');

        let inquiryType: GhostedThread['inquiryType'] = 'information_request';
        if (/\b(final|finalize|finalized|decision|agreed|pakka)\b/i.test(text)) inquiryType = 'decision_needed';
        else if (isActionRequest) inquiryType = 'action_request';
        else if (/\b(milte|call|meet|zoom|gmeet)\b/i.test(text)) inquiryType = 'meeting_request';

        let severity: GhostedThread['severity'] = 'normal';
        if (daysSilent >= 3 || inquiryType === 'decision_needed') severity = 'high';
        if (daysSilent >= 7 || text.includes('deadline') || text.includes('urgent')) severity = 'critical';

        let suggestedAction = isOutgoing
          ? `Ping ${recipient}: "Following up on: ${text.slice(0, 30)}..."`
          : `Reply to ${sender}: Acknowledge or close loop`;

        threads.push({
          id: `ghost_${msg.id}`,
          sourceMessageId: msg.id,
          sender,
          recipient,
          isOutgoing,
          text,
          ts: msg.ts,
          daysSilent,
          hoursSilent,
          severity,
          inquiryType,
          suggestedAction,
        });
      }
    } else if (nextReplyMsg) {
      // Reply came after a massive delay (> 24 hours)
      const replyTime = new Date(nextReplyMsg.ts).getTime();
      const delayHours = (replyTime - msgTime) / (3600 * 1000);

      if (delayHours >= 24) {
        const daysSilent = parseFloat((delayHours / 24).toFixed(1));
        const isOutgoing = isMe;
        const recipient = nextReplyMsg.sender;

        threads.push({
          id: `ghost_hist_${msg.id}`,
          sourceMessageId: msg.id,
          sender,
          recipient,
          isOutgoing,
          text,
          ts: msg.ts,
          daysSilent,
          hoursSilent: Math.round(delayHours),
          severity: delayHours > 72 ? 'high' : 'normal',
          inquiryType: 'information_request',
          suggestedAction: `Historical ${daysSilent}d gap before resolution`,
        });
      }
    }
  }

  // Sort: open unresolved ghosts first, then highest silence duration
  return threads.sort((a, b) => b.hoursSilent - a.hoursSilent);
}
