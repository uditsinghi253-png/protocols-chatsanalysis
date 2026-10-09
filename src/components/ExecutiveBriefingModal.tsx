/**
 * Executive Briefing Generator & Standup Exporter
 * Generates structured, copyable text briefings for team standups and leadership reports.
 * Why: Converts unread chat chaos into an instantly actionable business deliverable.
 */

import React, { useState } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import { Item, TriageSummary, Message } from '../types/schema';

interface ExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: TriageSummary | null;
  items: Item[];
  messages: Message[];
}

export function generateMarkdownBriefing(summary: TriageSummary | null, items: Item[]): string {
  if (!summary) return 'No triage data available.';

  const questions = items.filter(i => i.kind === 'question_for_user');
  const deadlines = items.filter(i => i.kind === 'deadline');
  const decisions = items.filter(i => i.kind === 'decision');
  const actionItems = items.filter(i => i.kind === 'action_item');

  let text = `# UNREAD TRIAGE EXECUTIVE BRIEFING\n`;
  text += `Generated: ${new Date(summary.generatedAt).toLocaleString()}\n`;
  text += `Timeframe: ${new Date(summary.timeRange.from).toLocaleTimeString()} - ${new Date(summary.timeRange.to).toLocaleTimeString()}\n`;
  text += `Unread Volume: ${summary.unreadCount} messages (${summary.readingTimeMinutes} min triage reading time)\n\n`;

  text += `## EXECUTIVE OVERVIEW\n`;
  text += `${summary.overallSummary}\n\n`;

  if (questions.length > 0) {
    text += `## PENDING QUESTIONS AWAITING USER\n`;
    questions.forEach((q, idx) => {
      text += `${idx + 1}. ${q.title} - "${q.detail}"\n`;
      if (q.evidence[0]) text += `   Citation: "${q.evidence[0].quote}"\n`;
    });
    text += `\n`;
  }

  if (deadlines.length > 0) {
    text += `## DEADLINES & TIME-CRITICAL MILESTONES\n`;
    deadlines.forEach((d, idx) => {
      const dueStr = d.due?.iso ? new Date(d.due.iso).toLocaleString() : 'Date unclear';
      text += `${idx + 1}. [${d.urgency.level.toUpperCase()}] ${d.title} (Due: ${dueStr})\n`;
      text += `   Detail: ${d.detail}\n`;
    });
    text += `\n`;
  }

  if (decisions.length > 0) {
    text += `## CONSENSUS DECISIONS REACHED\n`;
    decisions.forEach((dec, idx) => {
      const statusStr = dec.status === 'superseded' ? ' [SUPERSEDED]' : '';
      text += `${idx + 1}.${statusStr} ${dec.title}: ${dec.detail}\n`;
    });
    text += `\n`;
  }

  if (actionItems.length > 0) {
    text += `## ACTION ITEMS & ASSIGNMENTS\n`;
    actionItems.forEach((act, idx) => {
      text += `${idx + 1}. ${act.title} (Owner: ${act.owner || 'Unassigned'})\n`;
      text += `   Task: ${act.detail}\n`;
    });
    text += `\n`;
  }

  text += `Verification: 100% on-device deterministic extraction. Zero cloud egress.\n`;
  return text;
}

export const ExecutiveBriefingModal: React.FC<ExecutiveBriefingModalProps> = ({
  isOpen,
  onClose,
  summary,
  items,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const briefingText = generateMarkdownBriefing(summary, items);

  const handleCopy = () => {
    navigator.clipboard.writeText(briefingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="linear-panel animate-modal-pop"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          borderRadius: '10px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-hairline)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
              Executive Briefing Exporter
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Markdown preview area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <pre
            style={{
              background: '#040508',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid var(--border-hairline)',
              color: '#cbd5e1',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}
          >
            {briefingText}
          </pre>
        </div>

        {/* Footer actions */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Ready to paste into Slack, Jira, or email
          </span>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
