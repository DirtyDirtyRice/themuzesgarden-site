import type {
  BuildFamilyPlanningParams,
  FamilyPlanningItem,
  FamilyPlanningReason,
  FamilyPlanningResult,
} from "./playerMomentFamilyPlanning.types";

import {
  average,
  clamp100,
  dedupeReasons,
  getPlanningAction,
  getPlanningHorizon,
  normalizeText,
  round1,
  sortPlanningItems,
} from "./playerMomentFamilyPlanning.shared";

type StrategyResultLike = NonNullable<BuildFamilyPlanningParams["strategyResult"]>;
type StrategyItemLike = StrategyResultLike["items"][number];

function getUrgencyScore(params: {
  strategyScore: number | null;
  timingScore: number | null;
  leverageScore: number | null;
  strategyAction: string | null;
}): number {
  let score =
    (params.strategyScore ?? 0) * 0.34 +
    (params.timingScore ?? 0) * 0.4 +
    (params.leverageScore ?? 0) * 0.26;

  if (params.strategyAction === "push-now") score += 10;
  if (params.strategyAction === "protect-and-hold") score += 6;

  return round1(clamp100(score));
}

function getReadinessScore(params: {
  strategyScore: number | null;
  reuseProgramScore: number | null;
  protectionScore: number | null;
  itemAction: string | null;
}): number {
  let score =
    (params.strategyScore ?? 0) * 0.36 +
    (params.reuseProgramScore ?? 0) * 0.28 +
    (params.protectionScore ?? 0) * 0.18;

  if (params.itemAction === "mine-for-reuse") score += 10;
  if (params.itemAction === "push-now") score += 6;
  if (params.itemAction === "archive-strategically") score -= 10;

  return round1(clamp100(score));
}

function getProtectionNeedScore(params: {
  protectionScore: number | null;
  leverageScore: number | null;
  strategyAction: string | null;
  tier: string | null;
}): number {
  let score =
    (params.protectionScore ?? 0) * 0.54 +
    (params.leverageScore ?? 0) * 0.22;

  if (params.strategyAction === "protect-and-hold") score += 14;
  if (params.tier === "signature") score += 12;
  if (params.tier === "core") score += 4;

  return round1(clamp100(score));
}

function getExecutionValueScore(params: {
  strategyScore: number | null;
  leverageScore: number | null;
  timingScore: number | null;
  reuseProgramScore: number | null;
}): number {
  return round1(
    clamp100(
      (params.strategyScore ?? 0) * 0.3 +
        (params.leverageScore ?? 0) * 0.28 +
        (params.timingScore ?? 0) * 0.22 +
        (params.reuseProgramScore ?? 0) * 0.2
    )
  );
}

function getPlanScore(params: {
  urgencyScore: number;
  readinessScore: number;
  protectionNeedScore: number;
  executionValueScore: number;
}): number {
  return round1(
    clamp100(
      params.urgencyScore * 0.3 +
        params.readinessScore * 0.24 +
        params.protectionNeedScore * 0.22 +
        params.executionValueScore * 0.24
    )
  );
}

function buildItemReasons(params: {
  itemRank: number;
  planScore: number;
  urgencyScore: number;
  readinessScore: number;
  protectionNeedScore: number;
  executionValueScore: number;
  strategyAction: string | null;
  strategyStrongestReason: string | null;
  portfolioHealth: string | null;
  pointCount: number;
}): FamilyPlanningReason[] {
  const reasons: FamilyPlanningReason[] = [];

  if (
    params.protectionNeedScore >= 82 ||
    params.strategyStrongestReason === "signature-anchor-present"
  ) {
    reasons.push("signature-needs-protection");
  }

  if (params.planScore >= 78 || params.strategyAction === "push-now") {
    reasons.push("strategy-priority-confirmed");
  }

  if (params.readinessScore >= 70 || params.strategyAction === "mine-for-reuse") {
    reasons.push("reuse-path-open");
  }

  if (params.executionValueScore >= 62 || params.planScore >= 60) {
    reasons.push("development-queue-worthy");
  }

  if (params.urgencyScore >= 70) {
    reasons.push("timing-window-open");
  }

  if (params.portfolioHealth === "strong" || params.portfolioHealth === "healthy") {
    reasons.push("portfolio-support-strong");
  }

  if (params.pointCount < 2) {
    reasons.push("proof-still-thin");
  }

  if (params.planScore >= 30 && params.planScore < 50) {
    reasons.push("watch-not-ready");
  }

  if (params.planScore < 30) {
    reasons.push("archive-load-confirmed");
  }

  if (params.itemRank <= 3) {
    reasons.push("top-priority-family");
  }

  return dedupeReasons(reasons);
}

