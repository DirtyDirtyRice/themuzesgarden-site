import type {
  BuildFamilyRecommendationParams,
  FamilyRecommendationReason,
  FamilyRecommendationResult,
} from "./playerMomentFamilyRecommendation.types";

import {
  average,
  clamp100,
  dedupeReasons,
  getRecommendationAction,
  getRecommendationPriority,
  normalizeText,
  round1,
} from "./playerMomentFamilyRecommendation.shared";

function getPreserveScore(params: {
  keeperScore: number | null;
  rankingScore: number | null;
  signalScore: number | null;
  maturityScore: number | null;
  trustScore: number | null;
}): number {
  return round1(
    clamp100(
      (params.keeperScore ?? 0) * 0.3 +
        (params.rankingScore ?? 0) * 0.2 +
        (params.signalScore ?? 0) * 0.18 +
        (params.maturityScore ?? 0) * 0.18 +
        (params.trustScore ?? 0) * 0.14
    )
  );
}

function getInvestmentScore(params: {
  reusePriorityScore: number | null;
  candidateScore: number | null;
  noveltyScore: number | null;
  momentumScore: number | null;
  discoveryScore: number | null;
}): number {
  return round1(
    clamp100(
      (params.reusePriorityScore ?? 0) * 0.28 +
        (params.candidateScore ?? 0) * 0.24 +
        (params.noveltyScore ?? 0) * 0.18 +
        (params.momentumScore ?? 0) * 0.14 +
        (params.discoveryScore ?? 0) * 0.16
    )
  );
}

function getUrgencyScore(params: {
  rankingScore: number | null;
  surfaceStatus: string | null;
  discoveryRank: string | null;
  volatilityScore: number | null;
  momentumScore: number | null;
  pointCount: number;
}): number {
  let score =
    (params.rankingScore ?? 0) * 0.38 +
    (params.momentumScore ?? 0) * 0.2 +
    Math.max(0, 100 - (params.volatilityScore ?? 100)) * 0.16 +
    Math.min(100, params.pointCount * 12) * 0.08;

  if (params.surfaceStatus === "surface-now") score += 12;
  if (params.surfaceStatus === "candidate") score += 6;

  if (params.discoveryRank === "priority") score += 12;
  if (params.discoveryRank === "high") score += 6;

  return round1(clamp100(score));
}

function getRecommendationScore(params: {
  preserveScore: number;
  investmentScore: number;
  urgencyScore: number;
  rankingScore: number | null;
  keeperScore: number | null;
}): number {
  return round1(
    clamp100(
      params.preserveScore * 0.28 +
        params.investmentScore * 0.26 +
        params.urgencyScore * 0.18 +
        (params.rankingScore ?? 0) * 0.16 +
        (params.keeperScore ?? 0) * 0.12
    )
  );
}

function getActionScore(params: {
  recommendationScore: number;
  investmentScore: number;
  urgencyScore: number;
  preserveScore: number;
}): number {
  return round1(
    clamp100(
      params.recommendationScore * 0.42 +
        params.investmentScore * 0.24 +
        params.urgencyScore * 0.2 +
        params.preserveScore * 0.14
    )
  );
}

function buildReasons(params: {
  recommendationScore: number;
  preserveScore: number;
  investmentScore: number;
  urgencyScore: number;
  keeperStatus: string | null;
  surfaceStatus: string | null;
  reusePriorityScore: number | null;
  discoveryRank: string | null;
  confidenceScore: number | null;
  candidateScore: number | null;
  noveltyScore: number | null;
  pointCount: number;
}): FamilyRecommendationReason[] {
  const reasons: FamilyRecommendationReason[] = [];

  if (params.keeperStatus === "signature" || params.preserveScore >= 88) {
    reasons.push("signature-family");
  }

  if (params.keeperStatus === "keeper" || params.preserveScore >= 76) {
    reasons.push("keeper-worthy");
  }

  if (params.surfaceStatus === "surface-now" || params.urgencyScore >= 76) {
    reasons.push("surface-immediately");
  }

  if ((params.reusePriorityScore ?? 0) >= 74 || params.investmentScore >= 72) {
    reasons.push("reuse-opportunity-high");
  }

  if (
    params.discoveryRank === "priority" ||
    params.discoveryRank === "high" ||
    params.recommendationScore >= 78
  ) {
    reasons.push("strong-discovery-rank");
  }

  if ((params.confidenceScore ?? 0) >= 72) {
    reasons.push("high-confidence-pattern");
  }

  if ((params.candidateScore ?? 0) >= 60 || params.investmentScore >= 58) {
    reasons.push("development-candidate");
  }

  if ((params.noveltyScore ?? 0) >= 62 && params.pointCount >= 2) {
    reasons.push("volatile-but-interesting");
  }

  if (params.pointCount < 2) {
    reasons.push("insufficient-proof");
  }

  if (params.recommendationScore < 28 && params.pointCount >= 1) {
    reasons.push("archive-for-later");
  }

  return dedupeReasons(reasons);
}

