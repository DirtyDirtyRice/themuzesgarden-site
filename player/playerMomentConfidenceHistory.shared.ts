import type {
  ConfidenceHistoryTrend,
  ConfidenceHistoryPoint,
} from "./playerMomentConfidenceHistory.types";

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export function round1(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

export function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function average(values: Array<number | null | undefined>): number {
  const clean = values
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));

  if (!clean.length) return 0;

  const total = clean.reduce((sum, v) => sum + v, 0);
  return total / clean.length;
}

export function delta(a: number, b: number): number {
  return round1(safeNumber(b) - safeNumber(a));
}

export function sortHistoryPoints(
  points: ConfidenceHistoryPoint[]
): ConfidenceHistoryPoint[] {
  return [...points].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }

    const revisionCompare = normalizeText(a.revisionId).localeCompare(
      normalizeText(b.revisionId)
    );

    if (revisionCompare !== 0) return revisionCompare;

    return normalizeText(a.familyId).localeCompare(normalizeText(b.familyId));
  });
}

export function computeReliabilityScore(params: {
  trustScore: number;
  recoveryScore: number;
  volatilityScore: number;
}): number {
  const trust = clamp100(params.trustScore);
  const recovery = clamp100(params.recoveryScore);
  const volatility = clamp100(params.volatilityScore);

  const stabilityFactor = 100 - volatility;

  const score = trust * 0.52 + recovery * 0.28 + stabilityFactor * 0.2;

  return round1(clamp100(score));
}

export function getTrend(
  deltaValue: number,
  count: number
): ConfidenceHistoryTrend {
  if (count < 2) return "insufficient-data";

  const abs = Math.abs(safeNumber(deltaValue));

  if (abs < 3) return "flat";
  if (deltaValue > 0) return "improving";
  return "declining";
}

export function getVolatilityTrend(
  deltaValue: number,
  count: number
): ConfidenceHistoryTrend {
  if (count < 2) return "insufficient-data";

  const abs = Math.abs(safeNumber(deltaValue));

  if (abs < 3) return "flat";
  if (deltaValue > 0) return "volatile";
  return "improving";
}