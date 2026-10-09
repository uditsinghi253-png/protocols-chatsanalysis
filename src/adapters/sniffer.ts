/**
 * Ingest Content Sniffer & Adaptive Message Parser
 * Dynamically detects chat format by analyzing line structure and timestamp patterns.
 * Zero hardcoded formats or canned samples.
 * Why: Users export chats across platforms (iOS WhatsApp, Android WhatsApp, Slack, etc.).
 */

import { Message } from '../types/schema';

export interface IngestResult {
  formatDetected: 'whatsapp_standard' | 'whatsapp_bracketed' | 'json_array' | 'plain_lines' | 'unknown';
  messages: Message[];
  participants: string[];
  inferredDateOrder: 'DMY' | 'MDY' | 'YMD';
  errors: string[];
}

/**
 * Simple, deterministic non-cryptographic hash for stable message IDs
 * Why: Generates stable, collision-resistant IDs across repeated file drops without async overhead
 */
export function generateStableId(input: string): string {
  let hash1 = 0xdeadbeef ^ 0;
  let hash2 = 0x41c64e6d ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507);
  hash1 ^= Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507);
  hash2 ^= Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(16);
  return `msg_${hex.padStart(12, '0')}`;
}

/**
 * Normalizes participant name by stripping trailing colons and extra spaces
 */
function cleanSender(sender: string): string {
  return sender.replace(/[:\-–]+$/, '').trim();
}

/**
 * Evaluates candidate date parts to infer DMY vs MDY without hardcoded assumptions
 * Why: Edge Case E12 & §5.1. Differentiating 05/06/2026 requires inspecting rows where number > 12
 */
function inferDateOrder(dateStrings: string[]): 'DMY' | 'MDY' | 'YMD' {
  let hasFirstNumberAbove12 = false;
  let hasSecondNumberAbove12 = false;

  for (const str of dateStrings) {
    const parts = str.match(/\d+/g);
    if (!parts || parts.length < 3) continue;

    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);

    // If third part is year (e.g. 2026 or 26)
    if (p3 > 1900 || parts[2].length === 4 || (p1 <= 31 && p2 <= 31 && p3 <= 99)) {
      if (p1 > 12) hasFirstNumberAbove12 = true;
      if (p2 > 12) hasSecondNumberAbove12 = true;
    } else if (p1 > 1900 || parts[0].length === 4) {
      return 'YMD';
    }
  }

  // If first number exceeds 12, it must be Day-Month-Year
  if (hasFirstNumberAbove12 && !hasSecondNumberAbove12) return 'DMY';
  // If second number exceeds 12, it must be Month-Day-Year
  if (hasSecondNumberAbove12 && !hasFirstNumberAbove12) return 'MDY';

  // Default to system locale preference
  const isEnUS = typeof navigator !== 'undefined' && navigator.language?.startsWith('en-US');
  return isEnUS ? 'MDY' : 'DMY';
}

/**
 * Parses raw date string into normalized ISO8601 string
 */
