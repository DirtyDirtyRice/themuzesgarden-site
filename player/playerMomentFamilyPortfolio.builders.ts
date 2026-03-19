import type {
  BuildFamilyPortfolioItemParams,
  BuildFamilyPortfolioParams,
  FamilyPortfolioItem,
  FamilyPortfolioReason,
  FamilyPortfolioResult,
} from "./playerMomentFamilyPortfolio.types";

import {
  average,
  clamp100,
  dedupeReasons,
  getPortfolioHealth,
  getPortfolioTier,
  normalizeText,
  round1,
  sortPortfolioItems,
} from "./playerMomentFamilyPortfolio.shared";

function getResilienceScore(params: {
  preserveScore: number | null;
  confidenceScore: number | null;
  trustScore: number | null;
  volatilityScore: number | null;
  pointCount: number;
}): number {
  return round1(
    clamp100(
      (params.preserveScore ?? 0) * 0.32 +
        (params.confidenceScore ?? 0) * 0.22 +
        (params.trustScore ?? 0) * 0.24 +
        Math.max(0, 100 - (params.volatilityScore ?? 100)) * 0.14 +
        Math.min(100, params.pointCount * 10) * 0.08
    )
  );
}

function getStrategicValueScore(params: {
  recommendationScore: number | null;
  reusePriorityScore: number | null;
  rankingScore: number | null;
  discoveryScore: number | null;
  signalScore: number | null;
}): number {
  return round1(
    clamp100(
      (params.recommendationScore ?? 0) * 0.28 +
        (params.reusePriorityScore ?? 0) * 0.24 +
        (params.rankingScore ?? 0) * 0.2 +
        (params.discoveryScore ?? 0) * 0.16 +
        (params.signalScore ?? 0) * 0.12
    )
  );
}

function getSustainabilityScore(params: {
  resilienceScore: number;
  maturityScore: number | null;
  momentumScore: number | null;
  volatilityScore: number | null;
  pointCount: number;
}): number {
  return round1(
    clamp100(
      params.resilienceScore * 0.34 +
        (params.maturityScore ?? 0) * 0.24 +
        Math.max(0, 100 - (params.volatilityScore ?? 100)) * 0.18 +
        Math.max(0, params.momentumScore ?? 0) * 0.14 +
        Math.min(100, params.pointCount * 9) * 0.1
    )
  );
}

function getTierScore(params: {
  portfolioScore: number;
  preserveScore: number | null;
  strategicValueScore: number;
  keeperStatus: string | null;
}): number {
  let score =
    params.portfolioScore * 0.46 +
    (params.preserveScore ?? 0) * 0.2 +
    params.strategicValueScore * 0.24;

  if (params.keeperStatus === "signature") score += 10;
  if (params.keeperStatus === "keeper") score += 5;

  return round1(clamp100(score));
}

function getPortfolioScore(params: {
  recommendationScore: number | null;
  resilienceScore: number;
  strategicValueScore: number;
  sustainabilityScore: number;
  urgencyScore: number | null;
}): number {
  return round1(
    clamp100(
      (params.recommendationScore ?? 0) * 0.26 +
        params.resilienceScore * 0.24 +
        params.strategicValueScore * 0.22 +
        params.sustainabilityScore * 0.2 +
        (params.urgencyScore ?? 0) * 0.08
    )
  );
}

function buildReasons(params: {
  tier: string;
  tierScore: number;
  portfolioScore: number;
  recommendationAction: string | null;
  recommendationPriority: string | null;
  rankingScore: number | null;
  reusePriorityScore: number | null;
  pointCount: number;
}): FamilyPortfolioReason[] {
  const reasons: FamilyPortfolioReason[] = [];

  if (params.tier === "signature") {
    reasons.push("signature-protected");
  }

  if (params.tier === "core") {
    reasons.push("core-family");
  }

  if (params.tier === "active" || params.recommendationAction === "develop") {
    reasons.push("active-development");
  }

  if (params.tier === "watch") {
    reasons.push("watch-candidate");
  }

  if (params.tier === "archive") {
    reasons.push("archive-candidate");
  }

  if (
    params.recommendationPriority === "critical" ||
    params.recommendationPriority === "high" ||
    params.portfolioScore >= 78
  ) {
    reasons.push("high-recommendation");
  }

  if ((params.rankingScore ?? 0) >= 74) {
    reasons.push("strong-discovery-support");
  }

  if ((params.reusePriorityScore ?? 0) >= 72) {
    reasons.push("reuse-value-high");
  }

  if (params.pointCount < 2) {
    reasons.push("proof-too-thin");
  }

  if (params.tierScore >= 88) {
    reasons.push("portfolio-anchor");
  }

  return dedupeReasons(reasons);
}

