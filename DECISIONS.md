# Architecture & Engineering Decisions Log (DECISIONS.md)

This log records every significant architectural, stack, design, and algorithmic decision made for "What Did I Miss?", including alternatives considered, justification, and timestamp.

---

## 0001 - Environment Inspection and Baseline Runtimes
- **Date:** 2026-10-09
- **Decision:** Target macOS Apple Silicon (M1, 8GB RAM, 8-core CPU) running Node v25.9.0 and Python 3.13.7. No cloud dependencies; loopback/in-browser execution only.
- **Alternatives Considered:** Cloud-hosted LLM endpoints (rejected: violates hard constraint C5 Local-First).
- **Reason:** Detected local environment on user machine UDITs-MacBook-Air. 8GB RAM requires careful model memory footprints (e.g., small quantized models like Qwen 2.5 1.5B/3B, Llama 3.2 1B/3B, or in-browser WebLLM WebGPU / ONNX / transformers.js runtime, paired with an instant sub-second deterministic rule engine).

---

## 0002 - Proposed Technology Stack Architecture
- **Date:** 2026-10-09
- **Decision:** 
  1. **Frontend / Core App:** React + Vite + TypeScript web application, served locally via Vite dev server / static bundle.
  2. **Styling & Aesthetics:** Premium custom Vanilla CSS / CSS Modules with responsive dark mode, high visual polish, fluid micro-interactions, no external CDN dependencies (fonts bundled locally).
  3. **Local-First & Egress Guard:** Strict CSP (`default-src 'self' 'unsafe-inline' blob: data:; connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*;`), plus custom `fetch` wrapper and Network Observer auditing egress in real time.
  4. **Multi-tier Runtime Engine:**
     - **Layer 1 (L1 Instant Deterministic Engine):** Pure TypeScript regex/parsing algorithms for temporal dates (relative expressions resolved to system/message tz), mention matching, unanswered asks, structural markers. Works instantly in 0ms with zero model requirement.
     - **Layer 2 (L2 Local Inference Engine):** Dynamic runtime probe prioritizing: (A) Ollama/LM Studio loopback API if detected on localhost, (B) In-browser WebGPU / Transformers.js / ONNX if supported, (C) Graceful fallback to pure deterministic L1 with explicit UI banner.
     - **Layer 3 (L3 Grounding Verifier):** Verifies quotes ⊂ message source text; flags unverified or date-unclear items.
     - **Layer 4 (L4 Explainable Urgency Scorer):** Normalized signal weights, quantile scoring, live clock-tick countdowns.
  5. **Persistence:** IndexedDB with WebCrypto AES-GCM encryption at rest + instant 1-click wipe.
- **Alternatives Considered:** 
  - Electron / Tauri desktop app (heavy setup, slower iteration for hackathon).
  - Pure Python CLI/Streamlit (limited UI polish and real-time interactive responsiveness).
- **Reason:** Browser-based SPA with loopback server provides the fastest launch, easiest demoing, zero friction drop-and-triage, and complete sandboxing.

---

## 0003 - Gate 0 Confirmation & Core Focus Areas
- **Date:** 2026-10-09
- **Decision:**
  - **Stack:** Vite + React + TypeScript with zero external CDN dependencies (bundled fonts/icons/styles), local-first IndexedDB with WebCrypto encryption.
  - **Primary Chat Ingest Focus:** WhatsApp chat export (.txt) sniffer & parser as primary focus, while retaining pluggable adapter structure for Slack/Discord/JSON and unknown format fallback mapper.
  - **Identity:** Initial detected aliases: "Udit", "Udit Singhi", "@udit", confirmed via interactive onboarding profile editor.
  - **Inference Runtime:** Multi-tier runtime probe: auto-detect local loopback (Ollama/LM Studio on 127.0.0.1) -> in-browser client fallback -> deterministic L1 rule layer that operates offline with 0 latency.
  - **Delivery Scope:** Full vertical progression: Complete Tier 1 (MUST) with automated test validation and hardcode audit, then immediately proceed to Tier 2 (SHOULD) and demo assets.
