/**
 * Collaboration Wrapped Analytics Modal
 * Spotify-Wrapped style deep collaboration intelligence, reply latency faceoff, and archetype discovery.
 * Zero emojis. Strictly clean typography, linear graphs, and SVG micro-icons.
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Zap, Clock, Calendar, Hash, Globe, Copy, Check } from 'lucide-react';
import { WrappedAnalytics } from '../types/schema';

interface WrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: WrappedAnalytics;
}

export const WrappedModal: React.FC<WrappedModalProps> = ({ isOpen, onClose, analytics }) => {
  const [copied, setCopied] = useState(false);

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

  const handleCopyReport = () => {
    const p1 = analytics.participants[0];
    const p2 = analytics.participants[1];

    const report = `# Collaboration Wrapped Report
**Total Volume:** ${analytics.totalMessages.toLocaleString()} messages (${analytics.totalWords.toLocaleString()} words across ${analytics.dateRange.daysCount} active days)
**Archetype:** ${analytics.conversationArchetype.title} (${analytics.conversationArchetype.subtitle})
${analytics.conversationArchetype.dynamicDescription}

### Participant Parity & Velocity
${p1 ? `- **${p1.name}**: ${p1.messageCount} msgs (${p1.percentage}%), median reply: ${p1.medianReplyMinutes < 1 ? Math.round(p1.medianReplyMinutes * 60) + 's' : p1.medianReplyMinutes.toFixed(1) + 'm'}` : ''}
${p2 ? `- **${p2.name}**: ${p2.messageCount} msgs (${p2.percentage}%), median reply: ${p2.medianReplyMinutes < 1 ? Math.round(p2.medianReplyMinutes * 60) + 's' : p2.medianReplyMinutes.toFixed(1) + 'm'}` : ''}

### Peak Chaos & Velocity
- **Busiest Day:** ${analytics.peakActivity.busiestDate} (${analytics.peakActivity.busiestDateCount} messages)
- **Peak Hour:** ${analytics.peakActivity.busiestHourOfDay}:00 hrs
- **Decisions Finalized:** ${analytics.metrics.decisionsFinalized}
- **Commitments Tracked:** ${analytics.metrics.commitmentsTotal}

*Generated locally by ProtocolX - Local-First Chat Intelligence*
`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const p1 = analytics.participants[0];
  const p2 = analytics.participants[1];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '820px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', margin: 0 }}>
                Collaboration Wrapped
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                {analytics.totalMessages.toLocaleString()} messages across {analytics.dateRange.daysCount} active days
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

        {/* Scrollable Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Card 1: Archetype Banner */}
          <div
            style={{
              padding: '20px',
              borderRadius: '10px',
              background: 'radial-gradient(ellipse at top left, rgba(99, 102, 241, 0.15) 0%, rgba(24, 24, 27, 0.4) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#818cf8',
                  fontWeight: '700',
                }}
              >
                DISCOVERED ARCHETYPE
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0' }}>
              {analytics.conversationArchetype.title}
            </h2>
            <div style={{ fontSize: '12px', color: '#a5b4fc', marginBottom: '10px', fontWeight: '500' }}>
              {analytics.conversationArchetype.subtitle}
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.55', margin: 0 }}>
              {analytics.conversationArchetype.dynamicDescription}
            </p>
          </div>

          {/* Card 2: Conversational Parity & Velocity Faceoff */}
          <div
            style={{
              padding: '18px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-hairline)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
              <Zap size={14} color="#38bdf8" />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                Conversational Parity & Velocity
              </span>
            </div>

            {/* Parity Segment Bar */}
            {p1 && (
              <div style={{ marginBottom: '14px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  <span>{p1.name} ({p1.percentage}%)</span>
                  {p2 && <span>{p2.name} ({p2.percentage}%)</span>}
                </div>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  <div
                    style={{
                      width: `${p1.percentage}%`,
                      background: 'linear-gradient(90deg, #4f46e5, #6366f1)',
                    }}
                  />
                  {p2 && (
                    <div
                      style={{
                        width: `${p2.percentage}%`,
                        background: 'linear-gradient(90deg, #06b6d4, #0ea5e9)',
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Side-by-side stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {analytics.participants.map((p, idx) => {
                const replySpeedStr = p.medianReplyMinutes < 1
                  ? `${Math.round(p.medianReplyMinutes * 60)} seconds`
                  : `${p.medianReplyMinutes.toFixed(1)} mins`;

                return (
                  <div
                    key={p.name}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-hairline)',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '700', color: idx === 0 ? '#818cf8' : '#38bdf8', marginBottom: '8px' }}>
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Total Messages:</span>
                        <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{p.messageCount.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Word Volume:</span>
                        <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{p.wordCount.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Median Reply:</span>
                        <strong style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>{replySpeedStr}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Questions Raised:</span>
                        <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{p.questionsAsked}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Peak Chaos & Temporal Habits */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                <Calendar size={13} />
                <span>Peak Chaos Day</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>
                {analytics.peakActivity.busiestDate || 'N/A'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {analytics.peakActivity.busiestDateCount} messages in a single 24h cycle
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                <Clock size={13} />
                <span>Peak Productive Hour</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '2px' }}>
                {analytics.peakActivity.busiestHourOfDay}:00 hrs
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {analytics.peakActivity.busiestHourOfDay >= 20 || analytics.peakActivity.busiestHourOfDay <= 3 ? 'Heavy Nocturnal Tendency' : 'Standard Business Rhythm'}
              </div>
            </div>
          </div>

          {/* Card 4: Top Keywords & Shared Domains */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                <Hash size={13} />
                <span>Top Context Keywords</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analytics.topKeywords.slice(0, 8).map(kw => (
                  <span
                    key={kw.word}
                    style={{
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-hairline)',
                      color: '#e2e8f0',
                    }}
                  >
                    {kw.word} <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{kw.count}</span>
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-hairline)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                <Globe size={13} />
                <span>Shared Asset Domains</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analytics.topDomains.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No external links shared.</span>
                ) : (
                  analytics.topDomains.slice(0, 6).map(dom => (
                    <span
                      key={dom.domain}
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        color: '#93c5fd',
                      }}
                    >
                      {dom.domain} <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>{dom.count}</span>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Card 5: Operational Decision Counter */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-hairline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              textAlign: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#4ade80', fontFamily: 'var(--font-mono)' }}>
                {analytics.metrics.decisionsFinalized}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Decisions Finalized</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-hairline)' }} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
                {analytics.metrics.commitmentsTotal}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Action Commitments</div>
            </div>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-hairline)' }} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                {analytics.metrics.ghostedCount}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ghosted Inquiries</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            All analytics computed 100% locally on your device.
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleCopyReport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: copied ? 'var(--success)' : '#fff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Wrapped Report'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: 'var(--accent)',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
