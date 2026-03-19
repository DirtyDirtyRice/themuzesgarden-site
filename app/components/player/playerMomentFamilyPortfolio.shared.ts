import type {
  FamilyPortfolioHealth,
  FamilyPortfolioItem,
  FamilyPortfolioReason,
  FamilyPortfolioTier,
} from "./playerMomentFamilyPortfolio.types";

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
  reasons: FamilyPortfolioReason[]
): FamilyPortfolioReason[] {
  const seen = new Set<FamilyPortfolioReason>();
  const result: FamilyPortfolioReason[] = [];

  for (const reason of reasons) {
    if (!seen.has(reason)) {
      seen.add(reason);
      result.push(reason);
    }
  }

  return result;
}

export function getPortfolioTier(score: number): FamilyPortfolioTier {
  const s = clamp100(score);

  if (s < 28) return "archive";
  if (s < 48) return "watch";
  if (s < 68) return "active";
  if (s < 85) return "core";
  return "signature";
}

export function getPortfolioHealth(params: {
  averagePortfolioScore: number;
  signatureCount: number;
  coreCount: number;
  activeCount: number;
  familyCount: number;
}): FamilyPortfolioHealth {
  if (params.familyCount <= 0) return "weak";

  const coreRatio =
    (params.signatureCount + params.coreCount + params.activeCount) /
    Math.max(1, params.familyCount);

  if (params.averagePortfolioScore >= 78 && coreRatio >= 0.55) {
    return "strong";
  }

  if (params.averagePortfolioScore >= 62 && coreRatio >= 0.4) {
    return "healthy";
  }

  if (params.averagePortfolioScore >= 40) {
    return "mixed";
  }

  return "weak";
}

export function sortPortfolioItems(
  items: FamilyPortfolioItem[]
): FamilyPortfolioItem[] {
  return [...items].sort((a, b) => {
    if (b.portfolioScore !== a.portfolioScore) {
      return b.portfolioScore - a.portfolioScore;
    }

    const aPriority =
      a.recommendationResult?.recommendationPriority === "critical"
        ? 4
        : a.recommendationResult?.recommendationPriority === "high"
          ? 3
          : a.recommendationResult?.recommendationPriority === "medium"
            ? 2
            : a.recommendationResult?.recommendationPriority === "low"
              ? 1
              : 0;

    const bPriority =
      b.recommendationResult?.recommendationPriority === "critical"
        ? 4
        : b.recommendationResult?.recommendationPriority === "high"
          ? 3
          : b.recommendationResult?.recommendationPriority === "medium"
            ? 2
            : b.recommendationResult?.recommendationPriority === "low"
              ? 1
              : 0;

    if (bPriority !== aPriority) {
      return bPriority - aPriority;
    }

    return normalizeText(a.familyId).localeCompare(normalizeText(b.familyId));
  });
}