import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, MapPin, Bookmark, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Message } from '../types/schema';

interface SourceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  highlightMessageId: string | null;
  onSetCursor: (messageId: string) => void;
  currentCursorId?: string;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({
  isOpen,
  onClose,
  messages,
  highlightMessageId,
  onSetCursor,
  currentCursorId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const [windowRadius, setWindowRadius] = useState<number>(30);
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Find target message index
  const targetIndex = useMemo(() => {
    if (!highlightMessageId) return -1;
    return messages.findIndex(m => m.id === highlightMessageId);
  }, [messages, highlightMessageId]);

  // Compute windowed slice
  const { visibleMessages, startIndex, endIndex, totalCount } = useMemo(() => {
    if (messages.length === 0) {
      return { visibleMessages: [], startIndex: 0, endIndex: 0, totalCount: 0 };
    }

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim();
      const filtered = messages.filter(
        m => m.text.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q)
      );
      return {
        visibleMessages: filtered.slice(0, 100),
        startIndex: 0,
        endIndex: Math.min(100, filtered.length),
        totalCount: filtered.length,
      };
    }

    const centerIdx = targetIndex !== -1 ? targetIndex : Math.max(0, messages.length - 20);
    const start = Math.max(0, centerIdx - windowRadius);
    const end = Math.min(messages.length, centerIdx + windowRadius + 1);

    return {
      visibleMessages: messages.slice(start, end),
      startIndex: start,
      endIndex: end,
      totalCount: messages.length,
    };
  }, [messages, targetIndex, windowRadius, filterQuery]);

  useEffect(() => {
    if (isOpen && targetRef.current) {
      const timer = setTimeout(() => {
        targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, highlightMessageId, visibleMessages]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel-elevated animate-slide-down"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--border-hairline)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
              Source Verification & Chat Context
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ({visibleMessages.length} of {totalCount} messages displayed)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick in-modal search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '3px 8px',
              }}
            >
              <Search size={12} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Find in chat..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  width: '110px',
                }}
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    padding: 0,
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* Load older button */}
          {!filterQuery && startIndex > 0 && (
            <button
              onClick={() => setWindowRadius(prev => prev + 40)}
              style={{
                alignSelf: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '8px',
              }}
            >
              <ChevronUp size={14} />
              <span>Load older messages ({startIndex} earlier)</span>
            </button>
          )}

          {visibleMessages.map(msg => {
            const isHighlighted = msg.id === highlightMessageId;
            const isCursor = msg.id === currentCursorId;

            return (
              <div
                key={msg.id}
                ref={isHighlighted ? targetRef : undefined}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: isHighlighted
                    ? 'rgba(99, 102, 241, 0.15)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isHighlighted
                    ? '1px solid var(--accent)'
                    : isCursor
                    ? '1px dashed #f59e0b'
                    : '1px solid var(--border-hairline)',
                  boxShadow: isHighlighted ? '0 0 16px rgba(99, 102, 241, 0.25)' : 'none',
                  transition: 'background 0.15s',
                  position: 'relative',
                }}
              >
                {/* Highlight Label */}
                {isHighlighted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-9px',
                      right: '14px',
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: '9px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      padding: '1px 7px',
                      borderRadius: '4px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    GROUNDED SOURCE CITATION
                  </div>
                )}

                {/* Sender & Timestamp */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '12px', color: isHighlighted ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {msg.sender}
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(msg.ts).toLocaleDateString()} {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={() => onSetCursor(msg.id)}
                    style={{
                      fontSize: '10px',
                      background: isCursor ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      border: `1px solid ${isCursor ? '#f59e0b' : 'var(--border-hairline)'}`,
                      color: isCursor ? '#f59e0b' : 'var(--text-muted)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Set unread starting point after this message"
                  >
                    <Bookmark size={10} />
                    <span>{isCursor ? 'Unread Cursor' : 'Scrub Here'}</span>
                  </button>
                </div>

                {/* Verbatim Text */}
                <p style={{ fontSize: '13px', color: '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {msg.text}
                </p>
              </div>
            );
          })}

          {/* Load newer button */}
          {!filterQuery && endIndex < totalCount && (
            <button
              onClick={() => setWindowRadius(prev => prev + 40)}
              style={{
                alignSelf: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent)',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '8px',
              }}
            >
              <ChevronDown size={14} />
              <span>Load newer messages ({totalCount - endIndex} later)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
