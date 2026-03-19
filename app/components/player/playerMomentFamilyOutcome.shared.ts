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

export function calculateOutcomeScore(params: {
  success: boolean;
  signalConfirmed: boolean;
  driftCorrected: boolean;
  repeatReinforced: boolean;
  structureReinforced: boolean;
  trustDelta: number | null;
}): number | null {
  if (!params.success) return 0;

  let score = 0;

  if (params.signalConfirmed) score += 0.25;
  if (params.driftCorrected) score += 0.2;
  if (params.repeatReinforced) score += 0.2;
  if (params.structureReinforced) score += 0.2;

  if (params.trustDelta !== null) {
    if (params.trustDelta > 0) score += 0.15;
    if (params.trustDelta < 0) score -= 0.15;
  }

  return clamp01(score);
}

export function getOutcomeLabel(score: number | null): string | null {
  if (score === null) return null;

  if (score >= 0.85) return "strong-positive";
  if (score >= 0.65) return "positive";
  if (score >= 0.45) return "neutral";
  if (score >= 0.25) return "negative";
  return "failure";
}