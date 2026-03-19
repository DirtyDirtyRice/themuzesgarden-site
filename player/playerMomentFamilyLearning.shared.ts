function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function normalizeBoolean(value: unknown): boolean {
  return Boolean(value);
}

export function calculateLearningScore(params: {
  outcomeScore: number | null;
  signalConfirmed: boolean;
  driftCorrected: boolean;
  repeatReinforced: boolean;
  structureReinforced: boolean;
  trustDelta: number | null;
}): number | null {
  const base = Number(params.outcomeScore ?? 0);

  let score = base;

  if (params.signalConfirmed) score += 0.1;
  if (params.driftCorrected) score += 0.1;
  if (params.repeatReinforced) score += 0.1;
  if (params.structureReinforced) score += 0.1;

  if (params.trustDelta !== null) {
    if (params.trustDelta > 0) score += 0.1;
    if (params.trustDelta < 0) score -= 0.1;
  }

  return clamp01(score);
}

export function getLearningLabel(score: number | null): string | null {
  if (score === null) return null;

  if (score >= 0.85) return "strong-learning";
  if (score >= 0.65) return "positive-learning";
  if (score >= 0.45) return "neutral-learning";
  return "negative-learning";
}