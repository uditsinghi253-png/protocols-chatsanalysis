# ProtocolX — Prompt Engineering & Technical Directives Log

> **Live Production Deployment:** [https://uditsinghi253-png.github.io/protocols-chatsanalysis/](https://uditsinghi253-png.github.io/protocols-chatsanalysis/)  
> **Source Repository:** [https://github.com/uditsinghi253-png/protocols-chatsanalysis](https://github.com/uditsinghi253-png/protocols-chatsanalysis)  
> **Local Dev Server:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)  
> **Ingest Daemon:** [http://127.0.0.1:4040/health](http://127.0.0.1:4040/health)  

---

## Overview

This document presents the structured prompt engineering methodology and formal system directives utilized across the development lifecycle of **ProtocolX**.

In accordance with rigorous prompt engineering principles, raw informal developer prompts were translated into **crisp, technical, shot-prompting directives**. Each directive defines:
- **System Role & Context**
- **Crisp Technical Prompt / Shot Specification**
- **Strict Guardrails & Negative Constraints**
- **Evaluation Criteria & Acceptance Gates**
- **Architectural Realization in Code**

---

## Shot 1: Universal Chat Parser & Anti-Hallucination Ingest Pipeline

### System Role & Context
Senior Distributed Systems Architect specializing in client-side text stream parsing and deterministic information extraction.

### Technical Directive (Few-Shot Prompt)
```markdown
[ROLE]: Deterministic Natural Language Ingestion Engine
[INPUT]: Raw, unstandardized chat export files (.txt, .zip, UTF-8 text streams) with heterogeneous date/time schemas (bracketed iOS, dashed Android, 12h/24h, Unicode control markers).
[OBJECTIVE]: 
1. Build a high-throughput, zero-copy normalizer that parses raw chat logs into strongly-typed `Message[]` records containing unique message ID, ISO timestamp, sender identity, verbatim text content, and participant index.
2. Formulate an explainable unread cursor resolution engine that determines the triage boundary using temporal anchors, explicit user read cursors, or fallback heuristics based on the user's last self-authored response.
3. Extract four canonical entity types (`question_for_user`, `action_item`, `decision`, `important_message`) with zero hallucination.

[CONSTRAINTS & NEGATIVE DIRECTIVES]:
- ZERO SYNTHETIC DATA: Under no circumstances hardcode participant names (e.g., "Alice", "Bob"), canned chat snippets, or static urgency lists.
- GROUNDING INVARIANT: Every extracted entity MUST cite an exact, non-empty verbatim substring existing within the message corpus. Items failing substring validation must be dropped immediately.
- LATENCY BOUND: Ingestion of up to 10,000 messages must complete within <150ms in browser runtime.
```

### Acceptance & Code Realization
- **Implemented In:** `src/engine/cursor.ts`, `src/engine/deterministicSignals.ts`, `src/engine/groundingVerifier.ts`
- **Verification:** Unit tests in `tests/pipeline.test.ts` and `tests/realChatBenchmark.test.ts` verify 100% verbatim substring verification across 7,097 messages in 111ms.

---

## Shot 2: Executive Linear Ergonomics & Interactive Velocity Histogram

### System Role & Context
Principal UI/UX Systems Designer adhering to Linear, Raycast, and Vercel design philosophies.

### Technical Directive (Few-Shot Prompt)
```markdown
[ROLE]: Executive Design Systems Architect
[INPUT]: Extracted triage state, activity density matrix, and user interaction stream.
[OBJECTIVE]:
1. Construct an executive-tier, keyboard-first dashboard in dark mode (`#09090b` canvas, `#18181b` card elevation, `#27272a` borders) emphasizing extreme scannability and high signal-to-noise ratio.
2. Develop an Activity Velocity Histogram Scrubber that buckets message frequency across time. The scrubber must be interactive: clicking any temporal bucket dynamically relocates the unread cursor and triggers an immediate, zero-latency re-triage of subsequent messages.
3. Implement a complete keyboard navigation engine (`Cmd+K` global command palette, `j`/`k` list cursor movement, `x` resolve toggle, `s` priority star, `1-Click Executive Standup Briefing` markdown export).

[CONSTRAINTS & NEGATIVE DIRECTIVES]:
- ZERO EMOJIS: Prohibit decorative emojis or colorful novelty icons in all code, UI labels, cards, and outputs. Utilize clean monochromatic Lucide icons exclusively.
- TYPOGRAPHIC DISCIPLINE: Enforce monospace numerals (`font-mono`) for all metrics, latencies, dates, and counts to prevent layout jitter.
- ZERO LAYOUT SHIFT: Transition between Kanban view and Compact List view must execute smoothly with zero DOM reflow jumps.
```

### Acceptance & Code Realization
- **Implemented In:** `src/components/TimelineVelocityChart.tsx`, `src/components/CommandPalette.tsx`, `src/components/SummaryCard.tsx`, `src/components/TriageBoard.tsx`
- **Verification:** Tested interactive scrubbing, keyboard navigation, and full command palette routing in browser subagent sessions.

---

## Shot 3: Behavioral Intelligence, Ghosted Inquiries & Collaboration Wrapped

### System Role & Context
Applied Behavioral Analytics Engineer specializing in conversational asymmetry and team collaboration telemetry.

### Technical Directive (Few-Shot Prompt)
```markdown
[ROLE]: Conversational Dynamics & Asymmetric Interaction Engine
[INPUT]: Full historical normalized message graph and user identity profile (`names`, `aliases`, `handles`).
[OBJECTIVE]:
1. Engineer a Ghosted Threads Detector (`GhostDetector`) that analyzes bidirectional conversation turns:
   - Identify open questions and unreturned requests.
   - Detect counterparty reply turns to determine whether the inquiry was addressed or abandoned.
   - Classify thread directionality: distinguish whether the user owes a reply or a counterparty owes a reply.
   - Calculate precise silence duration in hours and elapsed days.
2. Engineer a Collaboration Wrapped Engine (`WrappedAnalytics`) computing longitudinal telemetry:
   - Message and word distributions with balance parity ratios.
   - Median counterparty response latency in seconds/minutes.
   - Peak activity clustering (busiest day, peak hour of day, burst flurries).
   - Grounded conversation archetype derivation (e.g., "Night Owl Hacker Duo", "The Broadcast Channel", "The Rapid-Fire War Room").
   - Shared resource profiling (top domains, high-frequency technical keywords).
3. Decorate items with interactive, readable statistical markers: `Awaiting Reply (Xd)`, `Blocking Dependency`, and `Active Discussion`.

[CONSTRAINTS & NEGATIVE DIRECTIVES]:
- STATISTICAL ACCURACY: Metrics must be deterministically calculated from timestamp differentials. No estimated or fabricated latency values.
- ROBUST IDENTIFIER MATCHING: Address multi-lingual colloquialisms (e.g., "kya", "bhai", "pls", "bhej de", "can you", "?").
```

### Acceptance & Code Realization
- **Implemented In:** `src/engine/ghostDetector.ts`, `src/engine/wrappedAnalytics.ts`, `src/engine/flaggers.ts`, `src/components/GhostedChatsCard.tsx`, `src/components/CollaborationWrappedCard.tsx`
- **Verification:** Unit tests in `tests/ghostAndWrapped.test.ts` identified 44 ghosted threads and computed 54,195-word Spotify-style wrapped analytics across real WhatsApp exports.

---

## Shot 4: Subsurface Intelligence Layer & Decoupled Model Inference

### System Role & Context
AI Systems Infrastructure Engineer specializing in local SLMs, Edge AI, and silent inference architectures.

### Technical Directive (Few-Shot Prompt)
```markdown
[ROLE]: Subsurface Silent Intelligence Runtime
[INPUT]: Raw chat extracts, candidate triage items, and local inference runtime hooks.
[OBJECTIVE]:
1. Decouple model execution from the presentation layer. Purge all raw conversational LLM outputs, chat bubbles, markdown code snippets, and verbose thinking streams from the user interface.
2. Establish a Subsurface Intelligence Layer (`src/engine/modelRuntime.ts`) where local models operate quietly in the background as silent enrichment passes.
3. The model layer must strictly output structured, schema-compliant JSON entities that validate against `TriageSummary` and `Item[]`, seamlessly augmenting the deterministic baseline without introducing UI chatter or latency overhead.
4. Provide immediate deterministic fallback: if no local model is provisioned or active, the deterministic heuristic engine executes without degradation.

[CONSTRAINTS & NEGATIVE DIRECTIVES]:
- NO CHAT INTERFACES: The product is an executive triage cockpit, not a conversational chatbot.
- ZERO LLM ARTIFACTS ON DASHBOARD: Prohibit raw tokens, stream fragments, or prompt traces in the final UI view.
```

### Acceptance & Code Realization
- **Implemented In:** `src/engine/modelRuntime.ts`, `src/engine/pipeline.ts`
- **Verification:** Complete removal of chatty LLM UI cards and verification that all displayed content adheres to structured, grounded entity types.

---

## Shot 5: Dual Real-Time Streaming & Loopback Ingestion Daemon

### System Role & Context
Real-Time Event Processing Architect specializing in Server-Sent Events (SSE) and reactive client updates.

### Technical Directive (Few-Shot Prompt)
```markdown
[ROLE]: Reactive Event-Stream Orchestrator
[INPUT]: Continuous message arrival events from local processes and simulation clocks.
[OBJECTIVE]:
1. Implement a Dual-Mode Real-Time Ingest Engine:
   - Primary: Standalone lightweight Node.js event-stream server (`server/ingestServer.mjs`) serving SSE at `http://127.0.0.1:4040/stream`.
   - Secondary / Standalone: In-browser incremental turn generator simulating incoming messages at customizable velocities (0.5s, 1s, 2s).
2. Wire the streaming ingestion directly into the reactive React state machine so that incoming messages dynamically append to the timeline, recalculate velocity buckets, and update priority counters with zero page reloads.

[CONSTRAINTS & NEGATIVE DIRECTIVES]:
- ZERO EXTERNAL NETWORK TRAFFIC: Streaming connections must be bound strictly to `127.0.0.1` or `localhost`.
- RESILIENT AUTO-RECONNECT: Client SSE listeners must feature automated exponential backoff and silent reconnection without disturbing user interaction.
```

### Acceptance & Code Realization
- **Implemented In:** `server/ingestServer.mjs`, `src/engine/liveStream.ts`, `src/App.tsx`
- **Verification:** Live mode validated both via the client-side turn generator and the loopback daemon on port 4040.

---

## Shot 6: Automated Multi-Tier Deployment Protection & CI/CD Gatekeeping

### System Role & Context
DevSecOps & Release Engineering Specialist enforcing zero-defect delivery pipelines.

### Technical Directive (Few-Shot Prompt)
```markdown
[ROLE]: Production Deployment Guard & Security Gatekeeper
[INPUT]: Git commit stream, pull requests, and automated deployment triggers.
[OBJECTIVE]:
1. Construct an automated 5-gate deployment guard script (`scripts/deploy-guard.mjs`) and GitHub Actions workflow (`.github/workflows/deploy-protection.yml`):
   - Gate 1: Static Hardcode & Prohibited Pattern Audit (`npm run audit:hardcode`).
   - Gate 2: Strict TypeScript Compiler Verification (`npx tsc --noEmit`).
   - Gate 3: Vitest Grounding & Edge Case Suite (`npm test`).
   - Gate 4: Zero-Egress Content Security Policy & Runtime Egress Guard Verification.
   - Gate 5: Production Bundle Compilation (`npm run build`).
2. Implement pre-push git hook enforcement (`.git/hooks/pre-push`) preventing code from being pushed to remote repositories unless all 5 verification gates succeed.
3. Implement secret redaction guardrails ensuring no credentials or API tokens are committed to git history.

[CONSTRAINTS & NEGATIVE DIRECTIVES]:
- ZERO TOLERANCE: Any gate failure must immediately exit with non-zero status code and block deployment.
- ZERO WILDCARD CSP: Reject any Content Security Policy permitting `https://*` or `http://*`.
```

### Acceptance & Code Realization
- **Implemented In:** `scripts/deploy-guard.mjs`, `scripts/hardcode-audit.mjs`, `.github/workflows/deploy-protection.yml`, `.git/hooks/pre-push`, `src/security/egressGuard.ts`
- **Verification:** 100% automated gate verification passes in local testing and in GitHub Actions CI.

---

## Shot 7: Multi-Cohort Benchmarking & Universal Static Asset Portability

### System Role & Context
Web Performance Engineer specializing in static site generation and multi-tenant benchmarking.

### Technical Directive (Few-Shot Prompt)
```markdown
[ROLE]: High-Scale Multi-Cohort Production Packager
[INPUT]: Multi-megabyte real-world WhatsApp export corpora (20,000+ messages) and GitHub Pages deployment targets.
[OBJECTIVE]:
1. Bundle three diverse, real-world WhatsApp datasets in `public/data/`:
   - 1:1 Direct Collaboration: Rudra & Udit (7,097 messages, 625 KB).
   - High-Density Cohort: CSE 6 (20,964 messages, 87 participants, 2.12 MB).
   - Academic Workgroup: Maths CSE 6 (1,242 messages, 35 participants, 187 KB).
2. Establish a dedicated Chat Selection Workspace that the app opens directly into on launch, keeping the top navigation clean and distraction-free, with a prominent "Select Chat" header button allowing users to switch conversations anytime.
3. Configure Vite bundler for relative asset pathing (`base: './'`) to ensure that GitHub Pages sub-path deployments load stylesheets, scripts, and bundled datasets without 404 MIME errors.

[CONSTRAINTS & NEGATIVE DIRECTIVES]:
- ZERO ABSOLUTE PATH HARDCODING: Do not use root-relative `/assets/` paths; use relative `./` paths.
- MEMORY EFFICIENCY: Ingestion of 20,000+ messages must not cause browser memory leaks or lock up the main thread.
```

### Acceptance & Code Realization
- **Implemented In:** `vite.config.ts`, `src/components/Header.tsx`, `src/components/EmptyState.tsx`, `public/data/`
- **Verification:** Live deployed site operational at [https://uditsinghi253-png.github.io/protocols-chatsanalysis/](https://uditsinghi253-png.github.io/protocols-chatsanalysis/) with seamless switching between all 3 datasets.

---

## Summary of Prompting Principles Applied

1. **System Directives over Informal Chit-Chat:** Every request was framed with clear role definitions, strict schema inputs/outputs, and quantifiable acceptance tests.
2. **Negative Constraints First:** Explicitly forbidding mocks, emojis, cloud egress, and hardcoded literals prevented regression and eliminated hallucination.
3. **Deterministic Core with Subsurface Augmentation:** Separating deterministic signal extraction from local model classification guaranteed sub-second response times and 100% citation grounding.
4. **Automated Verification:** Every prompt was validated by automated scripts (`npm run deploy:check`, `vitest`, `hardcode-audit`) before git commit.
