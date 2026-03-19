import type {
  FamilyPlanningAction,
  FamilyPlanningHorizon,
  FamilyPlanningItem,
  FamilyPlanningReason,
} from "./playerMomentFamilyPlanning.types";

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
  reasons: FamilyPlanningReason[]
): FamilyPlanningReason[] {
  const seen = new Set<FamilyPlanningReason>();
  const result: FamilyPlanningReason[] = [];

  for (const reason of reasons) {
    if (!seen.has(reason)) {
      seen.add(reason);
      result.push(reason);
    }
  }

  return result;
}

export function sortPlanningItems(
  items: FamilyPlanningItem[]
): FamilyPlanningItem[] {
  return [...items].sort((a, b) => {
    if (b.planScore !== a.planScore) {
      return b.planScore - a.planScore;
    }

    if (b.urgencyScore !== a.urgencyScore) {
      return b.urgencyScore - a.urgencyScore;
    }

    return normalizeText(a.familyId).localeCompare(normalizeText(b.familyId));
  });
}

export function getPlanningHorizon(score: number): FamilyPlanningHorizon {
  const s = clamp100(score);

  if (s >= 82) return "immediate";
  if (s >= 68) return "next-up";
  if (s >= 50) return "queued";
  if (s >= 30) return "backlog";
  return "hold";
}

export function getPlanningAction(params: {
  planScore: number;
  protectionNeedScore: number;
  readinessScore: number;
  urgencyScore: number;
  strategyAction: string | null;
  strongestReason: string | null;
}): FamilyPlanningAction {
  const planScore = clamp100(params.planScore);
  const protectionNeedScore = clamp100(params.protectionNeedScore);
  const readinessScore = clamp100(params.readinessScore);
  const urgencyScore = clamp100(params.urgencyScore);

  if (
    protectionNeedScore >= 82 &&
    (params.strategyAction === "protect-and-hold" ||
      params.strongestReason === "signature-anchor-present")
  ) {
    return "protect-now";
  }

  if (
    planScore >= 78 &&
    urgencyScore >= 72 &&
    params.strategyAction === "push-now"
  ) {
    return "push-now";
  }

  if (
    readinessScore >= 70 &&
    params.strategyAction === "mine-for-reuse"
  ) {
    return "prepare-reuse";
  }

  if (planScore >= 56) {
    return "develop-next";
  }

  if (planScore >= 30) {
    return "monitor-later";
  }

  return "archive-intentionally";
}