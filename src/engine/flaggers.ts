/**
 * Statistical Flaggers & Markers Engine
 * Injects interactive diagnostic markers, ghost risks, and velocity tags onto triage items.
 * Why: Elevates card scannability and gives users instant situational context.
 */

import { Item, Message, ItemFlagger } from '../types/schema';

export function enrichItemsWithFlaggers(
  items: Item[],
  messages: Message[],
  referenceNow = new Date()
): Item[] {
  if (items.length === 0) return items;

  const msgMap = new Map<string, Message>();
  for (const m of messages) {
    msgMap.set(m.id, m);
  }

  return items.map(item => {
    const flaggers: ItemFlagger[] = [];
    const sourceMsgId = item.evidence[0]?.messageId;
    const msg = sourceMsgId ? msgMap.get(sourceMsgId) : undefined;
    const text = item.detail.toLowerCase();

    // 1. Ghost Risk Flagger
    if (item.kind === 'question_for_user' && item.status === 'open') {
      const msgTs = msg ? new Date(msg.ts).getTime() : new Date().getTime();
      const hoursWaiting = (referenceNow.getTime() - msgTs) / (3600 * 1000);
      if (hoursWaiting >= 12) {
        const days = Math.round(hoursWaiting / 24);
        flaggers.push({
          id: `flg_ghost_${item.id}`,
          type: 'ghost_risk',
          label: days >= 1 ? `Ghost Risk (${days}d)` : `Ghost Risk (${Math.round(hoursWaiting)}h)`,
          explanation: `Inquiry addressed to you has remained open for ${Math.round(hoursWaiting)} hours without reply.`,
        });
      }
    }

    // 2. Blocking Dependency Flagger
    if (/\b(wait|pehle|blocked|dependency|hold\s+on|let\s+me\s+check|ruko|ruk\s+ja)\b/i.test(text)) {
      flaggers.push({
        id: `flg_block_${item.id}`,
        type: 'blocking',
        label: 'Blocking Dependency',
        explanation: 'Contains dependency gate or conditional hold marker.',
      });
    }

    // 3. High Velocity Flurry Marker
    if (msg) {
      const msgIdx = messages.findIndex(m => m.id === msg.id);
      if (msgIdx !== -1) {
        const prev = messages[Math.max(0, msgIdx - 5)];
        const next = messages[Math.min(messages.length - 1, msgIdx + 5)];
        const spanMs = new Date(next.ts).getTime() - new Date(prev.ts).getTime();
        // If 10 messages occurred within 5 minutes
        if (spanMs <= 5 * 60 * 1000 && spanMs > 0) {
          flaggers.push({
            id: `flg_burst_${item.id}`,
            type: 'high_velocity',
            label: 'High Velocity Flurry',
            explanation: 'Committed during a rapid-fire conversational exchange (< 5 min burst).',
          });
        }
      }
    }

    // 4. Overdue / Approaching Deadline Risk
    if (item.due?.iso) {
      const diffMs = new Date(item.due.iso).getTime() - referenceNow.getTime();
      if (diffMs < 0) {
        flaggers.push({
          id: `flg_overdue_${item.id}`,
          type: 'overdue_risk',
          label: 'Overdue Deadline',
          explanation: 'Target committed deadline timestamp has elapsed.',
        });
      } else if (diffMs <= 24 * 3600 * 1000) {
        flaggers.push({
          id: `flg_urgent_${item.id}`,
          type: 'overdue_risk',
          label: 'Due in < 24h',
          explanation: 'Impending deadline expiring in less than 24 hours.',
        });
      }
    }

    // 5. Persistent Resource Link Anchor
    if (/https?:\/\/[^\s]+/i.test(item.detail) || item.kind === 'important_message') {
      flaggers.push({
        id: `flg_res_${item.id}`,
        type: 'resource_anchor',
        label: 'Resource Anchor',
        explanation: 'Item contains verifiable external document or URL asset link.',
      });
    }

    return {
      ...item,
      flaggers,
    };
  });
}
