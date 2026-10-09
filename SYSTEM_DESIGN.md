# SYSTEM_DESIGN.md — "What Did I Miss?" (Local-First Unread Triage)

> Source of truth for the build. The agent must keep this file updated as decisions change (log each change in DECISIONS.md).
> Every feature below has a **Why**. If you cannot write a Why for something, do not build it.

---

## 1. Problem & hard constraints (from the challenge slide)

Build a simple AI micro-app that helps a user quickly understand and prioritize important information from overwhelming chat conversations.

| # | Requirement | Why it is a hard constraint |
|---|---|---|
| C1 | Summarize long and unread conversations | Core promise: "what did I miss?" in seconds |
| C2 | Identify important messages, decisions, action items | Judged as the primary value |
| C3 | Prioritize by urgency and relevance | Raw extraction without ranking is just another wall of text |
| C4 | Highlight mentions, deadlines, tasks the user may have missed | The "missed" part is the emotional hook |
| C5 | Local-first: conversations, data, summaries never leave the device | Chats are the most private data a person has; also a judging criterion |

**Hackathon rule (from the workshop slide): a smaller product that works beats a larger product that barely works.**
This drives the MoSCoW tiers below and the "Tier gates" in the agent prompt.

---

## 2. Scope — MoSCoW → feature flags

| Tier | Feature | Why |
|---|---|---|
| **MUST** | Ingest a chat → normalized messages | Nothing works without input |
| **MUST** | Unread cursor ("everything after X") | Defines what "missed" means |
| **MUST** | Summary of unread portion | C1 |
| **MUST** | Extract: important messages, decisions, action items, deadlines — each with evidence + reason | C2, C4, and "explain why" is the judging differentiator |
| **MUST** | Local-only processing + visible proof | C5 |
| **SHOULD** | Urgency levels (computed, explainable) | C3 |
| **SHOULD** | Direct-mention detection for the user (aliases, replies, implied addressing) | C4, relevance |
| **SHOULD** | Live mode: new messages update results in real time | Makes it feel like a product, not a script |
| **COULD** | Themes/topics | Nice-to-have; adds context for very long chats |
| **COULD** | Sentiment/tone | Helps detect conflict or false urgency |
| **COULD** | Personalization from feedback | Improves ranking over time; only after MUST+SHOULD are solid |

Every tier is behind a runtime feature flag, so a broken COULD can never take down a MUST.

---

## 3. Design principles (each one has a reason)

1. **Local-first, enforced not promised.** CSP + a runtime egress monitor. *Why:* a claim is cheap, proof wins judges.
2. **Zero hardcoding.** No literal sample chats, keyword lists, names, dates, model names, thresholds in logic. *Why:* hardcoded behavior breaks on the first unseen chat, which is exactly what a live demo throws at you.
3. **Grounded or it does not ship.** Every extracted item must quote evidence that verifiably exists in the source messages. *Why:* LLMs hallucinate; a fabricated deadline is worse than a missed one.
4. **Explainable by default.** Every item/score has a human-readable "why". *Why:* trust, plus the slides explicitly say "Explain why."
5. **Graceful degradation.** Deterministic layer works with no model; model enriches it. *Why:* demo hardware is unpredictable.
6. **Progressive results.** Instant deterministic pass, then streaming LLM pass. *Why:* perceived speed on local models.
7. **Small and finished > big and broken.** *Why:* the hackathon rule.

---

## 4. Architecture

```
                 ┌──────────────────────── Browser/Desktop shell (UI) ───────────────────────┐
                 │  Triage view · Why drawer · Source jump · Settings · Privacy Proof panel  │
                 └───────────────▲──────────────────────────────────────▲────────────────────┘
                                 │ reactive store (events)               │
 ┌────────────┐   ┌──────────────┴───────────┐   ┌───────────────────────┴───────────────┐
 │  INGEST    │──▶│  NORMALIZE & SEGMENT     │──▶│  ANALYSIS PIPELINE                    │
 │ adapters   │   │ schema, dedupe, cursor,  │   │ L1 deterministic signals (instant)    │
 │ paste/file │   │ windows sized to model   │   │ L2 LLM structured extraction (stream) │
 │ watch dir  │   └──────────────────────────┘   │ L3 grounding verifier                 │
 │ localhost  │                                  │ L4 scoring + explanation              │
 │ ingest API │                                  └───────────────┬───────────────────────┘
 └────────────┘                                                  │
        ▲                    ┌────────────────────────┐          ▼
        │                    │ MODEL RUNTIME (local)  │◀── capability probe at startup
   live events               │ discovered, not fixed  │
                             └────────────────────────┘
                                         │
                             ┌───────────▼────────────┐   ┌────────────────────────┐
                             │ LOCAL STORE (encrypted)│   │ EGRESS GUARD + AUDIT   │
                             │ messages, items, state │   │ CSP, request counter   │
                             └────────────────────────┘   └────────────────────────┘
```