function getItemStrongestReason(params: {
  reasons: FamilyPlanningReason[];
  itemRank: number;
  planScore: number;
  protectionNeedScore: number;
  readinessScore: number;
  urgencyScore: number;
  pointCount: number;
}): FamilyPlanningReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (params.itemRank <= 3 && reasons.includes("top-priority-family")) {
    return "top-priority-family";
  }

  if (
    params.protectionNeedScore >= 82 &&
    reasons.includes("signature-needs-protection")
  ) {
    return "signature-needs-protection";
  }

  if (params.pointCount < 2 && reasons.includes("proof-still-thin")) {
    return "proof-still-thin";
  }

  if (params.urgencyScore >= 70 && reasons.includes("timing-window-open")) {
    return "timing-window-open";
  }

  if (params.readinessScore >= 70 && reasons.includes("reuse-path-open")) {
    return "reuse-path-open";
  }

  if (params.planScore >= 78 && reasons.includes("strategy-priority-confirmed")) {
    return "strategy-priority-confirmed";
  }

  return reasons[0] ?? null;
}

function buildPlanningItem(params: {
  itemRank: number;
  strategyItem: StrategyItemLike;
  portfolioHealth: string | null;
}): FamilyPlanningItem {
  const strategyItem = params.strategyItem;
  const portfolioItem =
    strategyItem.familyId &&
    strategyItem;

  const recommendationResult =
    strategyItem.familyId &&
    null;

  void portfolioItem;
  void recommendationResult;

  const strategyScore = strategyItem.strategyScore ?? 0;
  const leverageScore = strategyItem.leverageScore ?? 0;
  const timingScore = strategyItem.timingScore ?? 0;
  const protectionScore = strategyItem.protectionScore ?? 0;
  const reuseProgramScore = strategyItem.reuseProgramScore ?? 0;

  const urgencyScore = getUrgencyScore({
    strategyScore,
    timingScore,
    leverageScore,
    strategyAction: strategyItem.strategyAction ?? null,
  });

  const readinessScore = getReadinessScore({
    strategyScore,
    reuseProgramScore,
    protectionScore,
    itemAction: strategyItem.strategyAction ?? null,
  });

  const protectionNeedScore = getProtectionNeedScore({
    protectionScore,
    leverageScore,
    strategyAction: strategyItem.strategyAction ?? null,
    tier: null,
  });

  const executionValueScore = getExecutionValueScore({
    strategyScore,
    leverageScore,
    timingScore,
    reuseProgramScore,
  });

  const planScore = getPlanScore({
    urgencyScore,
    readinessScore,
    protectionNeedScore,
    executionValueScore,
  });

  const pointCount = Array.isArray(strategyItem.reasons) &&
    strategyItem.reasons.includes("proof-base-thin")
      ? 1
      : 2;

  const reasons = buildItemReasons({
    itemRank: params.itemRank,
    planScore,
    urgencyScore,
    readinessScore,
    protectionNeedScore,
    executionValueScore,
    strategyAction: strategyItem.strategyAction ?? null,
    strategyStrongestReason: strategyItem.strongestReason ?? null,
    portfolioHealth: params.portfolioHealth,
    pointCount,
  });

  const strongestReason = getItemStrongestReason({
    reasons,
    itemRank: params.itemRank,
    planScore,
    protectionNeedScore,
    readinessScore,
    urgencyScore,
    pointCount,
  });

  const planningAction = getPlanningAction({
    planScore,
    protectionNeedScore,
    readinessScore,
    urgencyScore,
    strategyAction: strategyItem.strategyAction ?? null,
    strongestReason,
  });

  return {
    familyId: normalizeText(strategyItem.familyId),
    planScore,
    urgencyScore,
    readinessScore,
    protectionNeedScore,
    executionValueScore,
    planningAction,
    planningHorizon: getPlanningHorizon(planScore),
    strongestReason,
    reasons,
  };
}

function buildReasons(params: {
  planScore: number;
  urgencyScore: number;
  readinessScore: number;
  protectionNeedScore: number;
  familyCount: number;
  immediateCount: number;
  nextCount: number;
  holdCount: number;
  proofThinCount: number;
  strategyAction: string | null;
}): FamilyPlanningReason[] {
  const reasons: FamilyPlanningReason[] = [];

  if (params.protectionNeedScore >= 76) {
    reasons.push("signature-needs-protection");
  }

  if (params.planScore >= 76 || params.strategyAction === "push-now") {
    reasons.push("strategy-priority-confirmed");
  }

  if (params.readinessScore >= 68) {
    reasons.push("reuse-path-open");
  }

  if (params.nextCount + params.immediateCount >= Math.max(1, Math.ceil(params.familyCount * 0.3))) {
    reasons.push("development-queue-worthy");
  }

  if (params.urgencyScore >= 70 || params.immediateCount >= 1) {
    reasons.push("timing-window-open");
  }

  if (params.familyCount >= 2 && params.holdCount < params.familyCount) {
    reasons.push("portfolio-support-strong");
  }

  if (params.proofThinCount >= Math.max(1, Math.ceil(params.familyCount * 0.25))) {
    reasons.push("proof-still-thin");
  }

  if (params.holdCount >= Math.max(1, Math.ceil(params.familyCount * 0.3))) {
    reasons.push("watch-not-ready");
  }

  if (params.holdCount >= Math.max(2, Math.ceil(params.familyCount * 0.4))) {
    reasons.push("archive-load-confirmed");
  }

  if (params.immediateCount >= 1) {
    reasons.push("top-priority-family");
  }

  return dedupeReasons(reasons);
}

