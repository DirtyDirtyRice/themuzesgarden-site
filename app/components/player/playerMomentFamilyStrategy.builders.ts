import type {
  BuildFamilyStrategyParams,
  FamilyStrategyItem,
  FamilyStrategyReason,
  FamilyStrategyResult,
} from "./playerMomentFamilyStrategy.types";

import {
  average,
  clamp100,
  dedupeReasons,
  getStrategyAction,
  getStrategyHorizon,
  normalizeText,
  round1,
  sortStrategyItems,
} from "./playerMomentFamilyStrategy.shared";

function getLeverageScore(params: {
  portfolioScore: number | null;
  strategicValueScore: number | null;
  recommendationScore: number | null;
  rankingScore: number | null;
}): number {
  return round1(
    clamp100(
      (params.portfolioScore ?? 0) * 0.3 +
        (params.strategicValueScore ?? 0) * 0.28 +
        (params.recommendationScore ?? 0) * 0.22 +
        (params.rankingScore ?? 0) * 0.2
    )
  );
}

function getProtectionScore(params: {
  tier: string | null;
  portfolioScore: number | null;
  resilienceScore: number | null;
  preserveScore: number | null;
  confidenceScore: number | null;
}): number {
  let score =
    (params.portfolioScore ?? 0) * 0.26 +
    (params.resilienceScore ?? 0) * 0.28 +
    (params.preserveScore ?? 0) * 0.28 +
    (params.confidenceScore ?? 0) * 0.18;

  if (params.tier === "signature") score += 10;
  if (params.tier === "core") score += 4;

  return round1(clamp100(score));
}

function getTimingScore(params: {
  recommendationPriority: string | null;
  momentumScore: number | null;
  urgencyScore: number | null;
  sustainabilityScore: number | null;
  portfolioHealth: string | null;
}): number {
  let score =
    (params.momentumScore ?? 0) * 0.28 +
    (params.urgencyScore ?? 0) * 0.34 +
    (params.sustainabilityScore ?? 0) * 0.2;

  if (params.recommendationPriority === "critical") score += 14;
  if (params.recommendationPriority === "high") score += 8;
  if (params.portfolioHealth === "strong") score += 6;
  if (params.portfolioHealth === "healthy") score += 3;

  return round1(clamp100(score));
}

function getReuseProgramScore(params: {
  reusePriorityScore: number | null;
  candidateScore: number | null;
  noveltyScore: number | null;
  recommendationAction: string | null;
  activeCount: number;
}): number {
  let score =
    (params.reusePriorityScore ?? 0) * 0.42 +
    (params.candidateScore ?? 0) * 0.24 +
    (params.noveltyScore ?? 0) * 0.14;

  if (params.recommendationAction === "reuse") score += 10;
  if (params.recommendationAction === "develop") score += 4;
  if (params.activeCount >= 3) score += 4;

  return round1(clamp100(score));
}

function getStrategyScore(params: {
  leverageScore: number;
  protectionScore: number;
  timingScore: number;
  reuseProgramScore: number;
}): number {
  return round1(
    clamp100(
      params.leverageScore * 0.28 +
        params.protectionScore * 0.26 +
        params.timingScore * 0.24 +
        params.reuseProgramScore * 0.22
    )
  );
}

function buildItemReasons(params: {
  tier: string | null;
  strategyScore: number;
  leverageScore: number;
  protectionScore: number;
  timingScore: number;
  reuseProgramScore: number;
  pointCount: number;
  portfolioHealth: string | null;
}): FamilyStrategyReason[] {
  const reasons: FamilyStrategyReason[] = [];

  if (params.tier === "signature" && params.protectionScore >= 80) {
    reasons.push("signature-anchor-present");
  }

  if (params.tier === "core" && params.leverageScore >= 70) {
    reasons.push("core-pool-strong");
  }

  if (params.timingScore >= 70) {
    reasons.push("active-pipeline-healthy");
  }

  if (params.reuseProgramScore >= 72) {
    reasons.push("reuse-potential-high");
  }

  if (params.strategyScore >= 78) {
    reasons.push("strategy-priority-high");
  }

  if (params.portfolioHealth === "strong" || params.portfolioHealth === "healthy") {
    reasons.push("portfolio-health-strong");
  }

  if (params.tier === "watch") {
    reasons.push("watch-pool-heavy");
  }

  if (params.tier === "archive") {
    reasons.push("archive-load-high");
  }

  if (params.pointCount < 2) {
    reasons.push("proof-base-thin");
  }

  if (params.timingScore >= 60 && params.strategyScore >= 60) {
    reasons.push("development-surface-open");
  }

  return dedupeReasons(reasons);
}

