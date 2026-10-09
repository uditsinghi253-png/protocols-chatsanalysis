import React, { useState } from 'react';
import { Item } from '../types/schema';
import { ItemCard } from './ItemCard';
import { AlertCircle, Scale, Clock, UserCheck, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';

interface TriageLanesProps {
  items: Item[];
  currentTime: Date;
  onJumpToSource: (messageId: string) => void;
  onToggleStatus: (itemId: string) => void;
  onFeedback: (itemId: string, isPositive: boolean) => void;
}

export const TriageLanes: React.FC<TriageLanesProps> = ({
  items,
  currentTime,
  onJumpToSource,
  onToggleStatus,
  onFeedback,
}) => {
  const [fyiExpanded, setFyiExpanded] = useState(false);

  // Categorize items into distinct lanes
  const actionItems = items.filter(
    it => it.kind === 'question_for_user' || (it.urgency.level === 'critical' && it.kind !== 'deadline')
  );

  const decisions = items.filter(it => it.kind === 'decision');

  const deadlines = items.filter(it => it.kind === 'deadline').sort((a, b) => {
    const timeA = a.due?.iso ? new Date(a.due.iso).getTime() : 0;
    const timeB = b.due?.iso ? new Date(b.due.iso).getTime() : 0;
    return timeA - timeB;
  });

  const mentions = items.filter(
    it => it.relevanceToMe.score >= 0.8 && it.kind !== 'question_for_user'
  );

  const fyiItems = items.filter(
    it => !actionItems.includes(it) && !decisions.includes(it) && !deadlines.includes(it) && !mentions.includes(it)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 4 Primary Responsive Grid Lanes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Lane 1: Needs Action Now */}
        <div className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} color="#ef4444" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Needs Action Now</h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'var(--color-critical-bg)', color: '#ef4444' }}>
              {actionItems.length}
            </span>
          </div>

          {actionItems.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              🎉 No urgent asks or open questions pending.
            </div>
          ) : (
            actionItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                currentTime={currentTime}
                onJumpToSource={onJumpToSource}
                onToggleStatus={onToggleStatus}
                onFeedback={onFeedback}
              />
            ))
          )}
        </div>

        {/* Lane 2: Deadlines (Live Countdowns) */}
        <div className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Deadlines</h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'var(--color-high-bg)', color: '#f59e0b' }}>
              {deadlines.length}
            </span>
          </div>

          {deadlines.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No upcoming deadlines mentioned in this segment.
            </div>
          ) : (
            deadlines.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                currentTime={currentTime}
                onJumpToSource={onJumpToSource}
                onToggleStatus={onToggleStatus}
                onFeedback={onFeedback}
              />
            ))
          )}
        </div>

        {/* Lane 3: Decisions Made */}
        <div className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #6366f1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} color="#818cf8" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Decisions Made</h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
              {decisions.length}
            </span>
          </div>

          {decisions.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No consensus decisions reached in unread messages.
            </div>
          ) : (
            decisions.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                currentTime={currentTime}
                onJumpToSource={onJumpToSource}
                onToggleStatus={onToggleStatus}
                onFeedback={onFeedback}
              />
            ))
          )}
        </div>

        {/* Lane 4: Mentions of You */}
        <div className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} color="#10b981" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Mentions of You</h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'var(--color-success-bg)', color: '#10b981' }}>
              {mentions.length}
            </span>
          </div>

          {mentions.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No direct mentions or assignments found for your alias.
            </div>
          ) : (
            mentions.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                currentTime={currentTime}
                onJumpToSource={onJumpToSource}
                onToggleStatus={onToggleStatus}
                onFeedback={onFeedback}
              />
            ))
          )}
        </div>
      </div>

      {/* Collapsible FYI / Background Context Lane */}
      {fyiItems.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px' }}>
          <button
            onClick={() => setFyiExpanded(!fyiExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bookmark size={16} />
              <span>General Background & FYI ({fyiItems.length} items)</span>
            </div>
            {fyiExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {fyiExpanded && (
            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {fyiItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  currentTime={currentTime}
                  onJumpToSource={onJumpToSource}
                  onToggleStatus={onToggleStatus}
                  onFeedback={onFeedback}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
