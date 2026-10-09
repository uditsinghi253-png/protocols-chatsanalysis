import React from 'react';
import { X, Sliders, RotateCcw, Info } from 'lucide-react';
import { AppConfig, DEFAULT_CONFIG } from '../config';

interface WhyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onUpdateConfig: (updated: AppConfig) => void;
}

export const WhyDrawer: React.FC<WhyDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  if (!isOpen) return null;

  const handleWeightChange = (key: keyof AppConfig['weights'], value: number) => {
    const updated: AppConfig = {
      ...config,
      weights: {
        ...config.weights,
        [key]: value,
      },
    };
    onUpdateConfig(updated);
  };

  const handleReset = () => {
    onUpdateConfig(DEFAULT_CONFIG);
  };

  const weightSliders: Array<{
    key: keyof AppConfig['weights'];
    label: string;
    description: string;
    min: number;
    max: number;
    step: number;
  }> = [
    {
      key: 'overdueSaturation',
      label: 'Overdue Deadline Saturation',
      description: 'Urgency boost for tasks whose target deadline has already passed.',
      min: 0.1,
      max: 1.0,
      step: 0.05,
    },
    {
      key: 'deadlineProximity',
      label: 'Approaching Deadline Proximity',
      description: 'Weight given to tasks nearing due time within the horizon window.',
      min: 0.0,
      max: 1.0,
      step: 0.05,
    },
    {
      key: 'directAddress',
      label: 'Direct Mentions of You',
      description: 'Priority bonus when messages tag your name, handle, or aliases.',
      min: 0.0,
      max: 1.0,
      step: 0.05,
    },
    {
      key: 'unansweredAsk',
      label: 'Unanswered Questions to You',
      description: 'Priority for direct inquiries from colleagues awaiting your reply.',
      min: 0.0,
      max: 1.0,
      step: 0.05,
    },
    {
      key: 'imperativeAction',
      label: 'Explicit Action Items & Commitments',
      description: 'Weight given to clear instructions, assignments, and tasks.',
      min: 0.0,
      max: 1.0,
      step: 0.05,
    },
    {
      key: 'falseUrgencyPenalty',
      label: 'False Urgency Penalty (Shouting)',
      description: 'Score reduction for all-caps shouting or exclamation spam without concrete tasks.',
      min: -0.6,
      max: 0.0,
      step: 0.05,
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel-elevated animate-slide-down"
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
              Why Drawer — Scoring Tuning
            </h3>
          </div>
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

        {/* Explainability note */}
        <div style={{ padding: '16px 20px', background: 'rgba(99, 102, 241, 0.08)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}>
          <Info size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '12px', color: '#c7d2fe', lineHeight: '1.45' }}>
            Adjust these weights to customize how priority is calculated. Sliders immediately rescore all items in real-time. Zero black-box magic.
          </p>
        </div>

        {/* Sliders list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {weightSliders.map(slider => {
            const currentVal = config.weights[slider.key];
            return (
              <div key={slider.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                    {slider.label}
                  </label>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                    {currentVal.toFixed(2)}
                  </span>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {slider.description}
                </p>

                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={currentVal}
                  onChange={e => handleWeightChange(slider.key, parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent-primary)',
                    cursor: 'pointer',
                    marginTop: '4px',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