function getItemStrongestReason(params: {
  reasons: FamilyStrategyReason[];
  tier: string | null;
  strategyScore: number;
  protectionScore: number;
  reuseProgramScore: number;
  pointCount: number;
}): FamilyStrategyReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (params.pointCount < 2 && reasons.includes("proof-base-thin")) {
    return "proof-base-thin";
  }

  if (
    params.tier === "signature" &&
    params.protectionScore >= 80 &&
    reasons.includes("signature-anchor-present")
  ) {
    return "signature-anchor-present";
  }

  if (params.strategyScore >= 78 && reasons.includes("strategy-priority-high")) {
    return "strategy-priority-high";
  }

  if (params.reuseProgramScore >= 72 && reasons.includes("reuse-potential-high")) {
    return "reuse-potential-high";
  }

  return reasons[0] ?? null;
}

function buildStrategyItem(params: {
  familyId: string;
  portfolioItem: BuildFamilyStrategyParams["portfolioResult"] extends infer _ ? any : never;
  portfolioHealth: string | null;
  activeCount: number;
}): FamilyStrategyItem {
  const portfolioItem = params.portfolioItem;
  const recommendationResult = portfolioItem?.recommendationResult ?? null;
  const discoveryResult = recommendationResult?.discoveryResult ?? null;
  const signalResult = discoveryResult?.signalResult ?? null;

  const leverageScore = getLeverageScore({
    portfolioScore: portfolioItem?.portfolioScore ?? null,
    strategicValueScore: portfolioItem?.strategicValueScore ?? null,
    recommendationScore: recommendationResult?.recommendationScore ?? null,
    rankingScore: discoveryResult?.rankingScore ?? null,
  });

  const protectionScore = getProtectionScore({
    tier: portfolioItem?.tier ?? null,
    portfolioScore: portfolioItem?.portfolioScore ?? null,
    resilienceScore: portfolioItem?.resilienceScore ?? null,
    preserveScore: recommendationResult?.preserveScore ?? null,
    confidenceScore: signalResult?.confidenceScore ?? null,
  });

  const timingScore = getTimingScore({
    recommendationPriority: recommendationResult?.recommendationPriority ?? null,
    momentumScore: signalResult?.momentumScore ?? null,
    urgencyScore: recommendationResult?.urgencyScore ?? null,
    sustainabilityScore: portfolioItem?.sustainabilityScore ?? null,
    portfolioHealth: params.portfolioHealth,
  });

  const reuseProgramScore = getReuseProgramScore({
    reusePriorityScore: discoveryResult?.reusePriorityScore ?? null,
    candidateScore: discoveryResult?.candidateScore ?? null,
    noveltyScore: discoveryResult?.noveltyScore ?? null,
    recommendationAction: recommendationResult?.recommendationAction ?? null,
    activeCount: params.activeCount,
  });

  const strategyScore = getStrategyScore({
    leverageScore,
    protectionScore,
    timingScore,
    reuseProgramScore,
  });

  const reasons = buildItemReasons({
    tier: portfolioItem?.tier ?? null,
    strategyScore,
    leverageScore,
    protectionScore,
    timingScore,
    reuseProgramScore,
    pointCount: signalResult?.confidenceHistoryResult?.pointCount ?? 0,
    portfolioHealth: params.portfolioHealth,
  });

  const strongestReason = getItemStrongestReason({
    reasons,
    tier: portfolioItem?.tier ?? null,
    strategyScore,
    protectionScore,
    reuseProgramScore,
    pointCount: signalResult?.confidenceHistoryResult?.pointCount ?? 0,
  });

  return {
    familyId: normalizeText(params.familyId),
    strategyScore,
    leverageScore,
    protectionScore,
    timingScore,
    reuseProgramScore,
    strategyAction:
      strategyScore >= 84
        ? "push-now"
        : protectionScore >= 84 && (portfolioItem?.tier ?? null) === "signature"
          ? "protect-and-hold"
          : reuseProgramScore >= 72
            ? "mine-for-reuse"
            : strategyScore >= 52
              ? "develop-gradually"
              : strategyScore >= 28
                ? "monitor-lightly"
                : "archive-strategically",
    strongestReason,
    reasons,
  };
}

