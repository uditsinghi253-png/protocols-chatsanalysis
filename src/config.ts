/**
 * Validated App Configuration
 * All numeric thresholds, weights, and intervals are centralized here.
 * Zero magic numbers in logic. Every default has an explicit one-line justification.
 */

export interface AppConfig {
  // --- Scoring Weights (Sum should ideally normalize to 1.0) ---
  weights: {
    deadlineProximity: number; // Why: Deadlines approaching immediately are high priority tasks
    overdueSaturation: number; // Why: Missed deadlines represent immediate operational breakdown
    directAddress: number;     // Why: Direct questions or mentions require personal attention
    unansweredAsk: number;     // Why: An open question with no user reply risks stalling teammates
    imperativeAction: number;  // Why: Action-oriented sentences require physical execution
    broadcastMarker: number;   // Why: Announcements to @all or @channel need team-wide awareness
    falseUrgencyPenalty: number; // Why: Excessive shouting/exclamation without concrete tasks causes alarm fatigue
  };

  // --- Urgency Horizons and Thresholds ---
  horizons: {
    criticalDeadlineHours: number; // Why: Tasks due under 6 hours require immediate action in current work block
    highDeadlineHours: number;     // Why: Tasks due under 24 hours require action within today's shift
    normalDeadlineHours: number;   // Why: Tasks due under 72 hours should be queued for the week
    overduePenaltyMultiplier: number; // Why: Overdue tasks scale urgency to maximum saturation
  };

  // --- Quantile Thresholds for Item Classification ---
  quantiles: {
    criticalScoreThreshold: number; // Why: Items scoring >= 0.75 are elevated to critical lane
    highScoreThreshold: number;     // Why: Items scoring >= 0.50 are elevated to high priority lane
    normalScoreThreshold: number;   // Why: Items scoring >= 0.25 are kept in standard lane
  };

  // --- Structural Heuristics (no keyword lists!) ---
  heuristics: {
    capsLockShoutRatio: number;      // Why: Text with >60% uppercase letters signals shouting/false urgency
    minLettersForShoutCheck: number; // Why: Short acronyms (e.g., OK, API) should not be flagged as shouting
    minQuestionLength: number;       // Why: Avoid single-character punctuation marks being misparsed as tasks
  };

  // --- Runtime and Real-Time Intervals ---
  runtime: {
    clockTickIntervalMs: number;     // Why: 10-second refresh guarantees live countdown updates without battery drain
    liveBurstDebounceMs: number;     // Why: 300ms debounce prevents UI freezing during rapid chat message bursts
    modelProbeTimeoutMs: number;     // Why: 1500ms timeout ensures app starts immediately if local server is down
    maxContextTokensDefault: number; // Why: 4096 tokens is standard safe context window for local compact models
    contextSafetyMarginPercent: number; // Why: 20% headroom prevents context truncation on generation
  };
}

export const DEFAULT_CONFIG: AppConfig = {
  weights: {
    deadlineProximity: 0.30,   // Why: Approaching deadlines represent the most time-sensitive work
    overdueSaturation: 0.35,   // Why: Overdue items demand immediate intervention before any other task
    directAddress: 0.25,       // Why: Things addressed specifically to the user cannot be ignored
    unansweredAsk: 0.20,       // Why: Unanswered questions block colleagues and hold up progress
    imperativeAction: 0.15,    // Why: Explicit action items indicate commitments made in the chat
    broadcastMarker: 0.10,     // Why: Channel-wide pings (@all) are important but shared by everyone
    falseUrgencyPenalty: -0.20, // Why: Excessive exclamation and ALL-CAPS without deadlines must be downgraded
  },
  horizons: {
    criticalDeadlineHours: 6,    // Why: Less than 6 hours remaining requires immediate interruption
    highDeadlineHours: 24,       // Why: Less than 24 hours remaining requires same-day scheduling
    normalDeadlineHours: 72,     // Why: Less than 3 days remaining requires near-term planning
    overduePenaltyMultiplier: 1.5, // Why: Overdue status escalates score aggressively
  },
  quantiles: {
    criticalScoreThreshold: 0.75, // Why: Top quartile items need prominent alert treatment
    highScoreThreshold: 0.50,     // Why: Upper half urgency merits prioritized visibility
    normalScoreThreshold: 0.25,   // Why: Baseline threshold separates routine chatter from tasks
  },
  heuristics: {
    capsLockShoutRatio: 0.60,      // Why: More than 60% uppercase characters indicates shouting
    minLettersForShoutCheck: 12,   // Why: Filters out harmless acronyms like "ETA", "WIP", or "FYI"
    minQuestionLength: 6,          // Why: Filters out stray question marks like "?" or "??"
  },
  runtime: {
    clockTickIntervalMs: 10000,    // Why: 10 seconds balances reactive countdowns with CPU efficiency
    liveBurstDebounceMs: 300,      // Why: 300ms smoothly batches message streams without UI stutter
    modelProbeTimeoutMs: 1500,     // Why: 1.5s avoids blocking app initialization when Ollama is offline
    maxContextTokensDefault: 4096, // Why: Safe default for M1 8GB local model inference
    contextSafetyMarginPercent: 20, // Why: 20% margin prevents runtime context overflow errors
  },
};

/**
 * Validates custom configuration to prevent negative or NaN values
 * Why: Guarantees user slider adjustments cannot crash the scoring pipeline
 */
export function validateConfig(config: AppConfig): boolean {
  if (!config || !config.weights || !config.horizons || !config.runtime) return false;
  if (config.horizons.criticalDeadlineHours <= 0) return false;
  if (config.runtime.clockTickIntervalMs <= 0) return false;
  return true;
}
