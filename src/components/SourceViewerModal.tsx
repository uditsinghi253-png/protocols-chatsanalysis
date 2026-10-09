import React, { useEffect, useRef } from 'react';
import { X, MapPin, Bookmark } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen && targetRef.current) {
      setTimeout(() => {
        targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isOpen, highlightMessageId]);

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
          maxWidth: '800px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
              Source Verification & Chat Context
            </h3>
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
            <X size={20} />
          </button>
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
            gap: '12px',
          }}
        >
          {messages.map(msg => {
            const isHighlighted = msg.id === highlightMessageId;
            const isCursor = msg.id === currentCursorId;

            return (
              <div
                key={msg.id}
                ref={isHighlighted ? targetRef : undefined}
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: isHighlighted
                    ? 'rgba(99, 102, 241, 0.18)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isHighlighted
                    ? '2px solid var(--accent-primary)'
                    : isCursor
                    ? '1px dashed #f59e0b'
                    : '1px solid var(--border-subtle)',
                  boxShadow: isHighlighted ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {/* Highlight Label */}
                {isHighlighted && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '16px',
                      background: 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    CITED EVIDENCE SOURCE
                  </div>
                )}

                {/* Sender & Timestamp */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13px', color: isHighlighted ? '#c7d2fe' : '#e2e8f0' }}>
                      {msg.sender}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={() => onSetCursor(msg.id)}
                    style={{
                      fontSize: '11px',
                      background: isCursor ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      border: `1px solid ${isCursor ? '#f59e0b' : 'var(--border-subtle)'}`,
                      color: isCursor ? '#f59e0b' : 'var(--text-muted)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Set unread starting point after this message"
                  >
                    <Bookmark size={10} />
                    <span>{isCursor ? 'Unread Cursor Here' : 'Mark Read Up To Here'}</span>
                  </button>
                </div>

                {/* Verbatim Text */}
                <p style={{ fontSize: '13px', color: '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {msg.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