---

## 5. Modules (each with Why and what must be dynamic)

### 5.1 Ingest adapters
- **What:** pluggable adapters behind one interface: paste text, drop file, watch a folder/file, local HTTP/WebSocket endpoint bound to loopback only.
- **Format detection by sniffing content**, not by file extension or user dropdown (e.g. line-pattern analysis for plain-text exports, key-shape analysis for JSON exports). Unknown format → ask the user to map fields once via a mapping UI, then remember the mapping.
- **Why:** users have chats in many apps; a single hardcoded parser makes the demo fragile. A mapping UI beats supporting 20 formats poorly.
- **Dynamic:** timestamp format and locale are inferred from the data (try-parse over candidates, pick the one that parses all rows consistently), never assumed.

### 5.2 Normalizer & segmenter
- **Message schema** (see §6), stable IDs via content hash + position so re-ingesting the same export doesn't duplicate.
- **Segmentation** into analysis windows by *token budget queried from the live model runtime*, with overlap, split at time gaps/topic shifts where possible.
- **Why:** a hardcoded chunk size silently truncates on small-context models and wastes capacity on large ones.

### 5.3 Unread cursor
- **What:** per-conversation `lastReadMessageId`. Sources in priority order: (1) read markers present in the data, (2) user-set cursor by clicking a message ("I read up to here"), (3) fallback: time since the user's last own message in that chat, with the fallback clearly labeled.
- **Why:** "unread" is the whole product; guessing silently would produce wrong summaries with false confidence.

### 5.4 Identity profile (who is "me")
- **What:** onboarding asks the user for their display name(s) in the chat; the system also *proposes* aliases by finding the sender label that most often replies in the user's style or that the user selects. User confirms.
- **Why:** mention detection is impossible without knowing who "me" is; asking is cheaper and more accurate than guessing. Aliases/nicknames/@handles all come from this profile, never from code.

### 5.4b Model runtime (local)
- **Probe at startup:** detect available local inference options (a local model server on loopback, in-browser GPU inference, CPU fallback), list installed models from the runtime itself, read each model's context length/capabilities from the runtime, and benchmark tokens/sec on a tiny prompt.
- **Selection:** pick the best model by measured speed × context vs. the work size; let the user override in settings. Re-probe on demand.
- **Structured output:** use the runtime's JSON-schema/grammar-constrained decoding when available; otherwise parse-validate-repair-retry with a bounded retry count.
- **Why:** no model name should ever be a literal in code; machines differ, and a demo laptop is never the dev laptop. *Agent must verify the current runtime APIs from official docs before coding, not from memory.*

### 5.5 Analysis pipeline

**L1 — Deterministic signals (instant, no model)**
- Temporal expression extraction (library-based, using the *user's* locale/timezone and the message's own timestamp as reference "now").
- Mentions of identity aliases; replies/quotes targeting the user; questions followed by no answer from the user.
- Links, attachments, @all / broadcast markers (detected structurally).
- **Why:** gives sub-second useful output, works with no model, and anchors the LLM with facts it can't hallucinate.

**L2 — LLM structured extraction (streamed)**
- Map step per window → typed items (schema in §6): `decision | action_item | deadline | important_message | question_for_user`.
- Reduce step: merge across windows, resolve duplicates, apply supersession ("actually let's make it Monday" retires the Friday deadline).
- Summary generation: hierarchical (window summaries → overall), length scaled to unread volume.
- Prompts are **generated from templates + live context** (user identity, chat participants, reference date, schema), never from fixed strings with baked-in examples about a specific chat.
- **Why:** LLM handles meaning, tone, implicit tasks that rules can't ("can someone take the venue booking?" with no date).

**L3 — Grounding verifier (deterministic)**
- Each item must carry `evidence: [{messageId, quote}]`. Verifier checks quote ⊂ message text (normalized whitespace/case). Fail → item downgraded to "unverified" and hidden by default, or re-asked once.
- Deadline items must have a parseable date that agrees with L1's extraction, or be flagged "date unclear".
- **Why:** hallucination guard. The single most important trust feature.

**L4 — Scoring & explanation** (see §7).

### 5.6 Real-time engine
- Event bus: `MessageAdded`, `CursorMoved`, `ItemUpdated`, `ClockTick`.
- Incremental: new messages only trigger analysis on the affected window + reduce step, not a full recompute.
- `ClockTick` re-scores time-sensitive items against *current* time so urgency changes live (a deadline 6 h away becomes "overdue" with no new message).
- Live source: file/folder watcher and loopback ingest endpoint feed the same pipeline as paste.
- **Why:** "real time" in this app means two things — new data arrives, and time itself passes. Handle both.

