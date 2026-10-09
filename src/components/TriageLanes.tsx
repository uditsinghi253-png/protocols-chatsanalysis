/**
 * Triage Lanes & View Switcher (Kanban / Compact List)
 * High-density layout with keyboard selection support.
 * Zero emojis. Strictly clean typography and precision SVG indicators.
 */

import React, { useState } from 'react';
import { Item } from '../types/schema';
import { ItemCard } from './ItemCard';
import { AlertCircle, Clock, FileText, UserCheck, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';

interface TriageLanesProps {
  items: Item[];
  currentTime: Date;
  selectedItemId?: string | null;
  onJumpToSource: (messageId: string) => void;
  onToggleStatus: (itemId: string) => void;
  onFeedback: (itemId: string, isPositive: boolean) => void;
}

export const TriageLanes: React.FC<TriageLanesProps> = ({
  items,
  currentTime,
  selectedItemId,
  onJumpToSource,
  onToggleStatus,
  onFeedback,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [fyiExpanded, setFyiExpanded] = useState(false);

  // Categorize items
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* View Switcher Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-hairline)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            Triage Perspective
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            ({items.length} items extracted)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '6px', border: '1px solid var(--border-hairline)' }}>
          <button
            onClick={() => setViewMode('kanban')}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              background: viewMode === 'kanban' ? 'var(--bg-surface-hover)' : 'transparent',
              border: 'none',
              color: viewMode === 'kanban' ? '#fff' : 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <LayoutGrid size={12} />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              background: viewMode === 'list' ? 'var(--bg-surface-hover)' : 'transparent',
              border: 'none',
              color: viewMode === 'list' ? '#fff' : 'var(--text-muted)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <List size={12} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Mode A: Kanban View */}
      {viewMode === 'kanban' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Lane 1: Needs Action Now */}
          <div className="linear-panel" style={{ padding: '14px', borderTop: '2px solid var(--crit)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} color="var(--crit)" />
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Needs Action Now</h3>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', background: 'var(--crit-subtle)', color: 'var(--crit)' }}>
                {actionItems.length}
              </span>
            </div>

            {actionItems.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '12px' }}>
                No critical requests or unanswered questions pending.
              </div>
            ) : (
              actionItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  currentTime={currentTime}
                  isSelected={item.id === selectedItemId}
                  onJumpToSource={onJumpToSource}
                  onToggleStatus={onToggleStatus}
                  onFeedback={onFeedback}
                />
              ))
            )}
          </div>

          {/* Lane 2: Deadlines (Live Countdowns) */}
          <div className="linear-panel" style={{ padding: '14px', borderTop: '2px solid var(--warn)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--warn)" />
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Deadlines</h3>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', background: 'var(--warn-subtle)', color: 'var(--warn)' }}>
                {deadlines.length}
              </span>
            </div>

            {deadlines.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '12px' }}>
                No impending deadlines extracted from this timeframe.
              </div>
            ) : (
              deadlines.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  currentTime={currentTime}
                  isSelected={item.id === selectedItemId}
                  onJumpToSource={onJumpToSource}
                  onToggleStatus={onToggleStatus}
                  onFeedback={onFeedback}
                />
              ))
            )}
          </div>

          {/* Lane 3: Decisions Made */}
          <div className="linear-panel" style={{ padding: '14px', borderTop: '2px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={14} color="var(--accent)" />
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Decisions Reached</h3>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                {decisions.length}
              </span>
            </div>

            {decisions.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '12px' }}>
                No explicit consensus decisions finalized.
              </div>
            ) : (
              decisions.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  currentTime={currentTime}
                  isSelected={item.id === selectedItemId}
                  onJumpToSource={onJumpToSource}
                  onToggleStatus={onToggleStatus}
                  onFeedback={onFeedback}
                />
              ))
            )}
          </div>

          {/* Lane 4: Mentions of You */}
          <div className="linear-panel" style={{ padding: '14px', borderTop: '2px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={14} color="var(--success)" />
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Mentions of You</h3>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', background: 'var(--success-subtle)', color: 'var(--success)' }}>
                {mentions.length}
              </span>
            </div>

            {mentions.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '12px' }}>
                No direct mentions or assignments tagged to your alias.
              </div>
            ) : (
              mentions.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  currentTime={currentTime}
                  isSelected={item.id === selectedItemId}
                  onJumpToSource={onJumpToSource}
                  onToggleStatus={onToggleStatus}
                  onFeedback={onFeedback}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* Mode B: Compact List View (Linear / Superhuman Table) */
        <div className="linear-panel" style={{ padding: '12px' }}>
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              currentTime={currentTime}
              isSelected={item.id === selectedItemId}
              onJumpToSource={onJumpToSource}
              onToggleStatus={onToggleStatus}
              onFeedback={onFeedback}
            />
          ))}
        </div>
      )}

      {/* Background Context & FYI Section */}
      {fyiItems.length > 0 && (
        <div className="linear-panel" style={{ padding: '14px' }}>
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
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            <span>Background Context & FYI ({fyiItems.length} items)</span>
            {fyiExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {fyiExpanded && (
            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {fyiItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  currentTime={currentTime}
                  isSelected={item.id === selectedItemId}
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