function buildReasons(params: {
  strategyScore: number;
  portfolioHealth: string | null;
  signatureCount: number;
  coreCount: number;
  activeCount: number;
  watchCount: number;
  archiveCount: number;
  familyCount: number;
  reuseProgramScore: number;
  proofThinCount: number;
}): FamilyStrategyReason[] {
  const reasons: FamilyStrategyReason[] = [];

  if (params.signatureCount >= 1) {
    reasons.push("signature-anchor-present");
  }

  if (params.coreCount >= Math.max(1, Math.ceil(params.familyCount * 0.2))) {
    reasons.push("core-pool-strong");
  }

  if (params.activeCount >= Math.max(1, Math.ceil(params.familyCount * 0.25))) {
    reasons.push("active-pipeline-healthy");
  }

  if (params.reuseProgramScore >= 70) {
    reasons.push("reuse-potential-high");
  }

  if (params.strategyScore >= 78) {
    reasons.push("strategy-priority-high");
  }

  if (params.portfolioHealth === "strong" || params.portfolioHealth === "healthy") {
    reasons.push("portfolio-health-strong");
  }

  if (params.watchCount > params.activeCount && params.watchCount >= 2) {
    reasons.push("watch-pool-heavy");
  }

  if (params.archiveCount >= Math.max(2, Math.ceil(params.familyCount * 0.3))) {
    reasons.push("archive-load-high");
  }

  if (params.proofThinCount >= Math.max(1, Math.ceil(params.familyCount * 0.25))) {
    reasons.push("proof-base-thin");
  }

  if (params.activeCount + params.coreCount + params.signatureCount >= 2) {
    reasons.push("development-surface-open");
  }

  return dedupeReasons(reasons);
}

function getStrongestReason(params: {
  reasons: FamilyStrategyReason[];
  strategyScore: number;
  signatureCount: number;
  proofThinCount: number;
  familyCount: number;
  reuseProgramScore: number;
}): FamilyStrategyReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (
    params.proofThinCount >= Math.max(1, Math.ceil(params.familyCount * 0.25)) &&
    reasons.includes("proof-base-thin")
  ) {
    return "proof-base-thin";
  }

  if (params.signatureCount >= 1 && reasons.includes("signature-anchor-present")) {
    return "signature-anchor-present";
  }

  if (params.strategyScore >= 78 && reasons.includes("strategy-priority-high")) {
    return "strategy-priority-high";
  }

  if (params.reuseProgramScore >= 70 && reasons.includes("reuse-potential-high")) {
    return "reuse-potential-high";
  }

  return reasons[0] ?? null;
}

export function buildFamilyStrategy(
  params: BuildFamilyStrategyParams
): FamilyStrategyResult {
  const portfolioResult = params.portfolioResult ?? null;
  const portfolioItems = portfolioResult?.items ?? [];
  const portfolioHealth = portfolioResult?.portfolioHealth ?? null;
  const activeCount = portfolioResult?.activeCount ?? 0;

  const items = sortStrategyItems(
    portfolioItems.map((portfolioItem) =>
      buildStrategyItem({
        familyId: portfolioItem.familyId,
        portfolioItem,
        portfolioHealth,
        activeCount,
      })
    )
  );

  const strategyScore = round1(average(items.map((item) => item.strategyScore)));
  const leverageScore = round1(average(items.map((item) => item.leverageScore)));
  const protectionScore = round1(average(items.map((item) => item.protectionScore)));
  const timingScore = round1(average(items.map((item) => item.timingScore)));
  const reuseProgramScore = round1(
    average(items.map((item) => item.reuseProgramScore))
  );

  const proofThinCount = items.filter(
    (item) => item.reasons.includes("proof-base-thin")
  ).length;

  const reasons = buildReasons({
    strategyScore,
    portfolioHealth,
    signatureCount: portfolioResult?.signatureCount ?? 0,
    coreCount: portfolioResult?.coreCount ?? 0,
    activeCount: portfolioResult?.activeCount ?? 0,
    watchCount: portfolioResult?.watchCount ?? 0,
    archiveCount: portfolioResult?.archiveCount ?? 0,
    familyCount: portfolioResult?.familyCount ?? 0,
    reuseProgramScore,
    proofThinCount,
  });

  const strongestReason = getStrongestReason({
    reasons,
    strategyScore,
    signatureCount: portfolioResult?.signatureCount ?? 0,
    proofThinCount,
    familyCount: portfolioResult?.familyCount ?? 0,
    reuseProgramScore,
  });

  const strategyAction = getStrategyAction({
    strategyScore,
    protectionScore,
    timingScore,
    reuseProgramScore,
    signatureCount: portfolioResult?.signatureCount ?? 0,
    coreCount: portfolioResult?.coreCount ?? 0,
    portfolioHealth,
  });

  return {
    familyCount: portfolioResult?.familyCount ?? 0,
    strategyScore,
    leverageScore,
    protectionScore,
    timingScore,
    reuseProgramScore,
    strategyAction,
    strategyHorizon: getStrategyHorizon(strategyScore),
    strongestReason,
    reasons,
    portfolioResult,
    topPriorityFamilyIds: items.slice(0, 10).map((item) => item.familyId),
    protectedFamilyIds: items
      .filter(
        (item) =>
          item.strategyAction === "protect-and-hold" ||
          item.strategyAction === "push-now"
      )
      .map((item) => item.familyId),
    reuseCandidateFamilyIds: items
      .filter((item) => item.strategyAction === "mine-for-reuse")
      .map((item) => item.familyId),
    archiveCandidateFamilyIds: items
      .filter((item) => item.strategyAction === "archive-strategically")
      .map((item) => item.familyId),
    items,
  };
}