### 5.7 UI
- **Top:** "While you were away" — N unread, since when, time to read the summary.
- **Lanes:** Needs action now · Decisions made · Deadlines (live countdown) · Mentions of you · FYI (collapsed).
- **Each card:** title, status, urgency chip, **Why** line, evidence quotes, "Jump to message", "Done/Dismiss", feedback thumbs (feeds COULD personalization).
- **Why drawer:** shows signals and weights that produced the score.
- **Privacy Proof panel:** live count of outbound requests (target: 0 non-loopback), CSP status, "disconnect network and re-run" button.
- **Why:** triage UX = glanceable top, detail on demand; proof panel turns a claim into a demo moment.

### 5.8 Local store
- IndexedDB (or equivalent local DB) with WebCrypto encryption at rest; key derived from a user passphrase; "Wipe everything" button.
- **Why:** local ≠ safe by default; encrypting at rest and a one-click wipe make "never leaves the device" credible.

### 5.9 Egress guard
- CSP `connect-src` restricted to self + loopback; no third-party scripts/fonts/analytics at all; assets bundled.
- Runtime monitor (service worker / fetch wrapper / resource timing) logs any non-loopback attempt and **blocks** it.
- CI/test: automated test fails the build if any non-loopback request occurs.
- **Why:** challenge requirement C5 verified by machine, not by trust.

---

## 6. Data schemas (agent finalizes in code with validation, e.g. runtime schema validator)

```ts
Message {
  id: string            // stable hash(source, ts, sender, text, ordinal)
  conversationId: string
  ts: ISO8601           // normalized with detected tz
  sender: string        // raw label
  senderId: string      // resolved participant id
  text: string
  replyToId?: string
  edited?: boolean; deleted?: boolean
  attachments?: [...]
  raw?: unknown         // original row for debugging
}

Participant { id, labels[], isMe: boolean, firstSeen, stats{ replyLatencyMedian, msgCount } }

IdentityProfile { names[], aliases[], handles[], tz, locale, confirmedByUser: boolean }

Item {
  id, kind: 'decision'|'action_item'|'deadline'|'important_message'|'question_for_user'
  title, detail
  owner?: participantId       // who must act
  due?: { iso, confidence, rawPhrase }
  status: 'open'|'done'|'superseded'|'overdue'|'unverified'
  evidence: [{ messageId, quote }]     // REQUIRED, verified
  supersedes?: itemId[]
  signals: { name, value(0..1), source: 'rule'|'llm'|'history' }[]
  urgency: { score(0..1), level, explanation }
  relevanceToMe: { score(0..1), explanation }
  createdFrom: { windowId, modelId, promptHash }   // reproducibility
}

ConversationState { id, cursorMessageId, cursorSource, lastAnalyzedMessageId }

Config { ...everything tunable... validated, versioned, user-editable, no literals elsewhere }
```

**Why:** typed, validated schemas prevent the "vague code, missing schemas, UI errors" failure the workshop warns about.

---

## 7. Scoring (explainable, tunable, no magic numbers in logic)

`urgency = Σ wᵢ · sᵢ`, where each `sᵢ ∈ [0,1]` is a named signal:

| Signal | How computed (dynamic) | Why |
|---|---|---|
| Deadline proximity | based on `due − now`, normalized against a horizon derived from the chat's own observed lead-times (fallback: config) | Same "tomorrow" means different things in different groups |
| Overdue | `now > due` and not marked done → saturates | Missed is the highest-value alert |
| Direct address | alias match / reply-to-me / question-to-me | Relevance to this user |
| Unanswered ask | a question/request to me, no reply from me after it | Social cost of silence |
| Imperative/action language | from LLM classification, not keyword lists | Distinguishes tasks from chatter |
| Sender salience | learned locally from my historical reply latency per sender | People I answer fast matter more to me (personalization, COULD) |
| Reaction/emphasis | structural signals (reactions, pinned, repeated pings) | Others' behavior signals importance |
| False-urgency penalty | repeated ALL-CAPS/"urgent" with no concrete ask or date | Avoids alarm fatigue |

- **Weights** live in Config, editable via sliders (Why drawer shows live effect). Default weights are *proposed by the agent with justification* and **validated by the test fixtures**, not asserted.
- **Levels** (e.g. critical/high/normal/low) are assigned by quantiles within the current batch plus an absolute override for overdue — so a quiet chat isn't all "critical" and a hot chat isn't all "normal".
- **Explanation** is generated from the top contributing signals: "High because: due in 5 h (0.82), asked directly to you (1.0), no reply from you yet (1.0)".

**Why:** a black-box score can't be trusted or tuned; a transparent one is also a great demo.

---

## 8. "Nothing hardcoded" — what is dynamic and where it comes from

