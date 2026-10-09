import React, { useState, useRef } from 'react';
import { Upload, FileText, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onIngest: (rawContent: string) => void;
  isLoading: boolean;
  progressStage?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onIngest,
  isLoading,
  progressStage,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      readFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      if (content) {
        onIngest(content);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (pasteText.trim()) {
      onIngest(pasteText);
    }
  };

  return (
    <div
      style={{
        maxWidth: '820px',
        margin: '30px auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Intro Hero */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#c7d2fe', fontSize: '13px', marginBottom: '14px' }}>
          <Sparkles size={14} />
          <span>Local-First Unread Chat Triage</span>
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em', color: '#fff', marginBottom: '10px' }}>
          Catch up on missed conversations in seconds.
        </h2>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', lineHeight: '1.6' }}>
          Instantly extracts action items, decisions, approaching deadlines, and unanswered questions — completely offline on your device.
        </p>
      </div>

      {isLoading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="pulse-live" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-primary)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            Analyzing unread messages...
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {progressStage || 'Running deterministic extraction & local scoring...'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Option A: Drop / Upload File */}
          <div
            className="glass-panel"
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '36px 24px',
              textAlign: 'center',
              border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-subtle)',
              background: isDragging ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-card)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '260px',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".txt,.json"
              style={{ display: 'none' }}
            />
            <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Upload size={24} color="var(--accent-primary)" />
            </div>
            <strong style={{ fontSize: '15px', color: '#fff', marginBottom: '6px' }}>
              Drop WhatsApp chat export file (.txt)
            </strong>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Or click to browse from your computer (auto-detects formats)
            </p>
            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
              Supports WhatsApp, Slack, Discord & JSON exports
            </span>
          </div>

          {/* Option B: Direct Paste */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileText size={16} color="var(--accent-primary)" />
              <strong style={{ fontSize: '14px', color: '#fff' }}>Paste Chat Conversation</strong>
            </div>

            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              placeholder="Paste exported chat lines here..."
              style={{
                flex: 1,
                minHeight: '130px',
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'none',
                marginBottom: '14px',
              }}
            />

            <button
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                background: pasteText.trim() ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                color: pasteText.trim() ? '#fff' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: pasteText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
              }}
            >
              <span>Triage Unread Chat</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Privacy Box */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px' }}>
        <ShieldCheck size={15} color="#10b981" />
        <span>Hardware Guarantee: 0 telemetry, 0 cloud calls. Your data never leaves this machine.</span>
      </div>
    </div>
  );
};
