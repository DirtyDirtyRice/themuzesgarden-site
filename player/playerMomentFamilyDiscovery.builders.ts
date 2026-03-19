import type {
  BuildFamilyDiscoveryParams,
  FamilyDiscoveryReason,
  FamilyDiscoveryResult,
} from "./playerMomentFamilyDiscovery.types";

import {
  average,
  clamp100,
  dedupeReasons,
  getDiscoveryRank,
  getKeeperStatus,
  getSurfaceStatus,
  normalizeText,
  round1,
} from "./playerMomentFamilyDiscovery.shared";

function getNoveltyScore(params: {
  signalScore: number | null;
  momentumScore: number | null;
  maturityScore: number | null;
  stabilityIndex: number | null;
}): number {
  const signal = params.signalScore ?? 0;
  const momentum = params.momentumScore ?? 0;
  const maturity = params.maturityScore ?? 0;
  const stability = params.stabilityIndex ?? 0;

  return round1(
    clamp100(
      momentum * 0.34 +
        signal * 0.24 +
        Math.max(0, 100 - maturity) * 0.22 +
        Math.max(0, 100 - stability) * 0.2
    )
  );
}

function getReusePriorityScore(params: {
  discoveryScore: number | null;
  reuseReadinessScore: number | null;
  stabilityIndex: number | null;
  trustScore: number | null;
}): number {
  return round1(
    clamp100(
      (params.discoveryScore ?? 0) * 0.28 +
        (params.reuseReadinessScore ?? 0) * 0.34 +
        (params.stabilityIndex ?? 0) * 0.2 +
        (params.trustScore ?? 0) * 0.18
    )
  );
}

function getKeeperScore(params: {
  signalScore: number | null;
  discoveryScore: number | null;
  maturityScore: number | null;
  confidenceScore: number | null;
  trustScore: number | null;
}): number {
  return round1(
    clamp100(
      (params.signalScore ?? 0) * 0.24 +
        (params.discoveryScore ?? 0) * 0.22 +
        (params.maturityScore ?? 0) * 0.24 +
        (params.confidenceScore ?? 0) * 0.14 +
        (params.trustScore ?? 0) * 0.16
    )
  );
}

function getRankingScore(params: {
  discoveryScore: number;
  keeperScore: number;
  reusePriorityScore: number;
  noveltyScore: number;
  candidateScore: number;
}): number {
  return round1(
    clamp100(
      params.discoveryScore * 0.3 +
        params.keeperScore * 0.24 +
        params.reusePriorityScore * 0.22 +
        params.candidateScore * 0.14 +
        params.noveltyScore * 0.1
    )
  );
}

function getCandidateScore(params: {
  signalScore: number | null;
  momentumScore: number | null;
  discoveryScore: number | null;
  pointCount: number;
  trustLevel: string | null;
}): number {
  let score = average([
    params.signalScore ?? 0,
    params.momentumScore ?? 0,
    params.discoveryScore ?? 0,
  ]);

  if (params.pointCount >= 3) score += 6;
  if (params.pointCount >= 5) score += 4;
  if (params.trustLevel === "strong") score += 8;
  if (params.trustLevel === "stable") score += 4;
  if (params.trustLevel === "fragile") score -= 8;
  if (params.trustLevel === "broken") score -= 14;

  return round1(clamp100(score));
}

function buildReasons(params: {
  signalScore: number | null;
  signalStrength: string | null;
  reuseReadiness: string | null;
  discoveryScore: number | null;
  maturityScore: number | null;
  momentumScore: number | null;
  volatilityScore: number | null;
  trustLevel: string | null;
  pointCount: number;
  keeperScore: number;
}): FamilyDiscoveryReason[] {
  const reasons: FamilyDiscoveryReason[] = [];

  if (params.signalScore != null && params.signalScore >= 78) {
    reasons.push("signal-strong");
  }

  if (params.signalStrength === "anchor") {
    reasons.push("signal-anchor");
  }

  if (
    params.reuseReadiness === "ready" ||
    params.reuseReadiness === "high-priority"
  ) {
    reasons.push("reuse-ready");
  }

  if ((params.discoveryScore ?? 0) >= 76) {
    reasons.push("discovery-score-high");
  }

  if ((params.maturityScore ?? 0) >= 74) {
    reasons.push("mature-pattern");
  }

  if ((params.momentumScore ?? 0) >= 68) {
    reasons.push("high-momentum");
  }

  if ((params.volatilityScore ?? 0) >= 65) {
    reasons.push("volatile-family");
  }

  if (params.trustLevel === "fragile" || params.trustLevel === "broken") {
    reasons.push("fragile-trust");
  }

  if (params.pointCount < 2) {
    reasons.push("insufficient-signal-history");
  }

  if (params.keeperScore >= 78) {
    reasons.push("keeper-candidate");
  }

  return dedupeReasons(reasons);
}

