import React from 'react';
import { Clock, BookOpen, Sparkles, Hash } from 'lucide-react';
import { TriageSummary, ConversationState } from '../types/schema';

interface SummaryCardProps {
  summary: TriageSummary;
  conversationState: ConversationState;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, conversationState }) => {
  return (
    <div
      className="glass-panel-elevated"
      style={{
        padding: '24px',
        marginBottom: '24px',
        borderLeft: '4px solid var(--accent-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Banner Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>
              While you were away
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {conversationState.cursorExplanation}
            </div>
          </div>
        </div>

        {/* Stats Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '12px', color: '#c7d2fe' }}>
            <Hash size={13} />
            <span><strong>{summary.unreadCount}</strong> unread messages</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <Clock size={13} />
            <span>{new Date(summary.timeRange.from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(summary.timeRange.to).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '12px', color: '#6ee7b7' }}>
            <BookOpen size={13} />
            <span><strong>{summary.readingTimeMinutes} min</strong> triage time</span>
          </div>
        </div>
      </div>

      {/* Narrative Summary */}
      <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '16px', background: 'rgba(0, 0, 0, 0.2)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
        {summary.overallSummary}
      </p>

      {/* Key Highlights / Topics */}
      {summary.keyTopics.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>KEY HIGHLIGHTS:</span>
          {summary.keyTopics.map((topic, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11px',
                padding: '3px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
