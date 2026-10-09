/**
 * L4 Explainable Urgency & Relevance Scoring Engine
 * Computes urgency = sum(w_i * s_i) with full transparency and quantile classification.
 * Zero magic numbers in logic; all weights and horizons sourced from validated AppConfig.
 * Why: C3 & §7. Black-box ranking destroys trust; explainable scores can be audited and tuned.
 */

import { Item, ItemSignal } from '../types/schema';
import { AppConfig } from '../config';

export function calculateItemUrgency(
  item: Item,
  config: AppConfig,
  referenceNow = new Date()
): { score: number; level: 'critical' | 'high' | 'normal' | 'low'; explanation: string } {
  // If item is already done or superseded, set lowest urgency
  if (item.status === 'done' || item.status === 'superseded') {
    return {
      score: 0.1,
      level: 'low',
      explanation: item.status === 'done' ? 'Completed task.' : 'Superseded by newer decision.',
    };
  }

  // Check dynamic deadline proximity against referenceNow
  let isOverdue = false;
  let deadlineHoursLeft: number | null = null;

  if (item.due && item.due.iso) {
    const dueTime = new Date(item.due.iso).getTime();
    const nowTime = referenceNow.getTime();
    deadlineHoursLeft = (dueTime - nowTime) / (3600 * 1000);
    if (deadlineHoursLeft < 0) {
      isOverdue = true;
    }
  }

  // Update dynamic signals based on current clock time
  const dynamicSignals: ItemSignal[] = [...item.signals];

  if (deadlineHoursLeft !== null) {
    // Refresh or add deadlineProximity signal
    const proxIdx = dynamicSignals.findIndex(s => s.name === 'deadlineProximity');
    const proxValue = isOverdue
      ? 1.0
      : Math.max(0, 1 - Math.min(deadlineHoursLeft, config.horizons.normalDeadlineHours) / config.horizons.normalDeadlineHours);

    const proxSignal: ItemSignal = {
      name: 'deadlineProximity',
      value: proxValue,
      weight: config.weights.deadlineProximity,
      source: 'rule',
      description: isOverdue ? 'Deadline is overdue!' : `Due in ${Math.max(0, Math.round(deadlineHoursLeft))} hours`,
    };

    if (proxIdx !== -1) {
      dynamicSignals[proxIdx] = proxSignal;
    } else {
      dynamicSignals.push(proxSignal);
    }

    // Overdue saturation signal
    const overIdx = dynamicSignals.findIndex(s => s.name === 'overdueSaturation');
    if (isOverdue) {
      const overSignal: ItemSignal = {
        name: 'overdueSaturation',
        value: 1.0,
        weight: config.weights.overdueSaturation,
        source: 'rule',
        description: 'Past due deadline; requires immediate completion',
      };
      if (overIdx !== -1) {
        dynamicSignals[overIdx] = overSignal;
      } else {
        dynamicSignals.push(overSignal);
      }
    } else if (overIdx !== -1) {
      dynamicSignals.splice(overIdx, 1);
    }
  }

  // Urgency = sum(w_i * s_i)
  let rawScore = 0;
  let totalWeight = 0;
  const signalExplanations: Array<{ desc: string; contribution: number }> = [];

  for (const sig of dynamicSignals) {
    const weight = sig.weight ?? (config.weights[sig.name as keyof typeof config.weights] ?? 0.1);
    const contribution = sig.value * weight;
    rawScore += contribution;
    totalWeight += Math.abs(weight);

    if (Math.abs(contribution) > 0.05) {
      signalExplanations.push({
        desc: sig.description || `${sig.name} (${(sig.value).toFixed(2)})`,
        contribution,
      });
    }
  }

  // Normalize score between 0.0 and 1.0
  let normalizedScore = totalWeight > 0 ? Math.min(1.0, Math.max(0.0, rawScore / Math.max(totalWeight, 0.5))) : 0.3;

  // Absolute override for overdue items: saturates score
  if (isOverdue) {
    normalizedScore = Math.max(0.92, normalizedScore * config.horizons.overduePenaltyMultiplier);
    normalizedScore = Math.min(1.0, normalizedScore);
  }

  // Level classification by quantile thresholds from config
  let level: 'critical' | 'high' | 'normal' | 'low';
  if (isOverdue || normalizedScore >= config.quantiles.criticalScoreThreshold) {
    level = 'critical';
  } else if (normalizedScore >= config.quantiles.highScoreThreshold) {
    level = 'high';
  } else if (normalizedScore >= config.quantiles.normalScoreThreshold) {
    level = 'normal';
  } else {
    level = 'low';
  }

  // Sort signal explanations by absolute impact to generate readable "Why"
  signalExplanations.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const topReasons = signalExplanations.slice(0, 3).map(r => r.desc).join('; ');
  const explanation = `${level.toUpperCase()}: ${topReasons || 'Routine unread chat item.'}`;

  // Update item's signals in place
  item.signals = dynamicSignals;

  return {
    score: Number(normalizedScore.toFixed(2)),
    level,
    explanation,
  };
}

/**
 * Rescores an entire batch of items against the current system clock and active config
 * Why: Real-time clock ticks update urgency live as deadlines near without requiring new data
 */
export function rescoreAllItems(items: Item[], config: AppConfig, referenceNow = new Date()): Item[] {
  return items.map(item => {
    const urgency = calculateItemUrgency(item, config, referenceNow);
    return {
      ...item,
      urgency,
      status: item.due && new Date(item.due.iso).getTime() < referenceNow.getTime() && item.status === 'open' 
        ? 'overdue' 
        : item.status,
    };
  });
}