function getStrongestReason(params: {
  reasons: FamilyDiscoveryReason[];
  rankingScore: number;
  keeperScore: number;
  pointCount: number;
  trustLevel: string | null;
  signalStrength: string | null;
  reuseReadiness: string | null;
  volatilityScore: number | null;
}): FamilyDiscoveryReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (
    params.pointCount < 2 &&
    reasons.includes("insufficient-signal-history")
  ) {
    return "insufficient-signal-history";
  }

  if (
    (params.trustLevel === "fragile" || params.trustLevel === "broken") &&
    reasons.includes("fragile-trust")
  ) {
    return "fragile-trust";
  }

  if (
    (params.volatilityScore ?? 0) >= 65 &&
    reasons.includes("volatile-family")
  ) {
    return "volatile-family";
  }

  if (
    params.signalStrength === "anchor" &&
    reasons.includes("signal-anchor")
  ) {
    return "signal-anchor";
  }

  if (
    (params.reuseReadiness === "ready" ||
      params.reuseReadiness === "high-priority") &&
    reasons.includes("reuse-ready")
  ) {
    return "reuse-ready";
  }

  if (params.keeperScore >= 78 && reasons.includes("keeper-candidate")) {
    return "keeper-candidate";
  }

  if (params.rankingScore >= 78 && reasons.includes("discovery-score-high")) {
    return "discovery-score-high";
  }

  if (reasons.includes("signal-strong")) {
    return "signal-strong";
  }

  return reasons[0] ?? null;
}

export function buildFamilyDiscovery(
  params: BuildFamilyDiscoveryParams
): FamilyDiscoveryResult {
  const familyId = normalizeText(params.familyId);
  const signalResult = params.signalResult ?? null;

  const signalScore = signalResult?.signalScore ?? null;
  const discoveryScore = signalResult?.discoveryScore ?? null;
  const maturityScore = signalResult?.maturityScore ?? null;
  const stabilityIndex = signalResult?.stabilityIndex ?? null;
  const momentumScore = signalResult?.momentumScore ?? null;
  const confidenceScore = signalResult?.confidenceScore ?? null;
  const reuseReadinessScore = signalResult?.reuseReadinessScore ?? null;
  const trustScore = signalResult?.trustState?.trustScore ?? null;
  const trustLevel = signalResult?.trustState?.trustLevel ?? null;
  const volatilityScore = signalResult?.trustState?.volatilityScore ?? null;
  const pointCount = signalResult?.confidenceHistoryResult?.pointCount ?? 0;

  const noveltyScore = getNoveltyScore({
    signalScore,
    momentumScore,
    maturityScore,
    stabilityIndex,
  });

  const candidateScore = getCandidateScore({
    signalScore,
    momentumScore,
    discoveryScore,
    pointCount,
    trustLevel,
  });

  const reusePriorityScore = getReusePriorityScore({
    discoveryScore,
    reuseReadinessScore,
    stabilityIndex,
    trustScore,
  });

  const keeperScore = getKeeperScore({
    signalScore,
    discoveryScore,
    maturityScore,
    confidenceScore,
    trustScore,
  });

  const rankingScore = getRankingScore({
    discoveryScore: discoveryScore ?? 0,
    keeperScore,
    reusePriorityScore,
    noveltyScore,
    candidateScore,
  });

  const reasons = buildReasons({
    signalScore,
    signalStrength: signalResult?.signalStrength ?? null,
    reuseReadiness: signalResult?.reuseReadiness ?? null,
    discoveryScore,
    maturityScore,
    momentumScore,
    volatilityScore,
    trustLevel,
    pointCount,
    keeperScore,
  });

  const strongestReason = getStrongestReason({
    reasons,
    rankingScore,
    keeperScore,
    pointCount,
    trustLevel,
    signalStrength: signalResult?.signalStrength ?? null,
    reuseReadiness: signalResult?.reuseReadiness ?? null,
    volatilityScore,
  });

  return {
    familyId,
    discoveryScore: round1(clamp100(discoveryScore ?? 0)),
    reusePriorityScore,
    keeperScore,
    rankingScore,
    noveltyScore,
    candidateScore,
    discoveryRank: getDiscoveryRank(rankingScore),
    keeperStatus: getKeeperStatus(keeperScore),
    surfaceStatus: getSurfaceStatus(candidateScore),
    strongestReason,
    reasons,
    signalResult,
  };
}