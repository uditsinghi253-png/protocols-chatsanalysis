# ProtocolX — Architectural Context & Technical Specification

> **Production Deployed Application:** [https://uditsinghi253-png.github.io/protocols-chatsanalysis/](https://uditsinghi253-png.github.io/protocols-chatsanalysis/)  
> **Source Repository:** [https://github.com/uditsinghi253-png/protocols-chatsanalysis](https://github.com/uditsinghi253-png/protocols-chatsanalysis)  
> **Local Workspace Dev Server:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)  
> **Local Stream Ingestion Daemon:** [http://127.0.0.1:4040/health](http://127.0.0.1:4040/health)  

---

## 1. Executive Summary & Problem Definition

**ProtocolX ("What Did I Miss?")** is an executive-grade, local-first intelligence application engineered for high-velocity conversation triage. Knowledge workers, engineers, and student cohorts returning from deep focus or absence are routinely confronted with hundreds of unread messages across fragmented chat channels.

Skimming chat backlogs creates two critical points of failure:
1. **Operational Blindspots:** Dropped action items, unreturned critical inquiries, and obsolete decisions that were subsequently superseded.
2. **Severe Privacy Exposure:** Feeding confidential personal or enterprise chat logs to cloud-hosted LLM endpoints violates corporate data governance and personal privacy.

ProtocolX solves both challenges through a **zero-egress, client-side intelligence architecture**. It deterministically parses, filters, scores, and surfaces urgent commitments and communication dynamics across tens of thousands of messages in milliseconds—operating entirely inside the user's browser runtime with cryptographic and network-level deployment protections.

---

## 2. Core Architectural Pillars

```
+---------------------------------------------------------------------------------------+
|                                    PROTOCOLX CLIENT                                   |
|                                                                                       |
|   +-----------------------+     +-----------------------+     +-------------------+   |
|   | Universal Ingestion   | --> | Dynamic Unread Cursor | --> | Signal Extraction |   |
|   | Bracketed/Dash/Zips   |     | Time/Sender Anchor    |     | 4 Primary Kinds   |   |
|   +-----------------------+     +-----------------------+     +---------+---------+   |
|                                                                         |             |
|                                 +---------------------------------------+             |
|                                 v                                                     |
|   +-----------------------+     +-----------------------+     +-------------------+   |
|   | Grounding Verifier    | <-- | Ghosted Inquiries &   | <-- | Explainable Score |   |
|   | 100% Substring Cites  |     | Collaboration Wrapped |     | Proximity Weights |   |
|   +-----------+-----------+     +-----------------------+     +-------------------+   |
|               |                                                                       |
|               v                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   | Executive Linear UI: Velocity Scrubber | Cmd+K Palette | Zero-Emoji Visuals   |   |
|   +-------------------------------------------------------------------------------+   |
|               |                                                                       |
|               v                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   | Security & Egress Guard: Zero External HTTP/WS egress | Strict CSP Lock       |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

### 2.1. Local-First Zero-Egress Boundary
- **Enforced via Immutable Content Security Policy:** `index.html` restricts network connections strictly to `'self'`, `127.0.0.1:*`, and `localhost:*`.
- **Runtime Egress Sentinel:** Installed at `src/security/egressGuard.ts` to hook `window.fetch` and `XMLHttpRequest`, intercepting and aborting any unauthorized outbound network request attempts.
- **Zero Cloud Leakage:** Chat messages, sender phone numbers, timestamps, and extracted commitments never transit external servers or third-party inference providers.

### 2.2. Deterministic Signal Extraction with Verbatim Grounding
- **Anti-Hallucination Design:** Extracted items are not speculative generative approximations. Every item belongs to one of four strongly-typed kinds:
  1. `question_for_user`: Direct inquiries or unanswered questions addressed to the user.
  2. `action_item`: Explicit commitments, tasks, or delegated deliverables.
  3. `decision`: Concluded agreements or finalized directions.
  4. `important_message`: Critical resource links, credentials, or high-priority notifications.
- **Verbatim Grounding Verifier (`src/engine/groundingVerifier.ts`):** 100% of extracted items undergo a programmatic citation audit that validates whether every evidence quote exists as an exact, non-empty substring of a message in the active scope. If an item fails this test, it is purged.
- **Supersession Resolution Engine (`src/engine/supersession.ts`):** Automatically detects linguistic counters and negation qualifiers (*"actually let's go with Monday instead"*, *"scratch that"*), linking and retiring obsolete commitments in real time.

### 2.3. Behavioral Intelligence & Interaction Telemetry
- **Ghosted Thread Detection Engine (`src/engine/ghostDetector.ts`):**
  - Identifies unreturned inquiries, dropped threads, and asymmetric silence across conversations.
  - Automatically isolates whether the user owes a response to counterparties or if counterparties owe a response to the user.
  - Computes exact wait durations in days/hours and highlights unanswered dependencies.
- **Collaboration Wrapped Analytics (`src/engine/wrappedAnalytics.ts`):**
  - Deep longitudinal telemetry across chat history.
  - Computes message and word distributions, median reply latencies, conversation balance parity ratios, and top shared domains/keywords.
  - Assigns grounded conversation archetypes (e.g., *"Night Owl Hacker Duo"*, *"The Broadcast Channel"*, *"The Rapid-Fire War Room"*) based on activity cluster analysis.
- **Interactive Statistical Flaggers (`src/engine/flaggers.ts`):**
  - Enriches items with real-time indicators: `Awaiting Reply (Xd)`, `Blocking Dependency`, and `Active Discussion`.

### 2.4. Subsurface Intelligence Layer
- Rather than presenting chatty, unstructured LLM outputs or raw markdown thought streams to the user, ProtocolX encapsulates intelligence in a **subsurface model runtime** (`src/engine/modelRuntime.ts`).
- Operates quietly in the background without UI latency spikes, feeding structured classifications and contextual tags into the deterministic pipeline while keeping the executive presentation crisp, quiet, and noise-free.

### 2.5. Real-Time Stream Orchestration & Live Daemon
- **Dual-Mode Live Simulation:**
  1. **Built-in Turn Generator:** Emulates dynamic incoming message turns client-side for immediate interactive demonstration and stress-testing.
  2. **Loopback SSE Daemon (`server/ingestServer.mjs`):** A lightweight Node.js event-stream server operating on `http://127.0.0.1:4040/stream` allowing external log forwarding directly into the live client state.

### 2.6. Executive Linear Design System
- **Design Paradigm:** Inspired by Linear and Raycast ergonomics. Zero decorative emojis, dark mode palette (`#09090b`, `#18181b`, `#27272a`), monospace numerical metrics (`font-mono`), subtle micro-animations, and high scannability.
- **Dedicated Chat Selection Page:** On launch, the application opens directly to a focused Chat Selection workspace featuring verified datasets and file dropzones, keeping the top navigation clean and uncluttered. A **"Select Chat"** button in the header allows returning to conversation selection anytime.
- **Activity Velocity Scrubber (`src/components/TimelineVelocityChart.tsx`):** A temporal histogram chart that dynamically groups message frequencies over time. Users can click any timeline bar to scrub the unread cursor and re-triage the backlog from that exact moment.
- **Command Palette & Keyboard Navigation:**
  - `Cmd+K` / `Ctrl+K`: Global command search across all items, views, and datasets.
  - `j` / `k`: Next and previous item selection.
  - `x`: Toggle item resolved/unresolved status.
  - `s`: Star/favorite high-priority items.
  - `1-Click Executive Briefing`: Copies a markdown standup debrief formatted for Slack, Linear, or Jira.

---

## 3. Real-World Datasets & Benchmark Results

ProtocolX includes three production datasets bundled in `public/data/` selectable on the Chat Selection Page:

| Dataset Identifier | Context & Participant Dynamics | Total Messages | Participants | File Size | Parse & Benchmark Latency |
|---|---|---|---|---|---|
| **Default Chat (`default_chat.txt`)** | 1:1 Engineering Partnership (Rudra & Udit Jain) | 7,097 messages | 2 members | 625 KB | ~111 ms ingest, ~48 ms extraction |
| **CSE 6 Cohort (`cse6_chat.txt`)** | High-Density Engineering Cohort | 20,964 messages | 87 members | 2.12 MB | ~180 ms ingest |
| **Maths CSE 6 (`maths_chat.txt`)** | Academic Cohort & Task Coordination | 1,242 messages | 35 members | 187 KB | ~28 ms ingest |

### Key Benchmark Discoveries (7,097-message 1:1 Export):
- **Detected Archetype:** *"Night Owl Hacker Duo"* — 60%+ message volume clustered after 22:00, peaking at 23:00.
- **Response Velocity:** Median reply latency for Udit: 15s; Rudra: 23s.
- **Ghosted Thread Detection:** Identified 44 unreturned inquiries (24 owed by Udit, 20 owed by Rudra).
- **Grounding Verifier Performance:** 100% of extracted items verified with non-empty verbatim source substrings (`allGrounded: true`).

---

## 4. Multi-Tiered Deployment Protection Architecture

All production deployments are protected by local and CI/CD security gatekeepers (`scripts/deploy-guard.mjs`, `.github/workflows/deploy-protection.yml`):

1. **Gate 1: Zero-Hardcoding & No-Mock Policy (`npm run audit:hardcode`)**
   - Statically verifies that no prohibited literals (canned summaries, dummy participant arrays, artificial urgency keywords, synthetic mock timestamps, or emojis) exist in production code.
2. **Gate 2: Strict TypeScript Safety (`npx tsc --noEmit`)**
   - Zero implicit `any`, complete interface conformance across all schema types.
3. **Gate 3: Automated Vitest Grounding Suite (`npm test`)**
   - 32 comprehensive tests spanning regex normalization, timezone heuristics, grounding validation, ghost detector algorithms, and Wrapped telemetry.
4. **Gate 4: Zero-Egress Privacy & CSP Check**
   - Validates that `index.html` enforces zero-external-egress CSP and that the runtime `EgressGuard` is active.
5. **Gate 5: Production Bundle Verification (`npm run build`)**
   - Verifies relative asset path resolution (`base: './'`), minification, and packaging for GitHub Pages deployment.

---

## 5. Quick Start & Verification

```bash
# Clone the repository
git clone https://github.com/uditsinghi253-png/protocols-chatsanalysis.git
cd protocols-chatsanalysis

# Install dependencies
npm install

# Run all deployment protection gates
npm run deploy:check

# Start local development server
npm run dev
# -> Opens http://127.0.0.1:5173/

# (Optional) Launch real-time streaming ingestion daemon
node server/ingestServer.mjs
# -> Listening on http://127.0.0.1:4040/
```
