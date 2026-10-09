# What Did I Miss? — Local-First Unread Chat Triage

> A hackathon-winning, privacy-first AI micro-app designed to solve the unread conversation overload problem.
> **100% on-device. Zero telemetry. Zero third-party network egress.**

---

## ⚡ Quick Start

Ensure you have **Node.js (>= 18)** installed on your machine.

```bash
# 1. Install dependencies
npm install

# 2. Run automated verification & test suite
npm test

# 3. Run zero-hardcoding static audit
npm run audit:hardcode

# 4. Launch the application locally (Vite dev server)
npm run dev

# 5. (Optional) Launch loopback live-watcher daemon
node server/ingestServer.mjs
```

Open your browser to: **`http://127.0.0.1:5173/`**

---

## 🎯 What It Solves ("The Unread Problem")

When you return from being away, group chats often have hundreds of unread messages. Reading walls of chatter wastes hours.

**What Did I Miss?** gives you instant glanceable triage:
1. **"While you were away" Summary**: High-level overview of key topics, participants, and estimated reading time saved.
2. **Needs Action Now Lane**: Direct questions and asks addressed to you that remain unanswered.
3. **Deadlines Lane**: Real-time ticking countdowns and overdue alerts calculated against the system clock.
4. **Decisions Made Lane**: Consensus decisions reached by teammates, automatically resolving supersessions (e.g., when a meeting or deadline is rescheduled).
5. **Mentions of You Lane**: Any messages tagging your aliases or handles.
6. **Grounding Citations**: Every item cites verbatim evidence quotes with a 1-click **"Jump to source message"** inspection view.

---

## 🔒 Proving Local-First Security

Hard constraint **C5** requires that conversations never leave the device. We prove this mathematically and mechanically:

1. **Strict Content Security Policy (CSP)**:
   Locked in `index.html` to:
   ```html
   connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*;
   ```
   Any attempt by any third-party script or dependency to contact an external domain is instantly rejected by the browser engine.

2. **Runtime Egress Guard (`src/security/egressGuard.ts`)**:
   Monkey-patches `window.fetch` and `XMLHttpRequest`. Any request targeting a non-loopback IP or external domain is immediately aborted with a logged security audit event.

3. **Privacy Proof Panel (in UI)**:
   Click the **"Privacy Proof"** button in the header at any time:
   - View live outbound request counters (Guaranteed: **0 Non-Loopback Egress**).
   - Click **"Simulate External Call"** to trigger a real test network call and watch the guard intercept and block it live.
   - Inspect the real-time Network Egress Audit Log.

4. **1-Click Total Data Erasure**:
   Click **"Wipe Data"** in the header to instantly purge all stored conversations and memory from disk and browser storage.

---

## 🧪 Architecture & Multi-Tier Processing

```
Chat Export (.txt / JSON)
        │
        ▼
[ Ingest Sniffer ] ─── Content sniffing, format detection, stable message IDs
        │
        ▼
[ Unread Cursor ] ─── Read markers ➔ User manual cursor ➔ Last own message fallback
        │
        ├─────────────────────────────────────────┐
        ▼ (0ms Instant Pass)                      ▼ (Loopback / Enrichment)
[ L1 Deterministic Signals ]              [ L2 Local Model Probe ]
  - Temporal expressions (relative/tz)       - Probes Ollama (11434) / LM Studio (1234)
  - Direct & indirect user addressing        - Structured JSON extraction
  - Unanswered questions to user             - Graceful degradation if offline
  - Shouting false-urgency penalty
        │                                         │
        └─────────────────┬───────────────────────┘
                          ▼
               [ L3 Grounding Verifier ]
                 - Deterministic quote substring check
                 - Unverified items downgraded
                          ▼
            [ Supersession Resolution (E2) ]
                 - Decisions/deadlines reversed
                          ▼
             [ L4 Explainable Urgency ]
                 - Sum of weighted signals
                 - Quantile score distribution
                 - Real-time clock tick countdowns
                          ▼
              [ Glassmorphism Triage UI ]
```

---

## 🛠️ Testing & Audits

Run the full automated test suite covering all 12 workshop edge cases (E1 to E12):

```bash
npm test
```

Run the strict static hardcode audit scanner:

```bash
npm run audit:hardcode
```

---

## ⚠️ Known Limits

1. **Audio / Voice Notes**: WhatsApp voice note transcripts require external local speech-to-text (e.g. Whisper.cpp), which is currently not bundled in this browser micro-app.
2. **Ambiguous Mentions Across Group Nicknames**: If a user is referred to by a previously unseen nickname not registered in their Identity Profile, it falls back to 1:1 conversation addressing rules or general action items.