function getStrongestReason(params: {
  reasons: FamilyPlanningReason[];
  planScore: number;
  urgencyScore: number;
  readinessScore: number;
  protectionNeedScore: number;
  immediateCount: number;
  proofThinCount: number;
  familyCount: number;
}): FamilyPlanningReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (params.immediateCount >= 1 && reasons.includes("top-priority-family")) {
    return "top-priority-family";
  }

  if (
    params.protectionNeedScore >= 76 &&
    reasons.includes("signature-needs-protection")
  ) {
    return "signature-needs-protection";
  }

  if (
    params.proofThinCount >= Math.max(1, Math.ceil(params.familyCount * 0.25)) &&
    reasons.includes("proof-still-thin")
  ) {
    return "proof-still-thin";
  }

  if (params.urgencyScore >= 70 && reasons.includes("timing-window-open")) {
    return "timing-window-open";
  }

  if (params.readinessScore >= 68 && reasons.includes("reuse-path-open")) {
    return "reuse-path-open";
  }

  if (params.planScore >= 76 && reasons.includes("strategy-priority-confirmed")) {
    return "strategy-priority-confirmed";
  }

  return reasons[0] ?? null;
}

export function buildFamilyPlanning(
  params: BuildFamilyPlanningParams
): FamilyPlanningResult {
  const strategyResult = params.strategyResult ?? null;
  const strategyItems = strategyResult?.items ?? [];
  const portfolioHealth = strategyResult?.portfolioResult?.portfolioHealth ?? null;

  const items = sortPlanningItems(
    strategyItems.map((strategyItem, index) =>
      buildPlanningItem({
        itemRank: index + 1,
        strategyItem,
        portfolioHealth,
      })
    )
  );

  const immediateFamilyIds = items
    .filter((item) => item.planningHorizon === "immediate")
    .map((item) => item.familyId);

  const nextFamilyIds = items
    .filter((item) => item.planningHorizon === "next-up")
    .map((item) => item.familyId);

  const queuedFamilyIds = items
    .filter((item) => item.planningHorizon === "queued")
    .map((item) => item.familyId);

  const backlogFamilyIds = items
    .filter((item) => item.planningHorizon === "backlog")
    .map((item) => item.familyId);

  const holdFamilyIds = items
    .filter((item) => item.planningHorizon === "hold")
    .map((item) => item.familyId);

  const planScore = round1(average(items.map((item) => item.planScore)));
  const urgencyScore = round1(average(items.map((item) => item.urgencyScore)));
  const readinessScore = round1(average(items.map((item) => item.readinessScore)));
  const protectionNeedScore = round1(
    average(items.map((item) => item.protectionNeedScore))
  );
  const executionValueScore = round1(
    average(items.map((item) => item.executionValueScore))
  );

  const proofThinCount = items.filter((item) =>
    item.reasons.includes("proof-still-thin")
  ).length;

  const reasons = buildReasons({
    planScore,
    urgencyScore,
    readinessScore,
    protectionNeedScore,
    familyCount: items.length,
    immediateCount: immediateFamilyIds.length,
    nextCount: nextFamilyIds.length,
    holdCount: holdFamilyIds.length,
    proofThinCount,
    strategyAction: strategyResult?.strategyAction ?? null,
  });

  const strongestReason = getStrongestReason({
    reasons,
    planScore,
    urgencyScore,
    readinessScore,
    protectionNeedScore,
    immediateCount: immediateFamilyIds.length,
    proofThinCount,
    familyCount: items.length,
  });

  return {
    familyCount: items.length,
    planScore,
    urgencyScore,
    readinessScore,
    protectionNeedScore,
    executionValueScore,
    strongestReason,
    reasons,
    strategyResult,
    immediateFamilyIds,
    nextFamilyIds,
    queuedFamilyIds,
    backlogFamilyIds,
    holdFamilyIds,
    items,
  };
}