- **Alternatives Considered:** Cloud AI APIs (strictly banned), rigid model assumptions (banned).
- **Reason:** User confirmed intake preferences; aligns directly with hackathon constraints and System Design blueprint.

---

## 0004 - Strict Prohibition of Synthetic/Mock Data & Hardcoded Keywords
- **Date:** 2026-10-09
- **Decision:**
  - Zero synthetic or canned demo chats embedded in production code. The app launches with a pristine, honest empty state prompting for real user export (drag-and-drop or paste).
  - Absolutely zero hardcoded urgency keyword lists (`["urgent", "asap", "deadline", ...]` are strictly banned in logic).
  - Every UI feature must display a visible "Why" pill or tooltip and be justified directly by the core triage mission.
- **Alternatives Considered:** Bundling sample conversations for quick preview (rejected per user directive: "no synthetic data").
- **Reason:** Real-world chats are the true test; synthetic mocks disguise failure modes and break on unseen data.

---

## 0005 - Implementation of Tiers 1 & 2, Edge Cases E1-E12, and Privacy Proof
- **Date:** 2026-10-09
- **Decision:**
  - Implemented multi-tier pipeline: Ingest Sniffer -> Unread Cursor -> L1 Deterministic Signals -> L2 Local Model Loopback Probe -> L3 Grounding Verifier -> Supersession Resolver -> L4 Urgency Scorer -> Summarizer.
  - Resolved all 12 Edge Cases: E1 relative dates, E2 supersession, E3 code-mixed/emoji, E4 context chunking, E5 hallucination downgrade, E6 shouting penalty, E7 indirect 1:1 addressing, E8 deleted/forwarded markers, E9 empty state, E10 live burst debounce, E11 sender ID disambiguation, E12 date order sniffing.
  - Implemented Live Mode with loopback SSE server on `127.0.0.1:4040` watching `watch/` directory and streaming live updates.
  - Built interactive UI with "While you were away" summary, 4 distinct triage lanes, Why Drawer with weight sliders, Source verification modal, and Privacy Proof panel.
- **Alternatives Considered:** Monolithic LLM prompt with zero deterministic fallback (rejected: fragile and slow on 8GB M1).
- **Reason:** Guarantees instant sub-second triage, zero cloud leaks, and provable grounding for demo day.

---

## 0006 - Professional Linear-Grade Redesign, Visual Analytics, and Zero-Emoji Policy
- **Date:** 2026-10-09
- **Decision:**
  - **Aesthetics & Tone:** Completely eliminate emojis and playful icons in favor of a clean, high-density, Linear/Raycast/Vercel-inspired UI. Monochromatic dark slate palette with precision SVG micro-icons (`lucide-react`).
  - **Active Local Inference Engine:** Introduce an integrated client-side inference worker and real-time loopback auto-sync. Rebrand engine state to clearly convey active real-time local processing ("Local Real-Time Engine: Active").
  - **Visual Statistics & Velocity Matrix:** Add interactive temporal message velocity histogram (allowing users to scrub the timeline to set the unread cursor visually), participant obligation table, and urgency quantile distribution chart.
  - **Keyboard Navigation & Command Palette:** Add `Cmd+K` command menu, keyboard shortcuts (`j`/`k` item navigation, `x` complete, `s` source jump), and multi-view switcher (Kanban Lanes vs. Compact List vs. Executive Briefing).
  - **Executive Briefing Generator:** Add 1-click exportable markdown briefing summarizing owners, deadlines, and citations for team standups.
- **Alternatives Considered:** Toy/conversational UI with avatars and emojis (rejected per user directive: "no emojis or gibberish, solid defendable production ready MVP").
- **Reason:** Positions the micro-app as an executive-grade productivity tool that immediately commands respect from judges.




