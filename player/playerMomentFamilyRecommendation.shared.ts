import type {
  FamilyRecommendationAction,
  FamilyRecommendationPriority,
  FamilyRecommendationReason,
} from "./playerMomentFamilyRecommendation.types";

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
}

export function round1(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

export function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function average(values: Array<number | null | undefined>): number {
  const clean = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!clean.length) return 0;

  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function dedupeReasons(
  reasons: FamilyRecommendationReason[]
): FamilyRecommendationReason[] {
  const seen = new Set<FamilyRecommendationReason>();
  const result: FamilyRecommendationReason[] = [];

  for (const reason of reasons) {
    if (!seen.has(reason)) {
      seen.add(reason);
      result.push(reason);
    }
  }

  return result;
}

export function getRecommendationPriority(
  score: number
): FamilyRecommendationPriority {
  const s = clamp100(score);

  if (s < 20) return "none";
  if (s < 45) return "low";
  if (s < 70) return "medium";
  if (s < 85) return "high";
  return "critical";
}

export function getRecommendationAction(params: {
  recommendationScore: number;
  preserveScore: number;
  investmentScore: number;
  urgencyScore: number;
  keeperStatus: string | null;
  surfaceStatus: string | null;
}): FamilyRecommendationAction {
  const recommendationScore = clamp100(params.recommendationScore);
  const preserveScore = clamp100(params.preserveScore);
  const investmentScore = clamp100(params.investmentScore);
  const urgencyScore = clamp100(params.urgencyScore);

  if (
    preserveScore >= 88 &&
    recommendationScore >= 82 &&
    params.keeperStatus === "signature"
  ) {
    return "protect-signature";
  }

  if (
    recommendationScore >= 80 &&
    urgencyScore >= 74 &&
    params.surfaceStatus === "surface-now"
  ) {
    return "promote";
  }

  if (recommendationScore >= 72 && investmentScore >= 68) {
    return "reuse";
  }

  if (investmentScore >= 52 || recommendationScore >= 55) {
    return "develop";
  }

  if (recommendationScore >= 28 || urgencyScore >= 26) {
    return "monitor";
  }

  return "archive";
}