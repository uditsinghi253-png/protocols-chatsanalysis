# 90-Second Demo Script & Judging Q&A Alignment (Executive Linear Edition)

---

## 🎬 90-Second Pitch & Live Demo Script

### **[0:00 – 0:15] The Hook & The Problem**
> *"Every knowledge worker returning from focus time or meetings faces the unread backlog problem: 200+ messages across multiple channels, 10 minutes before the next standup. What did you miss? Who is blocked on you? What deadline is approaching?*
> *Reading the wall of text takes 25 minutes. Skimming leads to dropped commitments. Cloud AI tools would demand sending your most private chats to an external server."*

### **[0:15 – 0:35] Instant Local Ingest & Real-Time Engine**
> *(Action: Drop an unseen WhatsApp export file into the drop zone)*
> *"Watch this. I drag and drop an unread chat export. Within sub-second speed—running 100% locally on this Mac with our Real-Time Intelligence Engine—it isolates the unread backlog and renders this executive triage board.*
> *At the top: 'Unread Triage Debrief'—4 participants, 1 min triage vs 15 min chat reading time."*

### **[0:35 – 0:55] Activity Velocity Scrubber & Command Palette (`Cmd+K`)**
> *(Action: Point to the Timeline Histogram and click a bar)*
> *"Look at this Activity Velocity Histogram: it displays the temporal frequency of messages over time. Notice the unread cursor boundary. Because it's completely real-time and interactive, I can click any bar on the timeline to scrub my unread cursor and re-triage from that exact minute!*
> *(Action: Hit `Cmd+K` on keyboard)*
> *"Power users never have to leave the keyboard: hit `Cmd+K` to search across items, jump to citations, or trigger actions with full arrow-key navigation."*

### **[0:55 – 1:15] Grounding, Supersession & Perspective Views**
> *(Action: Toggle view from Kanban to Compact List, point to Sarah's question and Dave's superseded decision)*
> *"Switch between Kanban and Compact List view. Every item is verified against source messages with zero hallucination. Click any evidence quote to inspect the source context.*
> *Notice Dave's decision: he initially agreed to launch Friday, but later said 'actually let's go with Monday instead'. Our engine detected the supersession in real time: Friday is retired, and Monday is active."*

### **[1:15 – 1:30] 1-Click Executive Briefing & The Privacy Proof**
> *(Action: Click 'Briefing' button to show Markdown debrief, then click 'Privacy')*
> *"With one click on 'Briefing', I have a copy-paste ready standup debrief for Slack or Jira.*
> *Finally, the Privacy Proof: Content Security Policy locked to loopback, zero external egress. When I simulate an external call, the runtime Egress Guard intercepts and aborts it instantly.*
> *Solid, defendable, and built for real work. Thank you!"*

---

## 🏆 Judge Alignment & Q&A Defense

| Likely Judge Question | Concrete App Defense / Feature Pointer |
|---|---|
| **"Why is this better than asking ChatGPT or a cloud bot?"** | *"Two reasons: Privacy and Grounding. Your chats never leave your machine (`src/security/egressGuard.ts`), and every single extracted action cites a verbatim source quote verified by code (`src/engine/groundingVerifier.ts`). ChatGPT hallucinates; we don't."* |
| **"How does the Timeline Scrubber work?"** | *"The Activity Velocity matrix (`src/components/TimelineVelocityChart.tsx`) buckets message frequency and recalculates the unread cursor dynamically when clicked, re-triaging the conversation from that timestamp."* |
| **"What makes this feel like a production tool rather than a toy?"** | *"Linear-grade design philosophy: zero emojis, monospace metrics, `Cmd+K` command palette, keyboard navigation (`j`/`k`/`x`/`s`), dual Kanban/List perspectives, and 1-click Executive Standup Briefing export."* |
| **"What happens if the local LLM is offline?"** | *"Graceful degradation. Our Layer 1 Deterministic Signal Layer runs in 0ms with zero model requirement, extracting deadlines, questions, mentions, and decisions using calendar math and structural signals. The LLM is an enrichment layer, not a single point of failure."* |
| **"How is priority determined?"** | *"Explainable scoring (`src/engine/scoring.ts`): urgency is a weighted sum of deadline proximity, overdue saturation, direct addressing, and unanswered asks, normalized into quantile levels with human-readable 'Why' explanations."* |
| **"What happens if someone reverses a decision?"** | *"Supersession resolution (`src/engine/supersession.ts`): detects negation and revision phrases ('actually', 'scratch that', 'instead') and automatically links and retires superseded items."* |
