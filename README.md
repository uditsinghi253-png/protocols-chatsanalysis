# What Did I Miss? — Local-First Executive Chat Triage

> A production-grade, privacy-first AI micro-app designed to solve the unread conversation overload problem.
> **100% on-device. Zero telemetry. Zero third-party network egress.**
> Built with a Linear/Raycast design philosophy: zero emojis, monospace metrics, keyboard-first navigation.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suites (26 / 26 tests)
npm test

# 3. Run zero-hardcoding & zero-emoji static audit
npm run audit:hardcode

# 4. Launch the application locally (Vite dev server)
npm run dev

# 5. (Optional) Launch loopback live-stream watcher daemon
node server/ingestServer.mjs
```

Open your browser to: **`http://127.0.0.1:5173/`**

---

## 🚀 Standout Features

### 1. Activity Velocity Histogram & Timeline Scrubber
- Visualizes conversation volume frequency across time intervals.
- **Interactive Scrubbing**: Click any bar on the timeline to scrub your unread cursor and immediately re-triage the conversation from that timestamp!

### 2. Command Palette (`Cmd+K` / `Ctrl+K`)
- Full keyboard control inspired by Linear and Raycast.
- Fuzzy search across unread items, participants, and citations.
- Quick commands: Copy Executive Briefing, open Privacy Proof audit, tune scoring weights, or wipe data.

### 3. Keyboard-Driven Triage
- <kbd>J</kbd> / <kbd>K</kbd> to navigate through triage items.
- <kbd>X</kbd> to toggle item completion status.
- <kbd>S</kbd> to jump directly to the verbatim source citation.
- <kbd>ESC</kbd> to dismiss modals.

### 4. Dual Perspectives (Kanban & Compact List)
- **Kanban Board**: 4 distinct columns (`Needs Action Now`, `Deadlines`, `Decisions Reached`, `Mentions of You`).
- **Compact List**: Single-table high-density view for rapid power-user triage.

### 5. 1-Click Executive Standup Briefing
- Generates a structured, copy-paste ready Markdown briefing summarizing key decisions, owners, deadlines, and pending questions for Slack, Jira, or email.

### 6. Real-Time Engine & Live Watcher
- Real-time clock ticks update approaching countdowns every 5 seconds; crossing a deadline flips it to **OVERDUE** live without refreshing.
- Loopback Server-Sent Events (SSE) daemon on `127.0.0.1:4040` automatically streams new incoming messages into the dashboard in real time.

### 7. Grounding Verifier & Supersession Engine
- Every item cites verbatim evidence quotes verified by deterministic code (`src/engine/groundingVerifier.ts`).
- When a teammate reverses a decision (*"Actually let's make it Monday instead"*), the previous decision is automatically marked **SUPERSEDED** and linked to the new commitment.

### 8. Strict Privacy Proof & Egress Guard
- Content Security Policy (CSP) locked to loopback (`127.0.0.1`).
- Runtime `fetch` and `XHR` monkey-patches block and log any non-loopback attempt.
- Built-in Privacy Proof panel with a live **"Simulate External Call"** button demonstrating runtime interception.
- 1-Click total data purge.

---

## 🛠️ Testing & Audits

Run the full automated test suite:
```bash
npm test
```

Run the strict static hardcode and emoji audit scanner:
```bash
npm run audit:hardcode
```

---

## ⚠️ Known Limits

1. **Audio / Voice Notes**: WhatsApp voice note audio files require local speech-to-text (e.g. Whisper.cpp), which is not bundled into this web bundle.
2. **Ambiguous Mentions Across Group Nicknames**: If an unseen nickname is used that is not in the user's Identity Profile, it falls back to 1:1 conversation addressing rules or general action items.
