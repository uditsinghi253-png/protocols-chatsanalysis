/**
 * Unread Cursor Manager
 * Manages the boundary between already-read and unread messages.
 * Why: Defines what "missed" actually means without guessing silently.
 */

import { Message, ConversationState } from '../types/schema';

export function resolveUnreadCursor(
  messages: Message[],
  conversationId: string,
  userAliases: string[],
  manualCursorId?: string
): ConversationState {
  if (messages.length === 0) {
    return {
      id: conversationId,
      name: conversationId,
      totalMessages: 0,
      cursorSource: 'user_manual',
      cursorExplanation: 'No messages in conversation.',
    };
  }

  // 1. User manual override (Priority 1)
  if (manualCursorId) {
    const idx = messages.findIndex(m => m.id === manualCursorId);
    if (idx !== -1) {
      return {
        id: conversationId,
        name: conversationId,
        totalMessages: messages.length,
        cursorMessageId: manualCursorId,
        cursorSource: 'user_manual',
        cursorExplanation: `Explicitly set by you at message #${idx + 1}.`,
      };
    }
  }

  // 2. Check for explicit read marker tags in raw data (Priority 2)
  for (let i = messages.length - 1; i >= 0; i--) {
    const raw = messages[i].raw as Record<string, unknown> | undefined;
    if (raw && (raw.isReadMarker === true || raw.status === 'read')) {
      return {
        id: conversationId,
        name: conversationId,
        totalMessages: messages.length,
        cursorMessageId: messages[i].id,
        cursorSource: 'read_marker',
        cursorExplanation: `Derived from chat read-receipt marker at message #${i + 1}.`,
      };
    }
  }

  // 3. Fallback: Last message sent by the user (Priority 3)
  const normalizedAliases = userAliases.map(a => a.toLowerCase().trim());
  let lastUserMsgIndex = -1;

  for (let i = messages.length - 1; i >= 0; i--) {
    const sender = messages[i].sender.toLowerCase().trim();
    if (normalizedAliases.some(alias => sender === alias || sender.includes(alias))) {
      lastUserMsgIndex = i;
      break;
    }
  }

  if (lastUserMsgIndex !== -1 && lastUserMsgIndex < messages.length - 1) {
    return {
      id: conversationId,
      name: conversationId,
      totalMessages: messages.length,
      cursorMessageId: messages[lastUserMsgIndex].id,
      cursorSource: 'last_own_reply_fallback',
      cursorExplanation: `Fallback: Starting after your last sent message (${messages[lastUserMsgIndex].sender} at ${new Date(messages[lastUserMsgIndex].ts).toLocaleTimeString()}).`,
    };
  }

  // 4. Default if user has not spoken: All messages are treated as unread
  return {
    id: conversationId,
    name: conversationId,
    totalMessages: messages.length,
    cursorMessageId: undefined,
    cursorSource: 'last_own_reply_fallback',
    cursorExplanation: 'All messages are unread (no prior messages from your alias detected).',
  };
}

/**
 * Filters messages that occur strictly AFTER the unread cursor
 * Why: The triage engine must focus on unread missed information
 */
export function getUnreadMessages(messages: Message[], state: ConversationState): Message[] {
  if (!state.cursorMessageId) {
    return messages;
  }
  const cursorIndex = messages.findIndex(m => m.id === state.cursorMessageId);
  if (cursorIndex === -1) {
    return messages;
  }
  return messages.slice(cursorIndex + 1);
}
