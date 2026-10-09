/**
 * Linear-Grade Chat Selection & Empty State Component
 * Dedicated Chat Selection Page presenting verified datasets,
 * drag-and-drop .zip/.txt ingestion, and real-time paste inputs.
 * Zero emojis. Strictly clean typography, monospace badges, and SVG icons.
 */

import React, { useState, useRef } from 'react';
import { Upload, FileText, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import JSZip from 'jszip';

interface EmptyStateProps {
  onIngest: (rawContent: string) => void;
  onLoadRealChat?: () => void;
  onLoadPreset?: (preset: 'rudra' | 'cse6' | 'maths') => void;
  isLoading: boolean;
  progressStage?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onIngest,
  onLoadPreset,
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
        maxWidth: '920px',
        margin: '30px auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
      }}
    >
      {/* Hero Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '4px',
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent-border)',
            color: 'var(--accent)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            fontWeight: '600',
            marginBottom: '14px',
          }}
        >
          <span>PROTOCOLX • LOCAL-FIRST INTELLIGENCE</span>
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.03em', color: '#fff', marginBottom: '8px' }}>
          Select a Conversation to Analyze
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', lineHeight: '1.6' }}>
          Choose from verified real-world WhatsApp datasets below, or import your own chat export. 100% on-device processing with zero data egress.
        </p>
      </div>

      {isLoading ? (
        <div className="linear-panel" style={{ padding: '56px 24px', textAlign: 'center' }}>
          <div className="led-indicator" style={{ backgroundColor: 'var(--accent)', width: '12px', height: '12px', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
            Processing Conversation Stream
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {progressStage || 'Executing deterministic parsing, unread extraction, and telemetry analysis...'}
          </p>
        </div>
      ) : (
        <>
          {/* Section 1: Verified WhatsApp Datasets */}
          {onLoadPreset && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: '700',
                  }}
                >
                  Verified WhatsApp Datasets
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-hairline)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '14px' }}>
                {[
                  {
                    id: 'rudra' as const,
                    name: 'Rudra & Udit',
                    category: '1:1 Direct Collaboration',
                    badge: '7,097 messages • 2 members • 625 KB',
                    summary: 'Direct engineering partnership with rapid decision cycles, nocturnal bursts, and 44 unreturned inquiry threads.',
                  },
                  {
                    id: 'cse6' as const,
                    name: 'CSE 6 Cohort',
                    category: 'College Batch Group',
                    badge: '20,964 messages • 87 members • 2.12 MB',
                    summary: 'High-density university class group with multi-party discussions, assignment deadlines, and announcement flurries.',
                  },
                  {
                    id: 'maths' as const,
                    name: 'Maths CSE 6',
                    category: 'Academic Workgroup',
                    badge: '1,242 messages • 35 members • 187 KB',
                    summary: 'Subject coordination workgroup with coursework questions, exam timelines, and lecture materials.',
                  },
                ].map(chat => (
                  <div
                    key={chat.id}
                    className="linear-panel"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {chat.category}
                        </span>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Zap size={11} color="#a5b4fc" />
                        </div>
                      </div>

                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
                        {chat.name}
                      </h3>

                      <div
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          color: '#a5b4fc',
                          marginBottom: '10px',
                        }}
                      >
                        {chat.badge}
                      </div>

                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
                        {chat.summary}
                      </p>
                    </div>

                    <button
                      onClick={() => onLoadPreset(chat.id)}
                      style={{
                        width: '100%',
                        padding: '9px 14px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      <span>Analyze Conversation</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Custom Ingestion (File Drop or Paste) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: '700',
                }}
              >
                Or Import Your Own WhatsApp Export
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-hairline)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
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
                  padding: '28px 20px',
                  textAlign: 'center',
                  border: isDragging ? '1px dashed var(--accent)' : '1px dashed var(--border-subtle)',
                  background: isDragging ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '220px',
                  transition: 'all 0.15s ease',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".txt,.json,.zip"
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-hairline)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <Upload size={18} color="var(--accent)" />
                </div>
                <strong style={{ fontSize: '13px', color: '#fff', marginBottom: '4px' }}>
                  Drop WhatsApp export (.zip / .txt)
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', maxWidth: '280px' }}>
                  Auto-detects iOS bracketed, Android dash, and JSON formats
                </p>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <kbd>.ZIP</kbd>
                  <kbd>.TXT</kbd>
                  <kbd>WHATSAPP</kbd>
                </div>
              </div>

              {/* Card B: Direct Paste */}
              <div className="linear-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={14} color="var(--accent)" />
                    <strong style={{ fontSize: '13px', color: '#fff' }}>Paste Chat Conversation</strong>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    <kbd style={{ marginRight: '4px' }}>⌘V</kbd> to paste
                  </span>
                </div>

                <textarea
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)}
                  placeholder="Paste exported chat lines here..."
                  style={{
                    flex: 1,
                    minHeight: '110px',
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    background: '#040508',
                    border: '1px solid var(--border-hairline)',
                    color: '#fff',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    resize: 'none',
                    marginBottom: '12px',
                    outline: 'none',
                  }}
                />

                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
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
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Parse & Analyze</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Security Assurance Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
        <ShieldCheck size={13} color="var(--success)" />
        <span>ZERO NETWORK EGRESS • RUNS 100% LOCALLY IN YOUR BROWSER</span>
      </div>
    </div>
  );
};
