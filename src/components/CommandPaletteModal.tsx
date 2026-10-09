/**
 * Linear-Style Command Palette (Cmd+K / Ctrl+K)
 * Power-user interface for instant search, filtering, view switching, and actions.
 * Why: High-velocity triage without reaching for a mouse.
 */

import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, FileText, Shield, Sliders, Copy, Trash2, UserX, Sparkles } from 'lucide-react';
import { Item } from '../types/schema';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  onSelectItem: (item: Item) => void;
  onOpenPrivacyProof: () => void;
  onOpenWhyDrawer: () => void;
  onCopyBriefing: () => void;
  onWipeData: () => void;
  onOpenGhostedThreads?: () => void;
  onOpenWrapped?: () => void;
  onSelectChatPage?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onOpenPrivacyProof,
  onOpenWhyDrawer,
  onCopyBriefing,
  onWipeData,
  onOpenGhostedThreads,
  onOpenWrapped,
  onSelectChatPage,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter(it =>
    it.title.toLowerCase().includes(query.toLowerCase()) ||
    it.detail.toLowerCase().includes(query.toLowerCase()) ||
    (it.owner && it.owner.toLowerCase().includes(query.toLowerCase()))
  );

  const actions = [
    {
      id: 'select_chat',
      label: 'Switch / Select Conversation to Analyze',
      icon: <FileText size={14} color="#a5b4fc" />,
      execute: () => { onSelectChatPage?.(); onClose(); },
    },
    {
      id: 'ghosted',
      label: 'Inspect Ghosted Inquiries & Unreturned Threads',
      icon: <UserX size={14} color="#fbbf24" />,
      execute: () => { onOpenGhostedThreads?.(); onClose(); },
    },
    {
      id: 'wrapped',
      label: 'Open Collaboration Wrapped Analytics (Velocity & Archetype)',
      icon: <Sparkles size={14} color="#c084fc" />,
      execute: () => { onOpenWrapped?.(); onClose(); },
    },
    {
      id: 'briefing',
      label: 'Copy Executive Standup Briefing to Clipboard',
      icon: <Copy size={14} />,
      execute: () => { onCopyBriefing(); onClose(); },
    },
    {
      id: 'privacy',
      label: 'Inspect Local Privacy Proof & Egress Monitor',
      icon: <Shield size={14} />,
      execute: () => { onOpenPrivacyProof(); onClose(); },
    },
    {
      id: 'tuning',
      label: 'Tune Scoring Weights in Why Drawer',
      icon: <Sliders size={14} />,
      execute: () => { onOpenWhyDrawer(); onClose(); },
    },
    {
      id: 'wipe',
      label: 'Purge & Wipe All Device Storage',
      icon: <Trash2 size={14} color="var(--crit)" />,
      execute: () => { onWipeData(); onClose(); },
    },
  ];

  const totalOptions = filteredItems.length + actions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, totalOptions));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalOptions) % Math.max(1, totalOptions));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredItems.length) {
        onSelectItem(filteredItems[selectedIndex]);
        onClose();
      } else {
        const actionIdx = selectedIndex - filteredItems.length;
        if (actions[actionIdx]) {
          actions[actionIdx].execute();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onClick={onClose}
    >
      <div
        className="linear-panel animate-modal-pop"
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--border-subtle)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border-hairline)', gap: '10px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search triage items..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
          <kbd>ESC</kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
          {filteredItems.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-faint)', padding: '6px 10px', letterSpacing: '0.05em' }}>
                Unread Triage Items
              </div>
              {filteredItems.slice(0, 6).map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item);
                      onClose();
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.kind === 'action_item' && <CheckCircle size={14} color="var(--success)" />}
                      {item.kind === 'deadline' && <Clock size={14} color="var(--warn)" />}
                      {item.kind === 'decision' && <FileText size={14} color="var(--accent)" />}
                      <span style={{ fontSize: '13px', color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                        {item.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {item.urgency.level.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-faint)', padding: '6px 10px', letterSpacing: '0.05em' }}>
              Productivity Commands
            </div>
            {actions.map((act, aIdx) => {
              const overallIdx = filteredItems.length + aIdx;
              const isSelected = overallIdx === selectedIndex;

              return (
                <div
                  key={act.id}
                  onClick={act.execute}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                    border: isSelected ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{act.icon}</span>
                  <span style={{ fontSize: '13px', color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                    {act.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Navigation Hints */}
        <div style={{ padding: '8px 16px', background: 'rgba(0, 0, 0, 0.25)', borderTop: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><kbd style={{ marginRight: '4px' }}>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd style={{ marginRight: '4px' }}>↵</kbd> Select</span>
          </div>
          <span>Local Engine Active</span>
        </div>
      </div>
    </div>
  );
};
