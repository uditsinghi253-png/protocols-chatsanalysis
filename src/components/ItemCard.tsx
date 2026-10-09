/**
 * Executive Item Card Component
 * Linear-grade card with precision typography, grounded evidence, and live countdowns.
 * Zero emojis. Strictly clean micro-icons and structured data badges.
 */

import React from 'react';
import {
  Clock,
  CheckCircle,
  FileText,
  User,
  Quote,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from 'lucide-react';
import { Item } from '../types/schema';

interface ItemCardProps {
  item: Item;
  currentTime: Date;
  isSelected?: boolean;
  onJumpToSource: (messageId: string) => void;
  onToggleStatus: (itemId: string) => void;
  onFeedback: (itemId: string, isPositive: boolean) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  currentTime,
  isSelected,
  onJumpToSource,
  onToggleStatus,
  onFeedback,
}) => {
  // Live deadline calculation
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

  const isSuperseded = item.status === 'superseded';
  const isDone = item.status === 'done';

  // Urgency styling definition
  const urgencyConfig = {
    critical: {
      color: 'var(--crit)',
      bg: 'var(--crit-subtle)',
      border: 'var(--crit-border)',
      label: 'CRITICAL',
    },
    high: {
      color: 'var(--warn)',
      bg: 'var(--warn-subtle)',
      border: 'var(--warn-border)',
      label: 'HIGH',
    },
    normal: {
      color: 'var(--info)',
      bg: 'var(--info-subtle)',
      border: 'var(--info-border)',
      label: 'NORMAL',
    },
    low: {
      color: 'var(--text-muted)',
      bg: 'rgba(255, 255, 255, 0.04)',
      border: 'var(--border-hairline)',
      label: 'LOW',
    },
  }[item.urgency.level];

  const kindIcon = {
    action_item: <CheckCircle size={14} color="var(--success)" />,
    decision: <FileText size={14} color="var(--accent)" />,
    deadline: <Clock size={14} color={isOverdue ? 'var(--crit)' : 'var(--warn)'} />,
    question_for_user: <Clock size={14} color="var(--crit)" />,
    important_message: <FileText size={14} color="var(--text-muted)" />,
  }[item.kind];

  return (
    <div
      className={`linear-card ${isSelected ? 'linear-card-selected' : ''}`}
      style={{
        padding: '14px',
        marginBottom: '10px',
        opacity: isDone || isSuperseded ? 0.6 : 1,
        borderLeft: `3px solid ${isSuperseded ? 'var(--text-muted)' : urgencyConfig.color}`,
        position: 'relative',
      }}
    >
      {/* Top Header Line */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {kindIcon}
          <h4
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: isDone ? 'var(--text-muted)' : '#fff',
              textDecoration: isDone || isSuperseded ? 'line-through' : 'none',
              lineHeight: '1.3',
            }}
          >
            {item.title}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {/* Urgency Pill */}
          <span
            style={{
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '3px',
              background: urgencyConfig.bg,
              color: urgencyConfig.color,
              border: `1px solid ${urgencyConfig.border}`,
              letterSpacing: '0.04em',
            }}
          >
            {isSuperseded ? 'SUPERSEDED' : `${urgencyConfig.label} ${(item.urgency.score).toFixed(2)}`}
          </span>

          {/* Owner Chip */}
          {item.owner && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <User size={10} />
              {item.owner}
            </span>
          )}
        </div>
      </div>

      {/* Detail description */}
      <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.45', marginBottom: '8px' }}>
        {item.detail}
      </p>

      {/* Countdown or Overdue Indicator */}
      {countdownText && (
        <div style={{ marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: '600',
              padding: '2px 6px',
              borderRadius: '3px',
              background: isOverdue ? 'var(--crit-subtle)' : 'var(--warn-subtle)',
              color: isOverdue ? 'var(--crit)' : 'var(--warn)',
              border: `1px solid ${isOverdue ? 'var(--crit-border)' : 'var(--warn-border)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={10} />
            <span>{countdownText}</span>
          </span>
        </div>
      )}

      {/* Supersession Link Indicator (Edge Case E2) */}
      {isSuperseded && (
        <div style={{ marginBottom: '8px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <RotateCcw size={11} />
          <span>Reversed by a subsequent decision in chat</span>
        </div>
      )}

      {/* Visible "Why" explanation pill */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '6px 8px',
          borderRadius: '4px',
          border: '1px solid var(--border-hairline)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          marginBottom: '10px',
          lineHeight: '1.35',
        }}
        title="Mathematical signals determining this score"
      >
        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>WHY: </span>
        {item.urgency.explanation}
      </div>

      {/* Grounded Citation Evidence */}
      {item.evidence && item.evidence.length > 0 && (
        <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Quote size={11} color="var(--text-muted)" />
          {item.evidence.map((ev, idx) => (
            <button
              key={idx}
              onClick={() => onJumpToSource(ev.messageId)}
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Click to jump and verify source message quote"
            >
              <span>"{ev.quote.length > 36 ? ev.quote.substring(0, 36) + '...' : ev.quote}"</span>
              <ExternalLink size={10} />
            </button>
          ))}
        </div>
      )}

      {/* Card Action Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-hairline)', paddingTop: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onToggleStatus(item.id)}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: isDone ? 'rgba(255, 255, 255, 0.04)' : 'var(--success-subtle)',
              border: `1px solid ${isDone ? 'var(--border-hairline)' : 'var(--success-border)'}`,
              color: isDone ? 'var(--text-muted)' : 'var(--success)',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            {isDone ? 'Reopen' : 'Mark Done'}
          </button>

          {/* Direct Link Action if URL present */}
          {(() => {
            const linkMatch = (item.detail || '').match(/https?:\/\/[^\s]+/i) || (item.evidence[0]?.quote || '').match(/https?:\/\/[^\s]+/i);
            if (!linkMatch) return null;
            return (
              <a
                href={linkMatch[0]}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Open Link</span>
                <ExternalLink size={10} />
              </a>
            );
          })()}

          {/* Add to Calendar (.ics) if deadline present */}
          {item.due?.iso && (
            <button
              onClick={() => {
                const start = new Date(item.due!.iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WhatDidIMiss//EN\nBEGIN:VEVENT\nSUMMARY:${item.title.replace(/\n/g, ' ')}\nDESCRIPTION:${item.detail.replace(/\n/g, ' ')}\nDTSTART:${start}\nDTEND:${start}\nEND:VEVENT\nEND:VCALENDAR`;
                const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `deadline-${item.id}.ics`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Download .ics calendar event"
            >
              <Clock size={10} />
              <span>+ Calendar</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onFeedback(item.id, true)}
            style={{
              padding: '3px 6px',
              borderRadius: '4px',
              background: 'transparent',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Confirm priority accuracy"
          >
            <ThumbsUp size={11} />
          </button>
          <button
            onClick={() => onFeedback(item.id, false)}
            style={{
              padding: '3px 6px',
              borderRadius: '4px',
              background: 'transparent',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Flag priority inaccuracy"
          >
            <ThumbsDown size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};