function getStrongestReason(params: {
  reasons: FamilyRecommendationReason[];
  keeperStatus: string | null;
  surfaceStatus: string | null;
  reusePriorityScore: number | null;
  discoveryRank: string | null;
  confidenceScore: number | null;
  pointCount: number;
  recommendationScore: number;
}): FamilyRecommendationReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (params.pointCount < 2 && reasons.includes("insufficient-proof")) {
    return "insufficient-proof";
  }

  if (params.keeperStatus === "signature" && reasons.includes("signature-family")) {
    return "signature-family";
  }

  if (params.surfaceStatus === "surface-now" && reasons.includes("surface-immediately")) {
    return "surface-immediately";
  }

  if ((params.reusePriorityScore ?? 0) >= 74 && reasons.includes("reuse-opportunity-high")) {
    return "reuse-opportunity-high";
  }

  if (
    (params.discoveryRank === "priority" || params.discoveryRank === "high") &&
    reasons.includes("strong-discovery-rank")
  ) {
    return "strong-discovery-rank";
  }

  if ((params.confidenceScore ?? 0) >= 72 && reasons.includes("high-confidence-pattern")) {
    return "high-confidence-pattern";
  }

  if (params.recommendationScore < 28 && reasons.includes("archive-for-later")) {
    return "archive-for-later";
  }

  return reasons[0] ?? null;
}

export function buildFamilyRecommendation(
  params: BuildFamilyRecommendationParams
): FamilyRecommendationResult {
  const familyId = normalizeText(params.familyId);
  const discoveryResult = params.discoveryResult ?? null;

  const signalResult = discoveryResult?.signalResult ?? null;

  const rankingScore = discoveryResult?.rankingScore ?? null;
  const keeperScore = discoveryResult?.keeperScore ?? null;
  const reusePriorityScore = discoveryResult?.reusePriorityScore ?? null;
  const candidateScore = discoveryResult?.candidateScore ?? null;
  const noveltyScore = discoveryResult?.noveltyScore ?? null;
  const discoveryScore = discoveryResult?.discoveryScore ?? null;

  const signalScore = signalResult?.signalScore ?? null;
  const maturityScore = signalResult?.maturityScore ?? null;
  const momentumScore = signalResult?.momentumScore ?? null;
  const confidenceScore = signalResult?.confidenceScore ?? null;
  const trustScore = signalResult?.trustState?.trustScore ?? null;
  const volatilityScore = signalResult?.trustState?.volatilityScore ?? null;
  const pointCount = signalResult?.confidenceHistoryResult?.pointCount ?? 0;

  const preserveScore = getPreserveScore({
    keeperScore,
    rankingScore,
    signalScore,
    maturityScore,
    trustScore,
  });

  const investmentScore = getInvestmentScore({
    reusePriorityScore,
    candidateScore,
    noveltyScore,
    momentumScore,
    discoveryScore,
  });

  const urgencyScore = getUrgencyScore({
    rankingScore,
    surfaceStatus: discoveryResult?.surfaceStatus ?? null,
    discoveryRank: discoveryResult?.discoveryRank ?? null,
    volatilityScore,
    momentumScore,
    pointCount,
  });

  const recommendationScore = getRecommendationScore({
    preserveScore,
    investmentScore,
    urgencyScore,
    rankingScore,
    keeperScore,
  });

  const actionScore = getActionScore({
    recommendationScore,
    investmentScore,
    urgencyScore,
    preserveScore,
  });

  const reasons = buildReasons({
    recommendationScore,
    preserveScore,
    investmentScore,
    urgencyScore,
    keeperStatus: discoveryResult?.keeperStatus ?? null,
    surfaceStatus: discoveryResult?.surfaceStatus ?? null,
    reusePriorityScore,
    discoveryRank: discoveryResult?.discoveryRank ?? null,
    confidenceScore,
    candidateScore,
    noveltyScore,
    pointCount,
  });

  const strongestReason = getStrongestReason({
    reasons,
    keeperStatus: discoveryResult?.keeperStatus ?? null,
    surfaceStatus: discoveryResult?.surfaceStatus ?? null,
    reusePriorityScore,
    discoveryRank: discoveryResult?.discoveryRank ?? null,
    confidenceScore,
    pointCount,
    recommendationScore,
  });

  const recommendationAction = getRecommendationAction({
    recommendationScore,
    preserveScore,
    investmentScore,
    urgencyScore,
    keeperStatus: discoveryResult?.keeperStatus ?? null,
    surfaceStatus: discoveryResult?.surfaceStatus ?? null,
  });

  return {
    familyId,
    recommendationScore,
    actionScore,
    preserveScore,
    investmentScore,
    urgencyScore,
    recommendationAction,
    recommendationPriority: getRecommendationPriority(actionScore),
    strongestReason,
    reasons,
    discoveryResult,
  };
}