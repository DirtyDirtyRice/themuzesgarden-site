// engine/intelligence/transitionAnalyzer.ts

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
 * Analyze a finished transition (planner/execution agnostic).
 * You pass an id + expected vs actual end times.
 */
export function analyzeTransition(
  transition: { id: string },
  expectedEndMs: number,
  actualEndMs: number
): TransitionScore {
  const timingErrorMs = Math.abs(actualEndMs - expectedEndMs);

  // Simple first pass: ~10–20ms is noticeable; tune later.
  const smoothness = clamp(100 - timingErrorMs * 2, 0, 100);

  const result: TransitionScore = {
    id: transition.id,
    timingErrorMs,
    smoothness,
    completedAt: performance.now(),
  };

  history.push(result);

  console.log(
    `[Transition Analyzer] ${transition.id} | error=${timingErrorMs.toFixed(2)}ms | smooth=${smoothness.toFixed(1)}`
  );

  return result;
}

export function getTransitionHistory() {
  return history;
}