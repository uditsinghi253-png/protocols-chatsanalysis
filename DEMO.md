# 90-Second Demo Script & Judging Q&A Alignment

---

## 🎬 90-Second Pitch & Live Demo Script

### **[0:00 – 0:15] The Hook & The Problem**
> *"Imagine you stepped away from Slack or WhatsApp for three hours to focus. You come back to 240 unread messages across 5 threads. You have 10 minutes before your next meeting. What did you miss? Who is waiting on you? What deadline is approaching?*
> *Reading the wall of text takes 25 minutes. Skimming risks dropping a critical commitment. Cloud AI tools would demand sending your most private chats to a third-party server."*

### **[0:15 – 0:35] Instant Local Ingest & Zero-Cloud Triage**
> *(Action: Drop an unseen WhatsApp export file into the drop zone)*
> *"Watch this. I drag and drop an unread chat export. Within sub-second speed—entirely on this Mac—our engine parses the conversation, isolates what happened after my unread cursor, and generates this glanceable triage board.*
> *At the top: 'While you were away'—4 participants, 1 min triage vs 15 min chat reading time."*

### **[0:35 – 0:55] Grounding & The Why Drawer**
> *(Action: Point to Sarah's question in 'Needs Action Now', then click the evidence quote)*
> *"Under 'Needs Action Now', here is a question addressed directly to me by Sarah that has received zero replies. Notice this evidence chip. We don't hallucinate: click it, and it immediately jumps to the exact source message in context.*
> *(Action: Open Why Drawer)*
> *Why did this rank critical? Open the Why Drawer. You see every mathematical signal: direct address, unanswered ask, deadline proximity. Move any slider, and scores recalculate live in front of you."*

### **[0:55 – 1:15] Edge Cases: Supersession & Real-Time Countdowns**
> *(Action: Point to Decisions Lane and Deadlines Lane)*
> *"Real chats are messy. Earlier, Dave agreed to launch on Friday, but later said 'actually let's go with Monday instead'. Our engine detected the supersession: Friday is retired as superseded, and Monday is elevated as the active decision.*
> *And notice the deadlines: approaching deadlines have live countdown clocks ticking against the system clock. When a deadline passes, it saturates to 'Overdue' in real time with zero user input."*

### **[1:15 – 1:30] The Privacy Proof & Conclusion**
> *(Action: Click Privacy Proof button, click 'Simulate External Call')*
> *"The judging criteria requires local-first. We don't just claim it—we prove it. Our browser Content Security Policy is locked strictly to loopback. Click 'Privacy Proof': zero non-loopback egress. When I trigger a simulated external request, our runtime Egress Guard intercepts and aborts it instantly.*
> *Click 'Wipe All Data', and disk memory is wiped clean. This is 'What Did I Miss?'—triage your unread chaos in seconds, completely on your device. Thank you!"*

---

## 🏆 Judge Alignment & Q&A Defense

| Likely Judge Question | Concrete App Defense / Feature Pointer |
|---|---|
| **"Does this work on unseen chat formats or just specific samples?"** | *"Drop any unseen WhatsApp export (.txt), iOS bracketed style, Android style, or JSON export. Our Ingest Sniffer (`src/adapters/sniffer.ts`) analyzes line delimiters and date structure dynamically without hardcoded formats."* |
| **"How do you prevent the AI from hallucinating tasks or deadlines?"** | *"Every item must pass our deterministic L3 Grounding Verifier (`src/engine/groundingVerifier.ts`). It verifies that cited quotes are verbatim substrings in source messages. Any hallucinated quote is downgraded to 'unverified' and hidden."* |
| **"How do you ensure user privacy on device?"** | *"Open the Privacy Proof panel in the app. Content Security Policy is locked to loopback (`127.0.0.1`), our custom Egress Guard intercepts `fetch` and `XHR`, and automated test suites fail if any external call is attempted."* |
| **"What if the local LLM is slow, down, or not installed on the laptop?"** | *"Graceful degradation. Our Layer 1 Deterministic Signal Layer runs in 0ms with zero model requirement, extracting deadlines, questions, mentions, and decisions using calendar math and structural signals. The LLM is an enrichment layer, not a single point of failure."* |
| **"How is priority determined?"** | *"Explainable scoring (`src/engine/scoring.ts`): urgency is a weighted sum of deadline proximity, overdue saturation, direct addressing, and unanswered asks, normalized into quantile levels with human-readable 'Why' explanations."* |
| **"What happens if someone reverses a decision?"** | *"Supersession resolution (`src/engine/supersession.ts`): detects negation and revision phrases ('actually', 'scratch that', 'instead') and automatically links and retires superseded items."* |