| Thing | Source of truth |
|---|---|
| Chat content | User input / watched source / ingest endpoint |
| Format & timestamp parsing | Inferred from data; user mapping fallback |
| "Now", timezone, locale | System clock + OS/browser locale, user override |
| Who "me" is, aliases | Onboarding + confirmation |
| Model, context window, speed | Runtime probe |
| Window sizes | Model context × safety margin from config |
| Urgency horizon | Observed in the chat; config fallback |
| Weights, thresholds, feature flags | Validated Config, UI-editable |
| UI strings/labels | i18n resource (no inline literals in logic) |
| Demo data | Generated locally by the model from a scenario the *user* picks, watermarked "synthetic"; or user's own chat |
| Prompts | Templates composed at runtime from schema + context |

**Allowed literals:** protocol constants, schema field names, config *defaults* (in one file, each with a justification comment).
**Banned literals:** sample chats, people names, keyword/urgency word lists, fixed dates, model names, magic thresholds in logic, canned summaries.

**Hardcode audit (must pass before "done"):**
1. Static scan for banned literals.
2. Metamorphic test: change names, dates, language, and order in a fixture → outputs must change correspondingly (e.g. shift all timestamps by 3 days → deadline items shift, urgency recomputed).
3. Swap the model → app still works.
4. Unplug network → app still works.

---

## 9. Edge cases (≥5 required by the workshop slide; agent must implement + test all of these)

| # | Edge case | Expected behavior | Why |
|---|---|---|---|
| E1 | Relative/ambiguous dates ("tomorrow", "EOD", "next Fri", "after the exam") | Resolve against message timestamp & user tz; if unresolvable, keep item with "date unclear", never invent | Wrong date is the worst failure |
| E2 | Decision reversed/superseded later | Old item → `superseded`, new one shown, link between them | Stale decisions mislead |
| E3 | Mixed language / code-mixed / emoji-only / slang | Process without crashing, flag low confidence, don't drop messages | Real chats are messy |
| E4 | Chat longer than model context | Hierarchical map-reduce; summary says what portion was covered | Silent truncation = hidden data loss |
| E5 | Model returns invalid JSON / hallucinated quote / times out | Repair→retry→fall back to L1-only results with banner "AI unavailable, showing rule-based results" | Demo resilience |
| E6 | False urgency / spam-style "URGENT!!!" | Penalize without concrete ask/date | Alarm fatigue |
| E7 | User is addressed indirectly ("can you…" in a 1:1, replies, nicknames) | Resolve via reply chains/conversation partner + aliases | Mentions aren't always @ |
| E8 | Edited/deleted/duplicate/forwarded messages | Dedupe by stable id; mark edited/deleted; forwarded ≠ new instruction | Prevents duplicate tasks |
| E9 | Empty chat, single message, or nothing unread | Friendly empty state, no fake summary | Don't hallucinate to fill space |
| E10 | Very fast live burst of messages | Debounce + incremental windows; UI never freezes | Real-time must stay usable |
| E11 | Multiple people with same name | Disambiguate by sender id; ask user if ambiguous | Wrong owner = wrong alert |
| E12 | Clock/timezone mismatch between export and device | Show both, let user choose | Silent tz bugs shift deadlines |

---

## 10. Testing strategy

- **Fixtures generated at test time** (local model or a seeded generator script) — no committed canned "golden" chats embedded in app code. Test fixtures may live in `/tests` only, clearly synthetic.
- **Property/metamorphic tests** (§8), **grounding tests** (every item's quote exists), **schema tests**, **egress test**, **degradation test** (kill the model mid-run), **perf budget** (first deterministic result under a budget measured on the device, configurable).
- **Eval harness:** precision/recall of extracted items against user-labeled ground truth where available; show numbers in the pitch.

---

## 11. Demo & judging alignment

| Judge question | Answer in the app |
|---|---|
| Does it work on unseen data? | Drop any chat on stage |
| Is it truly local? | Privacy Proof panel; airplane-mode run |
| Why this priority? | Why drawer |
| Does it hallucinate? | Click evidence → jumps to source message |
| Is it finished? | MUST+SHOULD fully working; COULD is optional |

**90-second demo script** is generated by the agent at the end from the working app (not pre-written).

---

## 12. Open questions the agent must ask the user (before building)

1. Deadline/time budget for the build?
2. Hardware (CPU/GPU/RAM) and OS of the demo machine? Internet available during demo?
3. Preferred stack/languages? Anything you must use or avoid?
4. Which chat sources matter for the demo (WhatsApp/Slack/Discord/Telegram/other)? Can you provide one real or sanitized export? (If not, agent will generate synthetic data locally.)
5. Your name/aliases as they appear in chats?
6. Target platform: web app, desktop app, or mobile-friendly web?
7. Any rule from the organizers on libraries, models, or API usage?
8. Team size and who presents?