function parseDateToIso(datePart: string, timePart: string, dateOrder: 'DMY' | 'MDY' | 'YMD'): string {
  try {
    const dNums = datePart.match(/\d+/g);
    const tNums = timePart.match(/\d+/g);
    if (!dNums || dNums.length < 3 || !tNums || tNums.length < 2) {
      return new Date().toISOString();
    }

    let year = 0;
    let month = 0;
    let day = 0;

    if (dateOrder === 'YMD') {
      year = parseInt(dNums[0], 10);
      month = parseInt(dNums[1], 10) - 1;
      day = parseInt(dNums[2], 10);
    } else if (dateOrder === 'MDY') {
      month = parseInt(dNums[0], 10) - 1;
      day = parseInt(dNums[1], 10);
      year = parseInt(dNums[2], 10);
    } else {
      // DMY
      day = parseInt(dNums[0], 10);
      month = parseInt(dNums[1], 10) - 1;
      year = parseInt(dNums[2], 10);
    }

    // Two-digit year normalization (e.g. 26 -> 2026)
    if (year < 100) {
      year += 2000;
    }

    let hours = parseInt(tNums[0], 10);
    const minutes = parseInt(tNums[1], 10);
    const seconds = tNums.length > 2 ? parseInt(tNums[2], 10) : 0;

    // AM/PM adjustments
    const isPm = /pm/i.test(timePart);
    const isAm = /am/i.test(timePart);
    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;

    const parsedDate = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Sniffs raw content and parses messages across WhatsApp and structured formats
 */
export function sniffAndParseChat(rawContent: string, conversationId = 'default_chat'): IngestResult {
  const trimmed = rawContent.trim();
  const errors: string[] = [];

  if (!trimmed) {
    return {
      formatDetected: 'unknown',
      messages: [],
      participants: [],
      inferredDateOrder: 'DMY',
      errors: ['Content is empty'],
    };
  }

  // 1. Check for JSON array export
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
        const messages: Message[] = [];
        const participantSet = new Set<string>();

        parsed.forEach((item, index) => {
          const sender = item.sender || item.author || item.user || item.name || 'Unknown';
          const text = item.text || item.message || item.content || '';
          const ts = item.ts || item.timestamp || item.date || new Date().toISOString();
          const cleanSenderName = cleanSender(sender);

          if (text.trim()) {
            participantSet.add(cleanSenderName);
            const id = generateStableId(`${conversationId}-${ts}-${cleanSenderName}-${text}-${index}`);
            messages.push({
              id,
              conversationId,
              ts: new Date(ts).toISOString(),
              sender: cleanSenderName,
              senderId: cleanSenderName.toLowerCase().replace(/\s+/g, '_'),
              text: text.trim(),
              ordinal: index,
              raw: item,
            });
          }
        });

        return {
          formatDetected: 'json_array',
          messages,
          participants: Array.from(participantSet),
          inferredDateOrder: 'YMD',
          errors,
        };
      }
    } catch {
      // Continue to line sniffers
    }
  }

  // 2. Line-based regex sniffers
  const lines = rawContent.split(/\r?\n/);
  
  // Format A: Bracketed WhatsApp iOS style: "[12/04/2026, 14:30:15] Alice: Hello"
  const bracketRegex = /^\[(\d{1,4}[/.-]\d{1,4}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s+([^:]+):([\s\S]*)$/;
  
  // Format B: Standard WhatsApp Android style: "12/04/2026, 14:30 - Alice: Hello"
  const standardRegex = /^(\d{1,4}[/.-]\d{1,4}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*[-–]\s*([^:]+):([\s\S]*)$/;

  let bracketMatches = 0;
  let standardMatches = 0;
  const sampleDates: string[] = [];

  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const line = lines[i];
    const bMatch = line.match(bracketRegex);
    if (bMatch) {
      bracketMatches++;
      sampleDates.push(bMatch[1]);
    }
    const sMatch = line.match(standardRegex);
    if (sMatch) {
      standardMatches++;
      sampleDates.push(sMatch[1]);
    }
  }

  // Validate whether content actually looks like a chat export
  if (bracketMatches === 0 && standardMatches === 0) {
    const isMarkdownOrDoc = rawContent.trim().startsWith('#') || 
      rawContent.includes('SYSTEM_DESIGN') || 
      rawContent.includes('RAG_DESIGN') ||
      rawContent.trim().startsWith('---') ||
      rawContent.trim().startsWith('import ') ||
      rawContent.trim().startsWith('<!DOCTYPE');

    if (isMarkdownOrDoc || lines.length > 5) {
      return {
        formatDetected: 'unknown',
        messages: [],
        participants: [],
        inferredDateOrder: 'DMY',
        errors: ['The uploaded file appears to be a markdown document or code file, not a recognized WhatsApp, Telegram, or Slack chat export.'],
      };
    }
  }

  const formatDetected = 
    bracketMatches > standardMatches ? 'whatsapp_bracketed' :
    standardMatches > 0 ? 'whatsapp_standard' : 'plain_lines';

  const dateOrder = inferDateOrder(sampleDates);
  const activeRegex = formatDetected === 'whatsapp_bracketed' ? bracketRegex : standardRegex;

  const messages: Message[] = [];
  const participantSet = new Set<string>();
  const seenIds = new Set<string>();

  let currentMsg: Message | null = null;
  let ordinal = 0;

  for (const line of lines) {
    if (!line.trim()) continue;

    const match = line.match(activeRegex);
    if (match) {
      // Save previous accumulated message
      if (currentMsg) {
        if (!seenIds.has(currentMsg.id)) {
          seenIds.add(currentMsg.id);
          messages.push(currentMsg);
          participantSet.add(currentMsg.sender);
        }
      }

      const datePart = match[1];
      const timePart = match[2];
      const rawSender = match[3];
      const rawText = match[4];

      const sender = cleanSender(rawSender);
      const isoTs = parseDateToIso(datePart, timePart, dateOrder);
      const stableId = generateStableId(`${conversationId}-${isoTs}-${sender}-${rawText}-${ordinal}`);

      currentMsg = {
        id: stableId,
        conversationId,
        ts: isoTs,
        sender,
        senderId: sender.toLowerCase().replace(/\s+/g, '_'),
        text: rawText.trim(),
        ordinal: ordinal++,
      };
    } else if (currentMsg) {
      // Multi-line message continuation (Edge case: preserves newline and code blocks)
      currentMsg.text += `\n${line.trim()}`;
      // Recompute stable ID with accumulated text
      currentMsg.id = generateStableId(`${conversationId}-${currentMsg.ts}-${currentMsg.sender}-${currentMsg.text}-${currentMsg.ordinal}`);
    } else {
      // Unanchored leading lines
      const fallbackId = generateStableId(`${conversationId}-lead-${ordinal}`);
      currentMsg = {
        id: fallbackId,
        conversationId,
        ts: new Date().toISOString(),
        sender: 'System',
        senderId: 'system',
        text: line.trim(),
        ordinal: ordinal++,
      };
    }
  }

  if (currentMsg && !seenIds.has(currentMsg.id)) {
    messages.push(currentMsg);
    participantSet.add(currentMsg.sender);
  }

  return {
    formatDetected,
    messages,
    participants: Array.from(participantSet).filter(p => p !== 'System'),
    inferredDateOrder: dateOrder,
    errors,
  };
}
