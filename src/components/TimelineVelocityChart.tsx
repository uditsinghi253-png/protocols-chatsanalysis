/**
 * Timeline Velocity & Activity Matrix Component
 * Displays temporal message frequency and allows interactive cursor scrubbing.
 * Why: Visualizes conversation volume spikes and allows non-linear unread triage.
 */

import React, { useMemo } from 'react';
import { Message, Item, ConversationState } from '../types/schema';
import { Activity, BarChart2, Users } from 'lucide-react';

interface TimelineVelocityChartProps {
  messages: Message[];
  items: Item[];
  conversationState: ConversationState;
  onSetCursor: (messageId: string) => void;
}

export const TimelineVelocityChart: React.FC<TimelineVelocityChartProps> = ({
  messages,
  items,
  conversationState,
  onSetCursor,
}) => {
  if (messages.length === 0) return null;

  // Memoized bucket computation
  const { buckets, maxBucketCount, firstTs, lastTs } = useMemo(() => {
    const bucketCount = Math.min(24, Math.max(8, Math.floor(messages.length / 3)));
    const fTs = new Date(messages[0].ts).getTime();
    const lTs = new Date(messages[messages.length - 1].ts).getTime();
    const span = Math.max(1, lTs - fTs);
    const bucketDuration = span / bucketCount;

    const bList = Array.from({ length: bucketCount }, (_, i) => ({
      index: i,
      startTime: fTs + i * bucketDuration,
      count: 0,
      messageIds: [] as string[],
      isUnreadRange: false,
    }));

    const cursorMsgIdx = messages.findIndex(m => m.id === conversationState.cursorMessageId);
    const cursorTs = cursorMsgIdx !== -1 ? new Date(messages[cursorMsgIdx].ts).getTime() : 0;

    messages.forEach(m => {
      const mTs = new Date(m.ts).getTime();
      const bIdx = Math.min(bucketCount - 1, Math.max(0, Math.floor((mTs - fTs) / bucketDuration)));
      bList[bIdx].count++;
      bList[bIdx].messageIds.push(m.id);
      if (mTs >= cursorTs) {
        bList[bIdx].isUnreadRange = true;
      }
    });

    const maxCount = Math.max(1, ...bList.map(b => b.count));
    return { buckets: bList, maxBucketCount: maxCount, firstTs: fTs, lastTs: lTs };
  }, [messages, conversationState.cursorMessageId]);

  // Memoized participant engagement stats
  const participantList = useMemo(() => {
    const participantStats = new Map<string, { count: number; itemsAssigned: number }>();
    messages.forEach(m => {
      const existing = participantStats.get(m.sender) || { count: 0, itemsAssigned: 0 };
      existing.count++;
      participantStats.set(m.sender, existing);
    });

    items.forEach(it => {
      if (it.owner && participantStats.has(it.owner)) {
        participantStats.get(it.owner)!.itemsAssigned++;
      }
    });

    return Array.from(participantStats.entries())
      .map(([sender, stat]) => ({ sender, ...stat }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [messages, items]);

  // Memoized Urgency Distribution breakdown
  const { critCount, highCount, normCount, lowCount, totalItems } = useMemo(() => {
    const crit = items.filter(i => i.urgency.level === 'critical').length;
    const high = items.filter(i => i.urgency.level === 'high').length;
    const norm = items.filter(i => i.urgency.level === 'normal').length;
    const low = items.filter(i => i.urgency.level === 'low').length;
    return {
      critCount: crit,
      highCount: high,
      normCount: norm,
      lowCount: low,
      totalItems: Math.max(1, items.length),
    };
  }, [items]);

  return (
    <div className="linear-panel" style={{ padding: '20px', marginBottom: '24px' }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="var(--accent)" />
          <h3 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
            Activity Velocity & Temporal Density
          </h3>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Click bar to scrub unread cursor
        </span>
      </div>

      {/* Histogram Bar Scrubber */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '64px', marginBottom: '8px' }}>
        {buckets.map(b => {
          const heightPct = Math.max(12, Math.round((b.count / maxBucketCount) * 100));
          const hasMessages = b.messageIds.length > 0;

          return (
            <div
              key={b.index}
              onClick={() => {
                if (hasMessages) {
                  onSetCursor(b.messageIds[0]);
                }
              }}
              style={{
                flex: 1,
                height: `${heightPct}%`,
                borderRadius: '3px',
                background: b.isUnreadRange ? 'var(--accent)' : 'rgba(255, 255, 255, 0.12)',
                opacity: hasMessages ? 1 : 0.25,
                cursor: hasMessages ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
              title={`Time: ${new Date(b.startTime).toLocaleTimeString()} | Messages: ${b.count} | Click to set cursor`}
            />
          );
        })}
      </div>

      {/* Axis Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-faint)', marginBottom: '20px', fontFamily: 'var(--font-mono)' }}>
        <span>{new Date(firstTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <span style={{ color: 'var(--accent)', fontWeight: '600' }}>Unread Cursor Region</span>
        <span>{new Date(lastTs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {/* Grid of Micro Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', borderTop: '1px solid var(--border-hairline)', paddingTop: '16px' }}>
        {/* Urgency Quantile Breakdown */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <BarChart2 size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Urgency Quantile Distribution
            </span>
          </div>

          <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', gap: '2px', marginBottom: '8px' }}>
            <div style={{ width: `${(critCount / totalItems) * 100}%`, background: 'var(--crit)' }} title={`Critical: ${critCount}`} />
            <div style={{ width: `${(highCount / totalItems) * 100}%`, background: 'var(--warn)' }} title={`High: ${highCount}`} />
            <div style={{ width: `${(normCount / totalItems) * 100}%`, background: 'var(--info)' }} title={`Normal: ${normCount}`} />
            <div style={{ width: `${(lowCount / totalItems) * 100}%`, background: 'var(--text-muted)' }} title={`Low: ${lowCount}`} />
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span><strong style={{ color: 'var(--crit)' }}>{critCount}</strong> Critical</span>
            <span><strong style={{ color: 'var(--warn)' }}>{highCount}</strong> High</span>
            <span><strong style={{ color: 'var(--info)' }}>{normCount}</strong> Normal</span>
            <span><strong>{lowCount}</strong> Low</span>
          </div>
        </div>

        {/* Top Active Participants */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Users size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Participant Obligations
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {participantList.map(p => (
              <span
                key={p.sender}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-hairline)',
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{p.sender}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({p.count} msgs{p.itemsAssigned > 0 ? ` • ${p.itemsAssigned} tasks` : ''})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
