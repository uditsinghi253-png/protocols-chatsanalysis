/**
 * Ghosted Threads & Dropped Inquiries Modal
 * Executive radar of unanswered questions, delayed handoffs, and who owes whom a response.
 * Zero emojis. Strictly clean typography and SVG micro-icons.
 */

import React, { useState, useEffect } from 'react';
import { X, UserX, Clock, ArrowUpRight, ArrowDownLeft, Copy, Check, MessageSquare } from 'lucide-react';
import { GhostedThread } from '../types/schema';

interface GhostedThreadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: GhostedThread[];
  onJumpToSource: (messageId: string) => void;
}

export const GhostedThreadsModal: React.FC<GhostedThreadsModalProps> = ({
  isOpen,
  onClose,
  threads,
  onJumpToSource,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'outgoing' | 'incoming' | 'critical'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredThreads = threads.filter(t => {
    if (filterTab === 'outgoing') return t.isOutgoing;
    if (filterTab === 'incoming') return !t.isOutgoing;
    if (filterTab === 'critical') return t.severity === 'critical' || t.daysSilent >= 7;
    return true;
  });

  const outgoingCount = threads.filter(t => t.isOutgoing).length;
  const incomingCount = threads.filter(t => !t.isOutgoing).length;
  const criticalCount = threads.filter(t => t.severity === 'critical' || t.daysSilent >= 7).length;

  const handleCopyAction = (thread: GhostedThread) => {
    navigator.clipboard.writeText(thread.suggestedAction);
    setCopiedId(thread.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="linear-panel"
        style={{
          width: '100%',
          maxWidth: '760px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserX size={16} color="#fbbf24" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', margin: 0 }}>
                Ghosted Inquiries & Unreturned Threads
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Deterministic audit of unresolved asks, delayed follow-ups, and balance of obligations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-hairline)',
          }}
        >
          <button
            onClick={() => setFilterTab('all')}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: filterTab === 'all' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: filterTab === 'all' ? '#fff' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            All ({threads.length})
          </button>
          <button
            onClick={() => setFilterTab('incoming')}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: filterTab === 'incoming' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: filterTab === 'incoming' ? '#f87171' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            You Owe Them ({incomingCount})
          </button>
          <button
            onClick={() => setFilterTab('outgoing')}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              background: filterTab === 'outgoing' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: filterTab === 'outgoing' ? '#60a5fa' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            They Owe You ({outgoingCount})
          </button>
          {criticalCount > 0 && (
            <button
              onClick={() => setFilterTab('critical')}
              style={{
                padding: '4px 10px',
                borderRadius: '5px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                background: filterTab === 'critical' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                color: filterTab === 'critical' ? '#fb7185' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Critical ({criticalCount})
            </button>
          )}
        </div>

        {/* Thread List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {filteredThreads.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              No unreturned inquiries found in this view.
            </div>
          ) : (
            filteredThreads.map(thread => {
              const isOutgoing = thread.isOutgoing;
              const severityColor = {
                critical: '#fb7185',
                high: '#fbbf24',
                normal: '#94a3b8',
              }[thread.severity];

              return (
                <div
                  key={thread.id}
                  className="linear-card"
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hairline)',
                    background: 'var(--bg-secondary)',
                    borderLeft: `3px solid ${severityColor}`,
                  }}
                >
                  {/* Top status bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: isOutgoing ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: isOutgoing ? '#60a5fa' : '#f87171',
                          border: `1px solid ${isOutgoing ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}
                      >
                        {isOutgoing ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                        {isOutgoing ? `AWAITING REPLY FROM ${thread.recipient.toUpperCase()}` : `YOU OWE ${thread.sender.toUpperCase()}`}
                      </span>

                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={10} />
                        {thread.daysSilent >= 1
                          ? `${thread.daysSilent} days silent`
                          : `${thread.hoursSilent} hours silent`}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '9px',
                        fontFamily: 'var(--font-mono)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: severityColor,
                        border: `1px solid ${severityColor}40`,
                      }}
                    >
                      {thread.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* Quoted Message */}
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#f1f5f9',
                      lineHeight: '1.45',
                      marginBottom: '10px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'rgba(0, 0, 0, 0.25)',
                      borderLeft: '2px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    "{thread.text}"
                  </div>

                  {/* Action Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-hairline)',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Suggested: </span>
                      <span style={{ color: 'var(--text-secondary)' }}>{thread.suggestedAction}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleCopyAction(thread)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-hairline)',
                          color: copiedId === thread.id ? 'var(--success)' : 'var(--text-secondary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedId === thread.id ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copiedId === thread.id ? 'Copied' : 'Copy Response'}</span>
                      </button>

                      <button
                        onClick={() => {
                          onJumpToSource(thread.sourceMessageId);
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-hairline)',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        <MessageSquare size={11} />
                        <span>Source Context</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
