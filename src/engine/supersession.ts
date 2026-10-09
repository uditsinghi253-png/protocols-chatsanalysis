/**
 * Supersession Resolution Engine (Edge Case E2)
 * Detects when subsequent messages update or reverse prior decisions or deadlines.
 * Why: E2 & §5.5 L2. Presenting an outdated decision as active causes catastrophic miscommunication.
 */

import { Item, Message } from '../types/schema';

/**
 * Checks if a later message supersedes or revises an earlier decision or deadline
 * Why: E.g., "actually let's make it Monday instead" retires the previous Friday deadline.
 */
export function resolveSupersessions(items: Item[], messages: Message[]): Item[] {
  if (items.length < 2) return items;

  const msgOrderMap = new Map<string, number>();
  messages.forEach((m, idx) => msgOrderMap.set(m.id, idx));

  // Patterns indicating revision or cancellation
  const revisionPattern = /\b(actually|instead|scratch\s+that|changed\s+my\s+mind|never\s+mind|cancel|moving\s+(?:to|it\s+to)|postponed\s+to)\b/i;

  const updatedItems = [...items];

  for (let i = 0; i < updatedItems.length; i++) {
    const current = updatedItems[i];
    if (current.status === 'superseded') continue;

    for (let j = i + 1; j < updatedItems.length; j++) {
      const later = updatedItems[j];

      // Check if later item is of matching kind (decision or deadline)
      if (
        (current.kind === 'decision' && later.kind === 'decision') ||
        (current.kind === 'deadline' && later.kind === 'deadline')
      ) {
        // Inspect evidence text of the later item
        const laterEvidence = later.evidence[0]?.quote || later.detail;
        if (revisionPattern.test(laterEvidence) || revisionPattern.test(later.detail)) {
          // Link supersession
          current.status = 'superseded';
          current.supersededBy = later.id;
          current.urgency = {
            score: 0.1,
            level: 'low',
            explanation: `Superseded by newer update: "${later.title}"`,
          };

          later.supersedes = later.supersedes || [];
          if (!later.supersedes.includes(current.id)) {
            later.supersedes.push(current.id);
          }
          later.urgency.explanation += ` (Revises prior ${current.kind} from ${current.title})`;
        }
      }
    }
  }

  return updatedItems;
}
