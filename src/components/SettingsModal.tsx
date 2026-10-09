import React, { useState } from 'react';
import { X, User, Globe, Trash2, Check } from 'lucide-react';
import { IdentityProfile } from '../types/schema';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: IdentityProfile;
  onSaveProfile: (profile: IdentityProfile) => void;
  onWipeData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onWipeData,
}) => {
  const [names, setNames] = useState(profile.names.join(', '));
  const [aliases, setAliases] = useState(profile.aliases.join(', '));
  const [handles, setHandles] = useState(profile.handles.join(', '));
  const [timezone, setTimezone] = useState(profile.timezone);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: IdentityProfile = {
      ...profile,
      names: names.split(',').map(s => s.trim()).filter(Boolean),
      aliases: aliases.split(',').map(s => s.trim()).filter(Boolean),
      handles: handles.split(',').map(s => s.trim()).filter(Boolean),
      timezone,
      confirmedByUser: true,
    };
    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel-elevated animate-slide-down"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
            Settings & Identity Profile
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Identity Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <User size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                Your Identity & Mentions
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Full / Display Names (comma-separated):
                </label>
                <input
                  type="text"
                  value={names}
                  onChange={e => setNames(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                  placeholder="Udit, Udit Singhi"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Nicknames & Aliases (comma-separated):
                </label>
                <input
                  type="text"
                  value={aliases}
                  onChange={e => setAliases(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                  placeholder="Udit, Singhi"
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Chat Handles (e.g., @udit):
                </label>
                <input
                  type="text"
                  value={handles}
                  onChange={e => setHandles(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '13px',
                  }}
                  placeholder="@udit"
                />
              </div>
            </div>
          </div>

          {/* Timezone Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Globe size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                System Timezone
              </h4>
            </div>
            <input
              type="text"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Danger Zone */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#ef4444' }}>Purge Local Data</strong>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Instantly wipes all encrypted messages and items from this machine.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to wipe all local data?')) {
                    onWipeData();
                    onClose();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'var(--color-critical-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} />
                <span>Wipe All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={handleSave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--accent-primary)',
              border: 'none',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {savedSuccess ? <Check size={14} /> : null}
            <span>{savedSuccess ? 'Saved!' : 'Save Identity'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
