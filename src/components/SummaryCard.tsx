/**
 * Executive Summary Card
 * Clean executive debrief without emojis or cartoonish visuals.
 * Why: C1. Glanceable high-density summary of unread conversation volume.
 */

import React from 'react';
import { Clock, BookOpen, Hash, Sparkles } from 'lucide-react';
import { TriageSummary, ConversationState } from '../types/schema';

interface SummaryCardProps {
  summary: TriageSummary;
  conversationState: ConversationState;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, conversationState }) => {
  return (
    <div
      className="linear-panel"
      style={{
        padding: '22px',
        marginBottom: '20px',
        borderLeft: '3px solid var(--accent)',
      }}
    >
      {/* Top Meta Line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="var(--accent)" />
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '-0.01em' }}>
            Unread Triage Debrief
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            • {conversationState.cursorExplanation}
          </span>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-hairline)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            <Hash size={11} />
            <span><strong>{summary.unreadCount}</strong> UNREAD</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-hairline)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
            }}
          >
            <Clock size={11} />
            <span>
              {new Date(summary.timeRange.from).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(summary.timeRange.to).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              borderRadius: '4px',
              background: 'var(--success-subtle)',
              border: '1px solid var(--success-border)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--success)',
            }}
          >
            <BookOpen size={11} />
            <span>{summary.readingTimeMinutes} MIN TRIAGE</span>
          </div>
        </div>
      </div>

      {/* Overview Paragraph */}
      <p
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          color: '#cbd5e1',
          marginBottom: '14px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '14px 16px',
          borderRadius: '6px',
          border: '1px solid var(--border-hairline)',
        }}
      >
        {summary.overallSummary}
      </p>

      {/* Key Highlights */}
      {summary.keyTopics.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: '700' }}>
            HIGHLIGHTS:
          </span>
          {summary.keyTopics.map((topic, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-hairline)',
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
