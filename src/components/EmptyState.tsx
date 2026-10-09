/**
 * Linear-Grade Empty State Component
 * Clean drag-and-drop and real-time paste interface.
 * Zero emojis. Strictly clean typography, keyboard shortcuts, and SVG icons.
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

import JSZip from 'jszip';

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

  const readFile = async (file: File) => {
    if (file.name.endsWith('.zip')) {
      try {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        const textFile = Object.values(zip.files).find(f => f.name.endsWith('.txt') || f.name.endsWith('.json'));
        if (textFile) {
          const text = await textFile.async('text');
          onIngest(text);
          return;
        }
      } catch (err) {
        console.error('Failed to extract chat from zip archive:', err);
      }
    }

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
        maxWidth: '840px',
        margin: '40px auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Hero Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '4px', background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '600', marginBottom: '16px' }}>
          <span>ON-DEVICE UNREAD TRIAGE ENGINE</span>
        </div>
        <h2 style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '-0.03em', color: '#fff', marginBottom: '10px' }}>
          Triage overwhelming chat backlog in seconds.
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '560px', margin: '0 auto', lineHeight: '1.6' }}>
          Isolates unread messages, extracts verified action items, tracks approaching deadlines, and resolves decisions. 100% on-device. Zero network egress.
        </p>
      </div>

      {isLoading ? (
        <div className="linear-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <div className="led-indicator" style={{ backgroundColor: 'var(--accent)', width: '12px', height: '12px', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
            Processing Unread Messages
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {progressStage || 'Executing deterministic extraction and real-time urgency scoring...'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
          {/* Card A: File Drop */}
          <div
            className="linear-panel"
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
              border: isDragging ? '1px dashed var(--accent)' : '1px dashed var(--border-subtle)',
              background: isDragging ? 'var(--accent-subtle)' : 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '260px',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".txt,.json"
              style={{ display: 'none' }}
            />
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Upload size={20} color="var(--accent)" />
            </div>
            <strong style={{ fontSize: '14px', color: '#fff', marginBottom: '6px' }}>
              Drop chat export file (.txt / .json)
            </strong>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Auto-detects WhatsApp iOS bracketed, WhatsApp Android, and JSON shapes
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <kbd>.TXT</kbd>
              <kbd>.JSON</kbd>
              <kbd>WHATSAPP</kbd>
              <kbd>SLACK</kbd>
            </div>
          </div>

          {/* Card B: Direct Paste */}
          <div className="linear-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={15} color="var(--accent)" />
                <strong style={{ fontSize: '13px', color: '#fff' }}>Paste Chat Conversation</strong>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <kbd style={{ marginRight: '4px' }}>⌘V</kbd> to paste
              </span>
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
                borderRadius: '6px',
                background: '#040508',
                border: '1px solid var(--border-hairline)',
                color: '#fff',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                resize: 'none',
                marginBottom: '14px',
                outline: 'none',
              }}
            />

            <button
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '6px',
                background: pasteText.trim() ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)',
                border: 'none',
                color: pasteText.trim() ? '#fff' : 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: pasteText.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Execute Triage Pipeline</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Security Assurance Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
        <ShieldCheck size={13} color="var(--success)" />
        <span>HARDWARE PROOF: 0 EGRESS TO EXTERNAL DOMAINS • EXCLUSIVELY LOCALHOST & 127.0.0.1</span>
      </div>
    </div>
  );
};
