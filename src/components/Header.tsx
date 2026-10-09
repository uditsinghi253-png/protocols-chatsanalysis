/**
 * Executive Header Toolbar
 * Precision Linear-style header with real-time indicators and keyboard shortcuts.
 * Zero emojis. Strictly clean typography and SVG micro-icons.
 */

import React from 'react';
import { Shield, Sliders, Settings, Trash2, Terminal, FileText, Command, UserX, Sparkles } from 'lucide-react';
import { EgressStats } from '../types/schema';

interface HeaderProps {
  egressStats: EgressStats;
  isLiveStreamConnected?: boolean;
  onOpenCommandPalette: () => void;
  onOpenExecutiveBriefing: () => void;
  onOpenGhostedThreads?: () => void;
  ghostedCount?: number;
  onOpenWrapped?: () => void;
  onOpenPrivacyProof: () => void;
  onOpenWhyDrawer: () => void;
  onOpenSettings: () => void;
  onWipeData: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  egressStats,
  isLiveStreamConnected,
  onOpenCommandPalette,
  onOpenExecutiveBriefing,
  onOpenGhostedThreads,
  ghostedCount = 0,
  onOpenWrapped,
  onOpenPrivacyProof,
  onOpenWhyDrawer,
  onOpenSettings,
  onWipeData,
  hasData,
}) => {
  return (
    <header
      className="linear-panel"
      style={{
        padding: '12px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand & Mission */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Terminal size={14} color="#a5b4fc" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' }}>
              What Did I Miss?
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-hairline)',
                color: 'var(--text-muted)',
              }}
            >
              LOCAL-FIRST
            </span>
          </div>
        </div>
      </div>

      {/* Middle Action: Quick Command Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '6px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-hairline)',
          color: 'var(--text-muted)',
          fontSize: '12px',
          cursor: 'pointer',
        }}
        title="Open command palette (Cmd+K)"
      >
        <Command size={12} />
        <span>Quick search or action...</span>
        <kbd>⌘K</kbd>
      </button>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Ghosted Chats Button */}
        {hasData && (
          <button
            onClick={onOpenGhostedThreads}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: '6px',
              background: (ghostedCount > 0) ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: (ghostedCount > 0) ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-hairline)',
              color: (ghostedCount > 0) ? '#fbbf24' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
            title="Inspect unanswered inquiries and dropped threads"
          >
            <UserX size={12} />
            <span>Ghosted</span>
            {ghostedCount > 0 && (
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  background: '#f59e0b',
                  color: '#000',
                  fontWeight: '700',
                }}
              >
                {ghostedCount}
              </span>
            )}
          </button>
        )}

        {/* Wrapped Analytics Button */}
        {hasData && (
          <button
            onClick={onOpenWrapped}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              color: '#c084fc',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
            title="Open Spotify-Wrapped style collaboration analytics"
          >
            <Sparkles size={12} />
            <span>Wrapped</span>
          </button>
        )}

        {/* Live Watcher Pill */}
        {isLiveStreamConnected && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 9px',
              borderRadius: '6px',
              background: 'var(--accent-subtle)',
              border: '1px solid var(--accent-border)',
              fontSize: '11px',
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span className="led-indicator" style={{ backgroundColor: 'var(--accent)' }} />
            <span>LIVE STREAM</span>
          </div>
        )}

        {/* Executive Standup Briefing Button */}
        {hasData && (
          <button
            onClick={onOpenExecutiveBriefing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 11px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-hairline)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
            title="Export executive standup briefing"
          >
            <FileText size={12} />
            <span>Briefing</span>
          </button>
        )}

        {/* Privacy Proof Button */}
        <button
          onClick={onOpenPrivacyProof}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 11px',
            borderRadius: '6px',
            background: 'var(--success-subtle)',
            border: '1px solid var(--success-border)',
            color: 'var(--success)',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
          title="Inspect privacy proof and egress monitor"
        >
          <Shield size={12} />
          <span>Privacy: {egressStats.blockedRequests} Egress</span>
        </button>

        {/* Tuning / Why Drawer Button */}
        <button
          onClick={onOpenWhyDrawer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-hairline)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            cursor: 'pointer',
          }}
          title="Inspect scoring weights"
        >
          <Sliders size={12} />
          <span>Tuning</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '5px 8px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-hairline)',
            color: 'var(--text-secondary)',
            fontSize: '11px',
            cursor: 'pointer',
          }}
          title="Configure identity profile"
        >
          <Settings size={12} />
        </button>

        {/* Wipe Data */}
        {hasData && (
          <button
            onClick={onWipeData}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '5px 8px',
              borderRadius: '6px',
              background: 'var(--crit-subtle)',
              border: '1px solid var(--crit-border)',
              color: 'var(--crit)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
            title="Purge all local data"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </header>
  );
};