function getStrongestReason(params: {
  reasons: FamilyPortfolioReason[];
  tier: string;
  tierScore: number;
  recommendationPriority: string | null;
  pointCount: number;
  rankingScore: number | null;
  reusePriorityScore: number | null;
}): FamilyPortfolioReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (params.pointCount < 2 && reasons.includes("proof-too-thin")) {
    return "proof-too-thin";
  }

  if (params.tier === "signature" && reasons.includes("signature-protected")) {
    return "signature-protected";
  }

  if (params.tierScore >= 88 && reasons.includes("portfolio-anchor")) {
    return "portfolio-anchor";
  }

  if (
    (params.recommendationPriority === "critical" ||
      params.recommendationPriority === "high") &&
    reasons.includes("high-recommendation")
  ) {
    return "high-recommendation";
  }

  if ((params.rankingScore ?? 0) >= 74 && reasons.includes("strong-discovery-support")) {
    return "strong-discovery-support";
  }

  if ((params.reusePriorityScore ?? 0) >= 72 && reasons.includes("reuse-value-high")) {
    return "reuse-value-high";
  }

  return reasons[0] ?? null;
}

export function buildFamilyPortfolioItem(
  params: BuildFamilyPortfolioItemParams
): FamilyPortfolioItem {
  const familyId = normalizeText(params.familyId);
  const recommendationResult = params.recommendationResult ?? null;
  const discoveryResult = recommendationResult?.discoveryResult ?? null;
  const signalResult = discoveryResult?.signalResult ?? null;

  const recommendationScore = recommendationResult?.recommendationScore ?? null;
  const urgencyScore = recommendationResult?.urgencyScore ?? null;
  const preserveScore = recommendationResult?.preserveScore ?? null;
  const rankingScore = discoveryResult?.rankingScore ?? null;
  const reusePriorityScore = discoveryResult?.reusePriorityScore ?? null;
  const signalScore = signalResult?.signalScore ?? null;
  const maturityScore = signalResult?.maturityScore ?? null;
  const momentumScore = signalResult?.momentumScore ?? null;
  const confidenceScore = signalResult?.confidenceScore ?? null;
  const trustScore = signalResult?.trustState?.trustScore ?? null;
  const volatilityScore = signalResult?.trustState?.volatilityScore ?? null;
  const pointCount = signalResult?.confidenceHistoryResult?.pointCount ?? 0;

  const resilienceScore = getResilienceScore({
    preserveScore,
    confidenceScore,
    trustScore,
    volatilityScore,
    pointCount,
  });

  const strategicValueScore = getStrategicValueScore({
    recommendationScore,
    reusePriorityScore,
    rankingScore,
    discoveryScore: discoveryResult?.discoveryScore ?? null,
    signalScore,
  });

  const sustainabilityScore = getSustainabilityScore({
    resilienceScore,
    maturityScore,
    momentumScore,
    volatilityScore,
    pointCount,
  });

  const portfolioScore = getPortfolioScore({
    recommendationScore,
    resilienceScore,
    strategicValueScore,
    sustainabilityScore,
    urgencyScore,
  });

  const tierScore = getTierScore({
    portfolioScore,
    preserveScore,
    strategicValueScore,
    keeperStatus: discoveryResult?.keeperStatus ?? null,
  });

  const tier = getPortfolioTier(tierScore);

  const reasons = buildReasons({
    tier,
    tierScore,
    portfolioScore,
    recommendationAction: recommendationResult?.recommendationAction ?? null,
    recommendationPriority: recommendationResult?.recommendationPriority ?? null,
    rankingScore,
    reusePriorityScore,
    pointCount,
  });

  const strongestReason = getStrongestReason({
    reasons,
    tier,
    tierScore,
    recommendationPriority: recommendationResult?.recommendationPriority ?? null,
    pointCount,
    rankingScore,
    reusePriorityScore,
  });

  return {
    familyId,
    portfolioScore,
    tierScore,
    resilienceScore,
    strategicValueScore,
    sustainabilityScore,
    tier,
    strongestReason,
    reasons,
    recommendationResult,
  };
}

export function buildFamilyPortfolio(
  params: BuildFamilyPortfolioParams
): FamilyPortfolioResult {
  const items = sortPortfolioItems(
    (params.items ?? []).map((item) => buildFamilyPortfolioItem(item))
  );

  const signatureCount = items.filter((item) => item.tier === "signature").length;
  const coreCount = items.filter((item) => item.tier === "core").length;
  const activeCount = items.filter((item) => item.tier === "active").length;
  const watchCount = items.filter((item) => item.tier === "watch").length;
  const archiveCount = items.filter((item) => item.tier === "archive").length;

  const averagePortfolioScore = round1(average(items.map((item) => item.portfolioScore)));
  const averageResilienceScore = round1(average(items.map((item) => item.resilienceScore)));
  const averageStrategicValueScore = round1(
    average(items.map((item) => item.strategicValueScore))
  );
  const averageSustainabilityScore = round1(
    average(items.map((item) => item.sustainabilityScore))
  );

  return {
    familyCount: items.length,
    averagePortfolioScore,
    averageResilienceScore,
    averageStrategicValueScore,
    averageSustainabilityScore,
    portfolioHealth: getPortfolioHealth({
      averagePortfolioScore,
      signatureCount,
      coreCount,
      activeCount,
      familyCount: items.length,
    }),
    signatureCount,
    coreCount,
    activeCount,
    watchCount,
    archiveCount,
    topFamilyIds: items.slice(0, 10).map((item) => item.familyId),
    items,
  };
}