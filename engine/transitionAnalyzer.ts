// engine/intelligence/transitionAnalyzer.ts

import type { PlannedTransition } from "../core/types";

export type TransitionScore = {
  id: string;
  timingErrorMs: number;
  smoothness: number; // 0–100
  completedAt: number;
};

const history: TransitionScore[] = [];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Analyze a finished transition.
 *
 * We measure:
 * - expected end time vs actual end time
 * - convert timing accuracy into musical smoothness
 */
export function analyzeTransition(
  transition: PlannedTransition,
  expectedEndMs: number,
  actualEndMs: number
): TransitionScore {
  const timingErrorMs = Math.abs(actualEndMs - expectedEndMs);

  // Humans detect ≈10–20ms timing deviation
  const smoothness = clamp(
    100 - timingErrorMs * 2,
    0,
    100
  );

  const result: TransitionScore = {
    id: transition.id,
    timingErrorMs,
    smoothness,
    completedAt: performance.now(),
  };

  history.push(result);

  console.log(
    `[Transition Analyzer] ${transition.id} | error=${timingErrorMs.toFixed(
      2
    )}ms | smooth=${smoothness.toFixed(1)}`
  );

  return result;
}

export function getTransitionHistory() {
  return history;
}