import React from 'react';
import { Shield, Sliders, Settings, Trash2, Cpu } from 'lucide-react';
import { EgressStats, RuntimeProbeResult } from '../types/schema';

interface HeaderProps {
  egressStats: EgressStats;
  runtimeStatus: RuntimeProbeResult;
  isLiveStreamConnected?: boolean;
  onOpenPrivacyProof: () => void;
  onOpenWhyDrawer: () => void;
  onOpenSettings: () => void;
  onWipeData: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  egressStats,
  runtimeStatus,
  isLiveStreamConnected,
  onOpenPrivacyProof,
  onOpenWhyDrawer,
  onOpenSettings,
  onWipeData,
  hasData,
}) => {
  return (
    <header className="glass-panel" style={{ padding: '14px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>⚡</span>
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
            What Did I Miss?
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Local-First Unread Triage</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
              <span className="pulse-live" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              On-Device Only
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Active Runtime Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
          <Cpu size={14} color={runtimeStatus.isOnline ? '#10b981' : '#94a3b8'} />
          <span style={{ color: 'var(--text-secondary)' }}>Engine:</span>
          <strong style={{ color: runtimeStatus.isOnline ? '#a5b4fc' : '#cbd5e1' }}>
            {runtimeStatus.isOnline 
              ? `${runtimeStatus.engineType.toUpperCase()} (${runtimeStatus.activeModel || 'Active'})`
              : 'Deterministic L1 (Offline)'}
          </strong>
        </div>

        {/* Live Loopback Stream Badge */}
        {isLiveStreamConnected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '12px', color: '#c7d2fe' }}>
            <span className="pulse-live" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#6366f1' }} />
            <span>Live Watcher</span>
          </div>
        )}

        {/* Privacy Proof Button */}
        <button
          onClick={onOpenPrivacyProof}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '8px',
            background: 'var(--color-success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#10b981',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Inspect privacy proof and egress monitor"
        >
          <Shield size={14} />
          <span>Privacy Proof: {egressStats.blockedRequests} Egress Blocked</span>
        </button>

        {/* Why Drawer Button */}
        <button
          onClick={onOpenWhyDrawer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#a5b4fc',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
          title="Adjust scoring weights and inspect why ranking works"
        >
          <Sliders size={14} />
          <span>Why Drawer</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
          title="Configure identity profile, timezone, and models"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>

        {/* 1-Click Wipe Button */}
        {hasData && (
          <button
            onClick={onWipeData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'var(--color-critical-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '12px',
              cursor: 'pointer',
            }}
            title="Instantly purge all stored chat messages and memory"
          >
            <Trash2 size={14} />
            <span>Wipe Data</span>
          </button>
        )}
      </div>
    </header>
  );
};
