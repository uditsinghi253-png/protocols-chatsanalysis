/**
 * Main Application Orchestrator
 * High-velocity Linear-style interface with real-time clock ticking,
 * keyboard shortcuts (Cmd+K, j/k), timeline scrubbing, and privacy enforcement.
 * Why: Delivers a defensible, production-ready, executive-grade triage experience.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header, ChatPreset } from './components/Header';
import { SummaryCard } from './components/SummaryCard';
import { TimelineVelocityChart } from './components/TimelineVelocityChart';
import { TriageLanes } from './components/TriageLanes';
import { EmptyState } from './components/EmptyState';
import { SourceViewerModal } from './components/SourceViewerModal';
import { WhyDrawer } from './components/WhyDrawer';
import { PrivacyProofModal } from './components/PrivacyProofModal';
import { SettingsModal } from './components/SettingsModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { ExecutiveBriefingModal } from './components/ExecutiveBriefingModal';
import { GhostedThreadsModal } from './components/GhostedThreadsModal';
import { WrappedModal } from './components/WrappedModal';
import { Clock } from 'lucide-react';
import { runTriagePipeline } from './engine/pipeline';
import { rescoreAllItems } from './engine/scoring';
import { resolveUnreadCursor, TriageScope } from './engine/cursor';
import { detectGhostedThreads } from './engine/ghostDetector';
import { computeWrappedAnalytics } from './engine/wrappedAnalytics';
import { egressGuard } from './security/egressGuard';
import { modelRuntime } from './engine/modelRuntime';
import { localStore } from './storage/localStore';
import { DEFAULT_CONFIG, AppConfig } from './config';
import {
  Message,
  Item,
  IdentityProfile,
  ConversationState,
  TriageSummary,
  EgressStats,
} from './types/schema';

export const App: React.FC = () => {
  // App Config & Weights
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Identity Profile (User Aliases)
  const [profile, setProfile] = useState<IdentityProfile>({
    names: ['Udit', 'Udit Singhi', 'Udit Jain'],
    aliases: ['Udit', 'Singhi', 'Jain'],
    handles: ['@udit'],
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata',
    locale: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    confirmedByUser: false,
  });

  // Triage State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [triageScope, setTriageScope] = useState<TriageScope>('last_7d');
  const [activePreset, setActivePreset] = useState<ChatPreset>('rudra');
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<TriageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState('');

  // Selected Item Index for Keyboard Navigation (j/k)
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

  // Clock Tick (System Clock Time)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Stream Connection Status & Simulation
  const [isLiveStreamConnected, setIsLiveStreamConnected] = useState(false);
  const [isLiveSimulationActive, setIsLiveSimulationActive] = useState(false);

  // Egress Guard Monitoring
  const [egressStats, setEgressStats] = useState<EgressStats>(egressGuard.getStats());

  // Dynamic Refs to prevent stale closure in SSE and timers
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const configRef = useRef(config);
  configRef.current = config;
  const triageScopeRef = useRef(triageScope);
  triageScopeRef.current = triageScope;
  const convStateRef = useRef(conversationState);
  convStateRef.current = conversationState;
  const liveSimulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // UI Modal Controls
  const [isPrivacyProofOpen, setIsPrivacyProofOpen] = useState(false);
  const [isWhyDrawerOpen, setIsWhyDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const [isGhostedModalOpen, setIsGhostedModalOpen] = useState(false);
  const [isWrappedModalOpen, setIsWrappedModalOpen] = useState(false);
  const [sourceViewerTargetId, setSourceViewerTargetId] = useState<string | null>(null);

  // Deep Behavioral & Collaboration Intelligence
  const ghostedThreads = React.useMemo(
    () => detectGhostedThreads(messages, profile, currentTime),
    [messages, profile, currentTime]
  );

  const wrappedAnalytics = React.useMemo(
    () => computeWrappedAnalytics(messages, items, profile),
    [messages, items, profile]
  );

  // Clean up any live simulation interval on unmount
  useEffect(() => {
    return () => {
      if (liveSimulationTimerRef.current) {
        clearInterval(liveSimulationTimerRef.current);
      }
    };
  }, []);

  // 1. Install Egress Guard and initialize session on mount
  useEffect(() => {
    egressGuard.install();
    const unsubscribeEgress = egressGuard.subscribe(setEgressStats);

    // Background silent probe of loopback inference
    modelRuntime.probeRuntime().catch(() => {});

    // Load persisted state or bootstrap with real chat dataset
    (async () => {
      const savedProfile = await localStore.loadIdentityProfile();
      if (savedProfile) setProfile(savedProfile);

      const savedConfig = await localStore.loadConfig();
      if (savedConfig) setConfig(savedConfig);

      const savedSession = await localStore.loadSession();
      // Check if session contains corrupted single markdown line
      const isCorrupted =
        savedSession &&
        savedSession.messages.length === 1 &&
        (savedSession.messages[0]?.sender === 'System' ||
          savedSession.messages[0]?.text.includes('# ') ||
          savedSession.messages[0]?.text.includes('RAG DESIGN'));

      if (isCorrupted) {
        localStore.wipeAllData();
        await handleLoadRealChat();
      } else if (savedSession && savedSession.messages.length > 0) {
        setMessages(savedSession.messages);
        setConversationState(savedSession.conversationState);
        setItems(savedSession.items);
        setSummary(savedSession.summary);
      } else {
        // Auto-bootstrap real chat dataset if store is empty
        await handleLoadRealChat();
      }
    })();

    return () => {
      unsubscribeEgress();
    };
  }, []);

  // 2. Connect to local loopback SSE ingest server (Tier 2 Live Mode)
  useEffect(() => {
    let sse: EventSource | null = null;
    let burstTimer: NodeJS.Timeout | null = null;

    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (!isLocal) {
      // In deployed cloud environment, live mode runs completely in-browser
      setIsLiveStreamConnected(true);
      return;
    }

    try {
      sse = new EventSource('http://127.0.0.1:4040/events');
      sse.onopen = () => setIsLiveStreamConnected(true);
      sse.onerror = () => setIsLiveStreamConnected(false);

      sse.onmessage = e => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'file_updated' && payload.content) {
            // Debounce burst updates (Edge Case E10)
            if (burstTimer) clearTimeout(burstTimer);
            burstTimer = setTimeout(() => {
              handleIngestChat(payload.content);
            }, configRef.current.runtime.liveBurstDebounceMs);
          } else if (payload.type === 'live_turn' && payload.data) {
            const raw = payload.data;
            setMessages(prev => {
              const newMsg: Message = {
                id: `msg_live_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                conversationId: convStateRef.current?.id || 'active_chat',
                ts: raw.ts || new Date().toISOString(),
                sender: raw.sender || 'Rudra',
                senderId: (raw.sender || 'Rudra').toLowerCase().trim(),
                text: raw.text || '',
                ordinal: prev.length,
              };
              const updated = [...prev, newMsg];
              runTriagePipeline({
                existingMessages: updated,
                profile: profileRef.current,
                config: configRef.current,
                scope: triageScopeRef.current,
                manualCursorId: convStateRef.current?.cursorMessageId,
                referenceNow: new Date(),
              }).then(result => {
                setConversationState(result.conversationState);
                setItems(result.items);
                setSummary(result.summary);
                localStore.saveSession(
                  updated,
                  result.items,
                  result.conversationState,
                  result.summary
                );
              });
              return updated;
            });
          }
        } catch {
          // ignore malformed SSE
        }
      };
    } catch {
      // Ingest server not running
    }

    return () => {
      if (burstTimer) clearTimeout(burstTimer);
      sse?.close();
    };
  }, []);

  // 3. Real-Time Clock Tick: Rescores time-sensitive deadlines as time passes
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      if (items.length > 0) {
        setItems(prevItems => rescoreAllItems(prevItems, config, now));
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [items.length, config]);

  // 4. Global Keyboard Shortcuts (Cmd+K, j/k, x, s, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trap typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          setIsCommandPaletteOpen(false);
          setIsPrivacyProofOpen(false);
          setIsWhyDrawerOpen(false);
          setIsSettingsOpen(false);
          setIsBriefingOpen(false);
          setIsGhostedModalOpen(false);
          setIsWrappedModalOpen(false);
          setSourceViewerTargetId(null);
        }
        return;
      }

      // Cmd+K or Ctrl+K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Navigation: j (next item), k (prev item)
      if (e.key === 'j') {
        e.preventDefault();
        setSelectedItemIndex(prev => Math.min(items.length - 1, prev + 1));
      } else if (e.key === 'k') {
        e.preventDefault();
        setSelectedItemIndex(prev => Math.max(0, prev - 1));
      }

      // Toggle done: x
      if (e.key === 'x' && items.length > 0) {
        e.preventDefault();
        const currentItem = items[selectedItemIndex];
        if (currentItem) {
          handleToggleStatus(currentItem.id);
        }
      }

      // Source jump: s
      if (e.key === 's' && items.length > 0) {
        e.preventDefault();
        const currentItem = items[selectedItemIndex];
        if (currentItem && currentItem.evidence[0]) {
          setSourceViewerTargetId(currentItem.evidence[0].messageId);
        }
      }

      // Escape: close any modal
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsPrivacyProofOpen(false);
        setIsWhyDrawerOpen(false);
        setIsSettingsOpen(false);
        setIsBriefingOpen(false);
        setIsGhostedModalOpen(false);
        setIsWrappedModalOpen(false);
        setSourceViewerTargetId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedItemIndex]);

  // 5. Ingest Pipeline Execution
  const handleIngestChat = async (rawContent: string) => {
    setIsLoading(true);
    setProgressStage('Ingesting chat messages...');

    try {
      const result = await runTriagePipeline({
        rawContent,
        profile,
        config,
        referenceNow: new Date(),
        onProgress: setProgressStage,
      });

      setMessages(result.messages);
      setConversationState(result.conversationState);
      setTriageScope(result.scopeUsed);
      setItems(result.items);
      setSummary(result.summary);
      setSelectedItemIndex(0);

      await localStore.saveSession(
        result.messages,
        result.items,
        result.conversationState,
        result.summary
      );
    } catch (err) {
      console.error('Triage pipeline failure:', err);
    } finally {
      setIsLoading(false);
      setProgressStage('');
    }
  };

  const PRESET_FILES: Record<ChatPreset, string> = {
    rudra: 'default_chat.txt',
    cse6: 'cse6_chat.txt',
    maths: 'maths_chat.txt',
  };

  // 5b. Multi-Dataset Loader (Rudra: 7k, CSE 6: 21k, Maths: 1.2k)
  // Universal: loads bundled static chat on any cloud host, falls back to loopback daemon
  const handleLoadPreset = async (preset: ChatPreset = 'rudra') => {
    setActivePreset(preset);
    setIsLoading(true);
    const fileName = PRESET_FILES[preset];
    setProgressStage(`Loading real dataset (${preset.toUpperCase()})...`);
    try {
      let rawText = '';

      // 1. Try static asset bundle (works on Vercel, Netlify, GitHub Pages, Render)
      try {
        const staticRes = await fetch(`./data/${fileName}`);
        if (staticRes.ok) {
          rawText = await staticRes.text();
        }
      } catch {}

      if (!rawText) {
        try {
          const staticRes2 = await fetch(`/data/${fileName}`);
          if (staticRes2.ok) {
            rawText = await staticRes2.text();
          }
        } catch {}
      }

      // 2. Fallback to local ingest server if running on localhost for rudra
      if (
        !rawText &&
        preset === 'rudra' &&
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        try {
          const res = await fetch('http://127.0.0.1:4040/api/default-chat');
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.content) {
              rawText = data.content;
            }
          }
        } catch {}
      }

      if (rawText && rawText.length > 50) {
        await handleIngestChat(rawText);
      } else {
        console.warn('Could not locate preset chat file:', fileName);
      }
    } catch (err) {
      console.warn('Real chat loading failed:', err);
    } finally {
      setIsLoading(false);
      setProgressStage('');
    }
  };

  const handleLoadRealChat = () => handleLoadPreset('rudra');

  // 5c. Real-Time Conversational Live Simulator Toggle
  // Universal: runs client-side simulation everywhere, synchronizing with local daemon if present
  const handleToggleLiveSimulation = async () => {
    if (isLiveSimulationActive) {
      if (liveSimulationTimerRef.current) {
        clearInterval(liveSimulationTimerRef.current);
        liveSimulationTimerRef.current = null;
      }
      setIsLiveSimulationActive(false);

      if (
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        try {
          await fetch('http://127.0.0.1:4040/api/stop-live', { method: 'POST' });
        } catch {}
      }
    } else {
      setIsLiveSimulationActive(true);

      const simulationScript = [
        { sender: 'Rudra', text: 'Hey Udit, did you get a chance to check the auth service?' },
        { sender: 'Udit', text: 'Yeah looking at it now, will deploy the fixes in 10 mins.' },
        { sender: 'Rudra', text: 'Awesome! Can you also send over the updated API docs?' },
        { sender: 'Udit', text: 'Sure, here: https://github.com/protocol/repo/docs' },
        { sender: 'Rudra', text: 'Perfect. What time are we meeting tomorrow?' },
        { sender: 'Udit', text: 'Kal subah 11am milte hai, final decision done!' },
        { sender: 'Rudra', text: 'Sounds good, let me know once done.' },
      ];

      let step = 0;
      if (liveSimulationTimerRef.current) clearInterval(liveSimulationTimerRef.current);

      liveSimulationTimerRef.current = setInterval(() => {
        const item = simulationScript[step % simulationScript.length];
        setMessages(prev => {
          const newMsg: Message = {
            id: `msg_live_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            conversationId: convStateRef.current?.id || 'active_chat',
            ts: new Date().toISOString(),
            sender: item.sender,
            senderId: item.sender.toLowerCase().trim(),
            text: item.text,
            ordinal: prev.length,
          };
          const updated = [...prev, newMsg];
          runTriagePipeline({
            existingMessages: updated,
            profile: profileRef.current,
            config: configRef.current,
            scope: triageScopeRef.current,
            manualCursorId: convStateRef.current?.cursorMessageId,
            referenceNow: new Date(),
          }).then(result => {
            setConversationState(result.conversationState);
            setItems(result.items);
            setSummary(result.summary);
            localStore.saveSession(
              updated,
              result.items,
              result.conversationState,
              result.summary
            );
          });
          return updated;
        });

        step++;
      }, 2000);

      if (
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ) {
        try {
          await fetch('http://127.0.0.1:4040/api/simulate-live', { method: 'POST' });
        } catch {}
      }
    }
  };

  // 6. Config update from Why Drawer
  const handleUpdateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStore.saveConfig(newConfig);
    if (items.length > 0) {
      setItems(prev => rescoreAllItems(prev, newConfig, currentTime));
    }
  };

  // 7. Profile update from Settings
  const handleSaveProfile = async (newProfile: IdentityProfile) => {
    setProfile(newProfile);
    await localStore.saveIdentityProfile(newProfile);
    if (messages.length > 0) {
      const result = await runTriagePipeline({
        existingMessages: messages,
        profile: newProfile,
        config,
        scope: triageScope,
        manualCursorId: conversationState?.cursorMessageId,
        referenceNow: currentTime,
      });
      setConversationState(result.conversationState);
      setItems(result.items);
      setSummary(result.summary);
    }
  };

  // 7b. Select triage scope horizon
  const handleSelectScope = async (newScope: TriageScope) => {
    if (messages.length === 0) return;
    setTriageScope(newScope);
    setIsLoading(true);
    setProgressStage(`Analyzing messages in ${newScope} scope...`);
    try {
      const result = await runTriagePipeline({
        existingMessages: messages,
        profile,
        config,
        scope: newScope,
        manualCursorId: conversationState?.cursorMessageId,
        referenceNow: currentTime,
      });
      setItems(result.items);
      setSummary(result.summary);
      setSelectedItemIndex(0);
    } catch (err) {
      console.error('Scope switch error:', err);
    } finally {
      setIsLoading(false);
      setProgressStage('');
    }
  };

  // 8. Scrub / Set Cursor from Timeline or Citation
  const handleSetManualCursor = async (messageId: string) => {
    if (messages.length === 0) return;
    const userAliases = [...profile.names, ...profile.aliases, ...profile.handles];
    const newState = resolveUnreadCursor(messages, conversationState?.id || 'chat', userAliases, messageId);
    setConversationState(newState);
    setTriageScope('unread');

    const result = await runTriagePipeline({
      existingMessages: messages,
      profile,
      config,
      scope: 'unread',
      manualCursorId: messageId,
      referenceNow: currentTime,
    });
    setItems(result.items);
    setSummary(result.summary);
  };

  // 9. Toggle Item status (Done/Reopen)
  const handleToggleStatus = (itemId: string) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id === itemId) {
          const newStatus = it.status === 'done' ? 'open' : 'done';
          return {
            ...it,
            status: newStatus,
            urgency: {
              ...it.urgency,
              score: newStatus === 'done' ? 0.05 : 0.6,
              level: newStatus === 'done' ? 'low' : 'normal',
            },
          };
        }
        return it;
      })
    );
  };

  // 10. Wipe all local data
  const handleWipeData = () => {
    localStore.wipeAllData();
    setMessages([]);
    setConversationState(null);
    setItems([]);
    setSummary(null);
  };

  const hasData = messages.length > 0;
  const activeSelectedId = items[selectedItemIndex]?.id || null;

  return (
    <div style={{ minHeight: '100vh', padding: '16px 24px', maxWidth: '1440px', margin: '0 auto' }}>
      <Header
        egressStats={egressStats}
        isLiveStreamConnected={isLiveStreamConnected}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenExecutiveBriefing={() => setIsBriefingOpen(true)}
        onOpenGhostedThreads={() => setIsGhostedModalOpen(true)}
        ghostedCount={ghostedThreads.length}
        onOpenWrapped={() => setIsWrappedModalOpen(true)}
        onOpenPrivacyProof={() => setIsPrivacyProofOpen(true)}
        onOpenWhyDrawer={() => setIsWhyDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onWipeData={handleWipeData}
        onLoadRealChat={handleLoadRealChat}
        onLoadPreset={handleLoadPreset}
        activePreset={activePreset}
        isLiveSimulationActive={isLiveSimulationActive}
        onToggleLiveSimulation={handleToggleLiveSimulation}
        hasData={hasData}
      />

      {hasData && summary && conversationState ? (
        <main>
          {/* Interactive Triage Scope Selector */}
          <div
            className="linear-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              marginBottom: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} color="var(--accent)" />
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                Triage Horizon
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                ({summary.unreadCount} msgs · {items.length} extracted items)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'unread', label: 'Unread Catch-Up' },
                { id: 'last_24h', label: 'Past 24 Hours' },
                { id: 'last_7d', label: 'Past 7 Days' },
                { id: 'last_30d', label: 'Past 30 Days' },
                { id: 'all', label: `Full Backlog (${messages.length})` },
              ].map(s => {
                const isActive = triageScope === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectScope(s.id as TriageScope)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: isActive ? '700' : '500',
                      background: isActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-hairline)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Executive Summary Card */}
          <SummaryCard summary={summary} conversationState={conversationState} />

          {/* Activity Velocity & Temporal Histogram Scrubber */}
          <TimelineVelocityChart
            messages={messages}
            items={items}
            conversationState={conversationState}
            onSetCursor={handleSetManualCursor}
          />

          {/* Triage Perspectives (Kanban / Compact List) */}
          <TriageLanes
            items={items}
            currentTime={currentTime}
            selectedItemId={activeSelectedId}
            onJumpToSource={msgId => setSourceViewerTargetId(msgId)}
            onToggleStatus={handleToggleStatus}
            onFeedback={() => {}}
          />
        </main>
      ) : (
        <EmptyState
          onIngest={handleIngestChat}
          onLoadRealChat={handleLoadRealChat}
          onLoadPreset={handleLoadPreset}
          isLoading={isLoading}
          progressStage={progressStage}
        />
      )}

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        items={items}
        onSelectItem={item => {
          const idx = items.findIndex(it => it.id === item.id);
          if (idx !== -1) setSelectedItemIndex(idx);
          if (item.evidence[0]) setSourceViewerTargetId(item.evidence[0].messageId);
        }}
        onOpenPrivacyProof={() => setIsPrivacyProofOpen(true)}
        onOpenWhyDrawer={() => setIsWhyDrawerOpen(true)}
        onCopyBriefing={() => setIsBriefingOpen(true)}
        onWipeData={handleWipeData}
        onOpenGhostedThreads={() => setIsGhostedModalOpen(true)}
        onOpenWrapped={() => setIsWrappedModalOpen(true)}
      />

      {/* Executive Standup Briefing Exporter Modal */}
      <ExecutiveBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        summary={summary}
        items={items}
        messages={messages}
      />

      {/* Ghosted Inquiries & Dropped Threads Modal */}
      <GhostedThreadsModal
        isOpen={isGhostedModalOpen}
        onClose={() => setIsGhostedModalOpen(false)}
        threads={ghostedThreads}
        onJumpToSource={msgId => setSourceViewerTargetId(msgId)}
      />

      {/* Collaboration Wrapped Analytics Modal */}
      <WrappedModal
        isOpen={isWrappedModalOpen}
        onClose={() => setIsWrappedModalOpen(false)}
        analytics={wrappedAnalytics}
      />

      {/* Source Verification Context Modal */}
      <SourceViewerModal
        isOpen={!!sourceViewerTargetId}
        onClose={() => setSourceViewerTargetId(null)}
        messages={messages}
        highlightMessageId={sourceViewerTargetId}
        onSetCursor={handleSetManualCursor}
        currentCursorId={conversationState?.cursorMessageId}
      />

      {/* Scoring Weights Why Drawer */}
      <WhyDrawer
        isOpen={isWhyDrawerOpen}
        onClose={() => setIsWhyDrawerOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
      />

      {/* Local-First Privacy Proof Modal */}
      <PrivacyProofModal
        isOpen={isPrivacyProofOpen}
        onClose={() => setIsPrivacyProofOpen(false)}
        stats={egressStats}
      />

      {/* Identity & Profile Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        onWipeData={handleWipeData}
      />
    </div>
  );
};
