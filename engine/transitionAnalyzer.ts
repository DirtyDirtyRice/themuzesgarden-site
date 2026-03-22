type PlannedTransitionLike = {
  id: string;
  [key: string]: any;
};

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
  transition: PlannedTransitionLike,
  expectedEndMs: number,
  actualEndMs: number
): TransitionScore {
  const timingErrorMs = Math.abs(actualEndMs - expectedEndMs);

  const smoothness = clamp(100 - timingErrorMs * 2, 0, 100);

  const result: TransitionScore = {
    id: String(transition?.id ?? ""),
    timingErrorMs,
    smoothness,
    completedAt: performance.now(),
  };

  history.push(result);

  console.log(
    `[Transition Analyzer] ${String(
      transition?.id ?? ""
    )} | error=${timingErrorMs.toFixed(2)}ms | smooth=${smoothness.toFixed(1)}`
  );

  return result;
}

export function getTransitionHistory(): TransitionScore[] {
  return history;
}
