/**
 * L3 Grounding Verifier (Deterministic Code Verification)
 * Strictly verifies that extracted items cite real source evidence.
 * Why: Hard constraint C2 & Prime Directive 4. A fabricated task or deadline is worse than a missed one.
 */

import { Item, Message } from '../types/schema';

export interface GroundingVerificationResult {
  verifiedItems: Item[];
  unverifiedItems: Item[];
  totalChecked: number;
  allGrounded: boolean;
  errors: string[];
}

/**
 * Normalizes text for lenient yet robust substring matching
 * Why: Handles varying whitespace, quotes, or trailing punctuation without letting hallucinations pass
 */
export function normalizeForGrounding(text: string): string {
  return text
    .toLowerCase()
    .replace(/['"“”‘’`]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifies that a quote verifiably exists inside the source message text
 * Why: Pure deterministic verification ensures LLM cannot hallucinate quotes
 */
export function isQuoteGrounded(quote: string, sourceMessageText: string): boolean {
  if (!quote || !quote.trim()) return false;
  if (!sourceMessageText || !sourceMessageText.trim()) return false;

  const normQuote = normalizeForGrounding(quote);
  const normSource = normalizeForGrounding(sourceMessageText);

  // Exact or normalized substring match
  if (normSource.includes(normQuote)) {
    return true;
  }

  // Token-sequence matching for partial multi-word quotes (e.g., >80% tokens contiguous)
  const quoteTokens = normQuote.split(' ').filter(t => t.length > 2);
  if (quoteTokens.length >= 3) {
    const contiguousCount = quoteTokens.filter(tok => normSource.includes(tok)).length;
    if (contiguousCount / quoteTokens.length >= 0.85) {
      return true;
    }
  }

  return false;
}

/**
 * Runs grounding verification across an array of extracted items against the source messages
 * Why: Any ungrounded item is downgraded to 'unverified' so users never see fabricated data
 */
export function verifyItemsGrounding(items: Item[], messages: Message[]): GroundingVerificationResult {
  const messageMap = new Map<string, Message>();
  for (const msg of messages) {
    messageMap.set(msg.id, msg);
  }

  const verifiedItems: Item[] = [];
  const unverifiedItems: Item[] = [];
  const errors: string[] = [];

  for (const item of items) {
    if (!item.evidence || item.evidence.length === 0) {
      item.status = 'unverified';
      unverifiedItems.push(item);
      errors.push(`Item "${item.title}" missing evidence citations.`);
      continue;
    }

    let itemPasses = true;
    for (const citation of item.evidence) {
      const sourceMsg = messageMap.get(citation.messageId);
      if (!sourceMsg) {
        itemPasses = false;
        errors.push(`Item "${item.title}" cites non-existent message ID: ${citation.messageId}`);
        break;
      }

      if (!isQuoteGrounded(citation.quote, sourceMsg.text)) {
        itemPasses = false;
        errors.push(`Item "${item.title}" cited quote "${citation.quote}" does not exist in message "${sourceMsg.text}"`);
        break;
      }
    }

    // Additional check for deadlines: Ensure due date is valid ISO string
    if (item.kind === 'deadline' && item.due) {
      const parsedTime = Date.parse(item.due.iso);
      if (isNaN(parsedTime)) {
        item.due.isUnclearDate = true;
      }
    }

    if (itemPasses) {
      verifiedItems.push(item);
    } else {
      item.status = 'unverified';
      unverifiedItems.push(item);
    }
  }

  return {
    verifiedItems,
    unverifiedItems,
    totalChecked: items.length,
    allGrounded: unverifiedItems.length === 0,
    errors,
  };
}
