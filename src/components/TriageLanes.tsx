import React, { useState, useMemo } from 'react';
import { Item } from '../types/schema';
import { ItemCard } from './ItemCard';
import { AlertCircle, Clock, FileText, UserCheck, ChevronDown, ChevronUp, LayoutGrid, List, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'action_item' | 'decision' | 'deadline' | 'resources'>('all');
  const [expandedLanes, setExpandedLanes] = useState<Record<string, boolean>>({});

  const toggleLaneExpand = (laneKey: string) => {
    setExpandedLanes(prev => ({ ...prev, [laneKey]: !prev[laneKey] }));
  };

  // Filter items based on search query and quick filter tab
  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(it =>
        it.title.toLowerCase().includes(q) ||
        it.detail.toLowerCase().includes(q) ||
        it.owner?.toLowerCase().includes(q) ||
        it.evidence.some(e => e.quote.toLowerCase().includes(q))
      );
    }

    if (activeFilter === 'open') {
      result = result.filter(it => it.status === 'open' || it.status === 'overdue');
    } else if (activeFilter === 'action_item') {
      result = result.filter(it => it.kind === 'action_item' || it.kind === 'question_for_user');
    } else if (activeFilter === 'decision') {
      result = result.filter(it => it.kind === 'decision');
    } else if (activeFilter === 'deadline') {
      result = result.filter(it => it.kind === 'deadline');
    } else if (activeFilter === 'resources') {
      result = result.filter(it => it.kind === 'important_message');
    }

    return result;
  }, [items, searchQuery, activeFilter]);

  // Categorize items
  const actionItems = useMemo(() => filteredItems.filter(
    it => it.kind === 'question_for_user' || it.kind === 'action_item' || (it.urgency.level === 'critical' && it.kind !== 'deadline')
  ), [filteredItems]);

  const decisions = useMemo(() => filteredItems.filter(it => it.kind === 'decision'), [filteredItems]);

  const deadlines = useMemo(() => filteredItems.filter(it => it.kind === 'deadline').sort((a, b) => {
    const timeA = a.due?.iso ? new Date(a.due.iso).getTime() : 0;
    const timeB = b.due?.iso ? new Date(b.due.iso).getTime() : 0;
    return timeA - timeB;
  }), [filteredItems]);

  const mentions = useMemo(() => filteredItems.filter(
    it => it.kind === 'important_message' || (it.relevanceToMe.score >= 0.8 && it.kind !== 'question_for_user')
  ), [filteredItems]);

  const fyiItems = useMemo(() => filteredItems.filter(
    it => !actionItems.includes(it) && !decisions.includes(it) && !deadlines.includes(it) && !mentions.includes(it)
  ), [filteredItems, actionItems, decisions, deadlines, mentions]);

  const PAGE_SIZE = 25;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Triage Search & Filter Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-hairline)',
        }}
      >
        {/* Left: Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', maxWidth: '420px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-hairline)',
              borderRadius: '6px',
              padding: '6px 12px',
              width: '100%',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search extracted items, tasks, quotes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '12px',
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '11px',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Center: Quick Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${items.length})` },
            { id: 'open', label: 'Open Tasks' },
            { id: 'action_item', label: 'Actions' },
            { id: 'deadline', label: 'Deadlines' },
            { id: 'decision', label: 'Decisions' },
            { id: 'resources', label: 'Links/Resources' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: `1px solid ${activeFilter === f.id ? 'var(--accent)' : 'var(--border-hairline)'}`,
                background: activeFilter === f.id ? 'var(--accent-subtle)' : 'rgba(255, 255, 255, 0.02)',
                color: activeFilter === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: activeFilter === f.id ? '700' : '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right: View Switcher */}
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
              <>
                {(expandedLanes['action'] ? actionItems : actionItems.slice(0, PAGE_SIZE)).map(item => (
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
                {actionItems.length > PAGE_SIZE && (
                  <button
                    onClick={() => toggleLaneExpand('action')}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '5px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {expandedLanes['action'] ? 'Show less' : `Show all ${actionItems.length} (${actionItems.length - PAGE_SIZE} more)`}
                  </button>
                )}
              </>
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
              <>
                {(expandedLanes['deadline'] ? deadlines : deadlines.slice(0, PAGE_SIZE)).map(item => (
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
                {deadlines.length > PAGE_SIZE && (
                  <button
                    onClick={() => toggleLaneExpand('deadline')}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '5px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {expandedLanes['deadline'] ? 'Show less' : `Show all ${deadlines.length} (${deadlines.length - PAGE_SIZE} more)`}
                  </button>
                )}
              </>
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
              <>
                {(expandedLanes['decision'] ? decisions : decisions.slice(0, PAGE_SIZE)).map(item => (
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
                {decisions.length > PAGE_SIZE && (
                  <button
                    onClick={() => toggleLaneExpand('decision')}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '5px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {expandedLanes['decision'] ? 'Show less' : `Show all ${decisions.length} (${decisions.length - PAGE_SIZE} more)`}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Lane 4: Mentions / Resources */}
          <div className="linear-panel" style={{ padding: '14px', borderTop: '2px solid var(--success)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={14} color="var(--success)" />
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>Mentions & Resources</h3>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', padding: '1px 6px', borderRadius: '3px', background: 'var(--success-subtle)', color: 'var(--success)' }}>
                {mentions.length}
              </span>
            </div>

            {mentions.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '12px' }}>
                No direct mentions or referenced links tagged.
              </div>
            ) : (
              <>
                {(expandedLanes['mention'] ? mentions : mentions.slice(0, PAGE_SIZE)).map(item => (
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
                {mentions.length > PAGE_SIZE && (
                  <button
                    onClick={() => toggleLaneExpand('mention')}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '5px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-hairline)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {expandedLanes['mention'] ? 'Show less' : `Show all ${mentions.length} (${mentions.length - PAGE_SIZE} more)`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Mode B: Compact List View (Linear / Superhuman Table) */
        <div className="linear-panel" style={{ padding: '12px' }}>
          {(expandedLanes['list'] ? filteredItems : filteredItems.slice(0, 50)).map(item => (
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
          {filteredItems.length > 50 && (
            <button
              onClick={() => toggleLaneExpand('list')}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {expandedLanes['list'] ? 'Show less' : `Show all ${filteredItems.length} items (${filteredItems.length - 50} more)`}
            </button>
          )}
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
