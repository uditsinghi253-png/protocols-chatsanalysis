import React from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  User,
  Quote,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Item } from '../types/schema';

interface ItemCardProps {
  item: Item;
  currentTime: Date;
  onJumpToSource: (messageId: string) => void;
  onToggleStatus: (itemId: string) => void;
  onFeedback: (itemId: string, isPositive: boolean) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  currentTime,
  onJumpToSource,
  onToggleStatus,
  onFeedback,
}) => {
  // Compute live deadline remaining
  let countdownText: string | null = null;
  let isOverdue = false;

  if (item.due && item.due.iso) {
    const dueTime = new Date(item.due.iso).getTime();
    const diffMs = dueTime - currentTime.getTime();
    const diffHrs = Math.floor(Math.abs(diffMs) / (3600 * 1000));
    const diffMins = Math.floor((Math.abs(diffMs) % (3600 * 1000)) / (60 * 1000));

    if (diffMs < 0) {
      isOverdue = true;
      countdownText = `OVERDUE (${diffHrs}h ${diffMins}m ago)`;
    } else if (diffHrs < 24) {
      countdownText = `in ${diffHrs}h ${diffMins}m`;
    } else {
      const days = Math.floor(diffHrs / 24);
      countdownText = `in ${days}d ${diffHrs % 24}h`;
    }
  }

  // Visual cues based on urgency level
  const urgencyStyles = {
    critical: {
      border: 'rgba(239, 68, 68, 0.4)',
      bg: 'var(--color-critical-bg)',
      color: 'var(--color-critical)',
      label: 'CRITICAL',
    },
    high: {
      border: 'rgba(245, 158, 11, 0.4)',
      bg: 'var(--color-high-bg)',
      color: 'var(--color-high)',
      label: 'HIGH',
    },
    normal: {
      border: 'rgba(59, 130, 246, 0.3)',
      bg: 'var(--color-normal-bg)',
      color: 'var(--color-normal)',
      label: 'NORMAL',
    },
    low: {
      border: 'rgba(148, 163, 184, 0.2)',
      bg: 'rgba(148, 163, 184, 0.08)',
      color: '#94a3b8',
      label: 'LOW',
    },
  }[item.urgency.level];

  // Kind icon
  const kindIcon = {
    action_item: <CheckCircle size={15} color="#10b981" />,
    decision: <FileText size={15} color="#818cf8" />,
    deadline: <Clock size={15} color={isOverdue ? '#ef4444' : '#f59e0b'} />,
    question_for_user: <AlertTriangle size={15} color="#f59e0b" />,
    important_message: <FileText size={15} color="#94a3b8" />,
  }[item.kind];

  const isDone = item.status === 'done';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '16px',
        marginBottom: '12px',
        border: `1px solid ${urgencyStyles.border}`,
        opacity: isDone ? 0.6 : 1,
        transition: 'all 0.2s ease',
        background: isDone ? 'rgba(15, 23, 42, 0.4)' : 'var(--bg-card)',
      }}
    >
      {/* Header Row: Title & Badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {kindIcon}
          <h4 style={{ fontSize: '14px', fontWeight: '600', color: isDone ? '#94a3b8' : '#fff', textDecoration: isDone ? 'line-through' : 'none' }}>
            {item.title}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Urgency Badge */}
          <span
            style={{
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '12px',
              background: urgencyStyles.bg,
              color: urgencyStyles.color,
              border: `1px solid ${urgencyStyles.border}`,
              letterSpacing: '0.04em',
            }}
          >
            {urgencyStyles.label} ({(item.urgency.score).toFixed(2)})
          </span>

          {/* Owner Chip */}
          {item.owner && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <User size={10} />
              {item.owner}
            </span>
          )}
        </div>
      </div>

      {/* Body detail */}
      <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '12px' }}>
        {item.detail}
      </p>

      {/* Live Deadline / Countdown Chip */}
      {countdownText && (
        <div style={{ marginBottom: '10px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '600',
              padding: '3px 10px',
              borderRadius: '6px',
              background: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isOverdue ? '#ef4444' : '#f59e0b',
              border: `1px solid ${isOverdue ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Clock size={11} />
            <span>Deadline: {countdownText}</span>
          </span>
        </div>
      )}

      {/* Visible "Why" explanation pill */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '6px 10px',
          borderRadius: '6px',
          borderLeft: `3px solid ${urgencyStyles.color}`,
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginBottom: '10px',
          lineHeight: '1.4',
        }}
        title="Why this item received this priority score"
      >
        <strong style={{ color: '#e2e8f0' }}>Why: </strong>
        {item.urgency.explanation}
      </div>

      {/* Grounded Evidence Citations */}
      {item.evidence && item.evidence.length > 0 && (
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Quote size={12} color="var(--text-muted)" />
          {item.evidence.map((ev, idx) => (
            <button
              key={idx}
              onClick={() => onJumpToSource(ev.messageId)}
              style={{
                fontSize: '11px',
                fontStyle: 'italic',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Click to jump and view quote in source chat"
            >
              <span>"{ev.quote.length > 40 ? ev.quote.substring(0, 40) + '...' : ev.quote}"</span>
              <ExternalLink size={10} />
            </button>
          ))}
        </div>
      )}

      {/* Actions Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
        <button
          onClick={() => onToggleStatus(item.id)}
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: isDone ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${isDone ? 'var(--border-subtle)' : 'rgba(16, 185, 129, 0.3)'}`,
            color: isDone ? 'var(--text-muted)' : '#10b981',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {isDone ? 'Reopen Task' : 'Mark Done'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onFeedback(item.id, true)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Accurate priority"
          >
            <ThumbsUp size={12} />
          </button>
          <button
            onClick={() => onFeedback(item.id, false)}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Inaccurate priority"
          >
            <ThumbsDown size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
