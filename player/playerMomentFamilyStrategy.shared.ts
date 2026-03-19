import type {
  FamilyStrategyAction,
  FamilyStrategyHorizon,
  FamilyStrategyItem,
  FamilyStrategyReason,
} from "./playerMomentFamilyStrategy.types";

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
  reasons: FamilyStrategyReason[]
): FamilyStrategyReason[] {
  const seen = new Set<FamilyStrategyReason>();
  const result: FamilyStrategyReason[] = [];

  for (const reason of reasons) {
    if (!seen.has(reason)) {
      seen.add(reason);
      result.push(reason);
    }
  }

  return result;
}

export function sortStrategyItems(
  items: FamilyStrategyItem[]
): FamilyStrategyItem[] {
  return [...items].sort((a, b) => {
    if (b.strategyScore !== a.strategyScore) {
      return b.strategyScore - a.strategyScore;
    }

    if (b.protectionScore !== a.protectionScore) {
      return b.protectionScore - a.protectionScore;
    }

    return normalizeText(a.familyId).localeCompare(normalizeText(b.familyId));
  });
}

export function getStrategyHorizon(score: number): FamilyStrategyHorizon {
  const s = clamp100(score);

  if (s < 28) return "deferred";
  if (s < 48) return "near-term";
  if (s < 68) return "active";
  if (s < 85) return "priority";
  return "long-term-anchor";
}

export function getStrategyAction(params: {
  strategyScore: number;
  protectionScore: number;
  timingScore: number;
  reuseProgramScore: number;
  signatureCount: number;
  coreCount: number;
  portfolioHealth: string | null;
}): FamilyStrategyAction {
  const strategyScore = clamp100(params.strategyScore);
  const protectionScore = clamp100(params.protectionScore);
  const timingScore = clamp100(params.timingScore);
  const reuseProgramScore = clamp100(params.reuseProgramScore);

  if (
    protectionScore >= 86 &&
    params.signatureCount >= 1 &&
    params.portfolioHealth === "strong"
  ) {
    return "protect-and-hold";
  }

  if (
    strategyScore >= 78 &&
    timingScore >= 72 &&
    (params.coreCount >= 2 || params.portfolioHealth === "strong")
  ) {
    return "push-now";
  }

  if (reuseProgramScore >= 72) {
    return "mine-for-reuse";
  }

  if (strategyScore >= 48) {
    return "develop-gradually";
  }

  if (strategyScore >= 26) {
    return "monitor-lightly";
  }

  return "archive-strategically";
}