import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SummaryCard } from './components/SummaryCard';
import { TriageLanes } from './components/TriageLanes';
import { EmptyState } from './components/EmptyState';
import { SourceViewerModal } from './components/SourceViewerModal';
import { WhyDrawer } from './components/WhyDrawer';
import { PrivacyProofModal } from './components/PrivacyProofModal';
import { SettingsModal } from './components/SettingsModal';
import { runTriagePipeline } from './engine/pipeline';
import { rescoreAllItems } from './engine/scoring';
import { resolveUnreadCursor } from './engine/cursor';
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
  RuntimeProbeResult,
} from './types/schema';

export const App: React.FC = () => {
  // App Config & Weights
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Identity Profile (User Aliases)
  const [profile, setProfile] = useState<IdentityProfile>({
    names: ['Udit', 'Udit Singhi'],
    aliases: ['Udit', 'Singhi'],
    handles: ['@udit'],
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Kolkata',
    locale: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
    confirmedByUser: false,
  });

  // Triage State
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [summary, setSummary] = useState<TriageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState('');

  // Clock Tick (System Clock Time)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Stream Connection Status
  const [isLiveStreamConnected, setIsLiveStreamConnected] = useState(false);

  // Egress & Runtime Probes
  const [egressStats, setEgressStats] = useState<EgressStats>(egressGuard.getStats());
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeProbeResult>(modelRuntime.getStatus());

  // UI Modal Controls
  const [isPrivacyProofOpen, setIsPrivacyProofOpen] = useState(false);
  const [isWhyDrawerOpen, setIsWhyDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sourceViewerTargetId, setSourceViewerTargetId] = useState<string | null>(null);

  // Connect to local loopback SSE ingest server (Tier 2 Live Mode)
  useEffect(() => {
    let sse: EventSource | null = null;
    let burstTimer: NodeJS.Timeout | null = null;

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
            }, config.runtime.liveBurstDebounceMs);
          }
        } catch {
          // ignore malformed SSE
        }
      };
    } catch {
      // Ingest server not started yet
    }

    return () => {
      if (burstTimer) clearTimeout(burstTimer);
      sse?.close();
    };
  }, [config.runtime.liveBurstDebounceMs]);

  // 1. Install Egress Guard and initialize probes on mount
  useEffect(() => {
    egressGuard.install();
    const unsubscribeEgress = egressGuard.subscribe(setEgressStats);

    // Initial probe of local model servers (Ollama / LM Studio)
    modelRuntime.probeRuntime().then(status => {
      setRuntimeStatus(status);
    });

    // Load persisted state
    (async () => {
      const savedProfile = await localStore.loadIdentityProfile();
      if (savedProfile) setProfile(savedProfile);

      const savedConfig = await localStore.loadConfig();
      if (savedConfig) setConfig(savedConfig);

      const savedSession = await localStore.loadSession();
      if (savedSession && savedSession.messages.length > 0) {
        setMessages(savedSession.messages);
        setConversationState(savedSession.conversationState);
        setItems(savedSession.items);
        setSummary(savedSession.summary);
      }
    })();

    return () => {
      unsubscribeEgress();
    };
  }, []);

  // 2. Real-Time Clock Tick: Rescores time-sensitive deadlines as time passes
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Rescore items if we have active data
      if (items.length > 0) {
        setItems(prevItems => rescoreAllItems(prevItems, config, now));
      }
    }, 5000); // 5-second tick interval

    return () => clearInterval(timer);
  }, [items.length, config]);

  // 3. Pipeline Ingestion Handler
  const handleIngestChat = async (rawContent: string) => {
    setIsLoading(true);
    setProgressStage('Ingesting chat data...');

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
      setItems(result.items);
      setSummary(result.summary);

      // Persist locally
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

  // 4. Update Config from Why Drawer (Live Rescore)
  const handleUpdateConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStore.saveConfig(newConfig);
    if (items.length > 0) {
      setItems(prev => rescoreAllItems(prev, newConfig, currentTime));
    }
  };

  // 5. Update Profile from Settings
  const handleSaveProfile = async (newProfile: IdentityProfile) => {
    setProfile(newProfile);
    await localStore.saveIdentityProfile(newProfile);
    // Re-run pipeline if messages already exist to re-evaluate mentions
    if (messages.length > 0) {
      const result = await runTriagePipeline({
        existingMessages: messages,
        profile: newProfile,
        config,
        manualCursorId: conversationState?.cursorMessageId,
        referenceNow: currentTime,
      });
      setConversationState(result.conversationState);
      setItems(result.items);
      setSummary(result.summary);
    }
  };

  // 6. Manual Cursor movement
  const handleSetManualCursor = async (messageId: string) => {
    if (messages.length === 0) return;
    const userAliases = [...profile.names, ...profile.aliases, ...profile.handles];
    const newState = resolveUnreadCursor(messages, conversationState?.id || 'chat', userAliases, messageId);
    setConversationState(newState);

    const result = await runTriagePipeline({
      existingMessages: messages,
      profile,
      config,
      manualCursorId: messageId,
      referenceNow: currentTime,
    });
    setItems(result.items);
    setSummary(result.summary);
  };

  // 7. Toggle Item status (Done/Dismiss)
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

  // 8. 1-Click Wipe All Data
  const handleWipeData = () => {
    localStore.wipeAllData();
    setMessages([]);
    setConversationState(null);
    setItems([]);
    setSummary(null);
  };

  const hasData = messages.length > 0;

  return (
    <div style={{ minHeight: '100vh', padding: '20px', maxWidth: '1440px', margin: '0 auto' }}>
      <Header
        egressStats={egressStats}
        runtimeStatus={runtimeStatus}
        isLiveStreamConnected={isLiveStreamConnected}
        onOpenPrivacyProof={() => setIsPrivacyProofOpen(true)}
        onOpenWhyDrawer={() => setIsWhyDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onWipeData={handleWipeData}
        hasData={hasData}
      />

      {hasData && summary && conversationState ? (
        <main>
          <SummaryCard summary={summary} conversationState={conversationState} />
          <TriageLanes
            items={items}
            currentTime={currentTime}
            onJumpToSource={msgId => setSourceViewerTargetId(msgId)}
            onToggleStatus={handleToggleStatus}
            onFeedback={() => {}}
          />
        </main>
      ) : (
        <EmptyState
          onIngest={handleIngestChat}
          isLoading={isLoading}
          progressStage={progressStage}
        />
      )}

      {/* Source Viewer Modal */}
      <SourceViewerModal
        isOpen={!!sourceViewerTargetId}
        onClose={() => setSourceViewerTargetId(null)}
        messages={messages}
        highlightMessageId={sourceViewerTargetId}
        onSetCursor={handleSetManualCursor}
        currentCursorId={conversationState?.cursorMessageId}
      />

      {/* Why Drawer (Scoring Sliders) */}
      <WhyDrawer
        isOpen={isWhyDrawerOpen}
        onClose={() => setIsWhyDrawerOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
      />

      {/* Privacy Proof Modal */}
      <PrivacyProofModal
        isOpen={isPrivacyProofOpen}
        onClose={() => setIsPrivacyProofOpen(false)}
        stats={egressStats}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        runtimeStatus={runtimeStatus}
        onRefreshRuntime={async () => {
          const res = await modelRuntime.probeRuntime();
          setRuntimeStatus(res);
        }}
        onWipeData={handleWipeData}
      />
    </div>
  );
};
