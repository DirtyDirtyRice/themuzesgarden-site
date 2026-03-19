import type {
  BuildFamilySignalParams,
  FamilySignalReason,
  FamilySignalResult,
} from "./playerMomentFamilySignal.types";

import {
  average,
  clamp100,
  dedupeReasons,
  getReuseReadiness,
  getSignalStrength,
  normalizeText,
  round1,
} from "./playerMomentFamilySignal.shared";

function getKnownAverage(values: Array<number | null | undefined>): number | null {
  const clean = values.filter((value) => Number.isFinite(Number(value)));
  if (!clean.length) return null;
  return round1(clamp100(average(clean)));
}

function getStabilityIndex(params: {
  trustScore: number | null;
  volatilityScore: number | null;
  reliabilityScore: number | null;
  averageVolatilityScore: number | null;
}): number {
  const trustComponent = params.trustScore ?? 0;
  const stabilityFromVolatility = 100 - (params.volatilityScore ?? 100);
  const reliabilityComponent = params.reliabilityScore ?? 0;
  const historyVolatilityComponent = 100 - (params.averageVolatilityScore ?? 100);

  return round1(
    clamp100(
      trustComponent * 0.34 +
        stabilityFromVolatility * 0.28 +
        reliabilityComponent * 0.24 +
        historyVolatilityComponent * 0.14
    )
  );
}

function getMomentumScore(params: {
  trustDelta: number | null;
  recoveryDelta: number | null;
  reliabilityDelta: number | null;
  volatilityDelta: number | null;
  lineageDirection: string | null;
  trustTrend: string | null;
  reliabilityTrend: string | null;
}): number {
  const trustDelta = Number(params.trustDelta ?? 0);
  const recoveryDelta = Number(params.recoveryDelta ?? 0);
  const reliabilityDelta = Number(params.reliabilityDelta ?? 0);
  const volatilityDelta = Number(params.volatilityDelta ?? 0);

  let score =
    50 +
    trustDelta * 1.8 +
    recoveryDelta * 1.1 +
    reliabilityDelta * 1.5 -
    Math.max(0, volatilityDelta) * 1.4 +
    Math.max(0, -volatilityDelta) * 0.6;

  if (params.lineageDirection === "improving") score += 8;
  if (params.lineageDirection === "declining") score -= 10;
  if (params.lineageDirection === "volatile") score -= 12;

  if (params.trustTrend === "improving") score += 6;
  if (params.trustTrend === "declining") score -= 6;
  if (params.trustTrend === "volatile") score -= 8;

  if (params.reliabilityTrend === "improving") score += 5;
  if (params.reliabilityTrend === "declining") score -= 5;
  if (params.reliabilityTrend === "volatile") score -= 7;

  return round1(clamp100(score));
}

function getMaturityScore(params: {
  trustScore: number | null;
  stabilityIndex: number;
  signalHistoryScore: number | null;
  snapshotCount: number;
  pointCount: number;
  lineageDirection: string | null;
}): number {
  const historyDepthScore = Math.min(
    100,
    params.snapshotCount * 10 + params.pointCount * 8
  );

  let score =
    (params.trustScore ?? 0) * 0.28 +
    params.stabilityIndex * 0.32 +
    (params.signalHistoryScore ?? 0) * 0.2 +
    historyDepthScore * 0.2;

  if (params.lineageDirection === "improving") score += 6;
  if (params.lineageDirection === "volatile") score -= 10;
  if (params.lineageDirection === "declining") score -= 8;

  return round1(clamp100(score));
}

function getReuseReadinessScore(params: {
  trustScore: number | null;
  stabilityIndex: number;
  maturityScore: number;
  repairOpportunityScore: number | null;
  volatilityScore: number | null;
}): number {
  return round1(
    clamp100(
      (params.trustScore ?? 0) * 0.32 +
        params.stabilityIndex * 0.3 +
        params.maturityScore * 0.22 +
        (params.repairOpportunityScore ?? 0) * 0.08 +
        (100 - (params.volatilityScore ?? 100)) * 0.08
    )
  );
}

function getDiscoveryScore(params: {
  signalScore: number;
  maturityScore: number;
  reuseReadinessScore: number;
  confidenceScore: number;
  momentumScore: number;
}): number {
  return round1(
    clamp100(
      params.signalScore * 0.28 +
        params.maturityScore * 0.24 +
        params.reuseReadinessScore * 0.22 +
        params.confidenceScore * 0.16 +
        params.momentumScore * 0.1
    )
  );
}

function buildReasons(params: {
  trustScore: number | null;
  stabilityIndex: number;
  confidenceScore: number;
  momentumScore: number;
  reuseReadinessScore: number;
  volatilityScore: number | null;
  repairOpportunityScore: number | null;
  trustLevel: string | null;
  lineageDirection: string | null;
  volatilityTrend: string | null;
  pointCount: number;
}): FamilySignalReason[] {
  const reasons: FamilySignalReason[] = [];

  if ((params.trustScore ?? 0) >= 78 || params.trustLevel === "strong") {
    reasons.push("strong-trust-foundation");
  }

  if (params.confidenceScore >= 72) {
    reasons.push("healthy-confidence-history");
  }

  if (params.lineageDirection === "improving" || params.momentumScore >= 68) {
    reasons.push("lineage-improving");
  }

  if ((params.volatilityScore ?? 100) <= 35 && params.stabilityIndex >= 70) {
    reasons.push("low-volatility-pattern");
  }

  if (params.reuseReadinessScore >= 78) {
    reasons.push("high-reuse-readiness");
  }

  if ((params.trustScore ?? 100) < 50 || params.trustLevel === "fragile" || params.trustLevel === "broken") {
    reasons.push("trust-fragile");
  }

  if (params.lineageDirection === "declining") {
    reasons.push("lineage-declining");
  }

  if (
    params.lineageDirection === "volatile" ||
    params.volatilityTrend === "volatile" ||
    (params.volatilityScore ?? 0) >= 65
  ) {
    reasons.push("confidence-volatile");
  }

  if ((params.repairOpportunityScore ?? 0) >= 70 && (params.trustScore ?? 100) < 65) {
    reasons.push("repair-pressure-high");
  }

  if (params.pointCount < 2) {
    reasons.push("insufficient-history");
  }

  return dedupeReasons(reasons);
}

function getStrongestReason(params: {
  reasons: FamilySignalReason[];
  trustScore: number | null;
  confidenceScore: number;
  stabilityIndex: number;
  reuseReadinessScore: number;
  lineageDirection: string | null;
  pointCount: number;
}): FamilySignalReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (params.pointCount < 2 && reasons.includes("insufficient-history")) {
    return "insufficient-history";
  }

  if ((params.trustScore ?? 100) < 50 && reasons.includes("trust-fragile")) {
    return "trust-fragile";
  }

  if (
    params.lineageDirection === "declining" &&
    reasons.includes("lineage-declining")
  ) {
    return "lineage-declining";
  }

  if (
    params.lineageDirection === "volatile" &&
    reasons.includes("confidence-volatile")
  ) {
    return "confidence-volatile";
  }

  if (
    params.reuseReadinessScore >= 78 &&
    reasons.includes("high-reuse-readiness")
  ) {
    return "high-reuse-readiness";
  }

  if (
    params.stabilityIndex >= 75 &&
    reasons.includes("low-volatility-pattern")
  ) {
    return "low-volatility-pattern";
  }

  if (
    params.confidenceScore >= 72 &&
    reasons.includes("healthy-confidence-history")
  ) {
    return "healthy-confidence-history";
  }

  if (
    (params.trustScore ?? 0) >= 78 &&
    reasons.includes("strong-trust-foundation")
  ) {
    return "strong-trust-foundation";
  }

  return reasons[0] ?? null;
}

export function buildFamilySignal(
  params: BuildFamilySignalParams
): FamilySignalResult {
  const familyId = normalizeText(params.familyId);

  const trustState = params.trustState ?? null;
  const lineageResult = params.lineageResult ?? null;
  const confidenceHistoryResult = params.confidenceHistoryResult ?? null;

  const trustScore = trustState?.trustScore ?? null;
  const recoveryScore = trustState?.recoveryScore ?? null;
  const volatilityScore = trustState?.volatilityScore ?? null;
  const repairOpportunityScore = trustState?.repairOpportunityScore ?? null;

  const confidenceScore =
    getKnownAverage([
      confidenceHistoryResult?.averageReliabilityScore,
      confidenceHistoryResult?.latestPoint?.reliabilityScore,
      confidenceHistoryResult?.previousPoint?.reliabilityScore,
    ]) ?? 0;

  const stabilityIndex = getStabilityIndex({
    trustScore,
    volatilityScore,
    reliabilityScore: confidenceHistoryResult?.latestPoint?.reliabilityScore ?? null,
    averageVolatilityScore: confidenceHistoryResult?.averageVolatilityScore ?? null,
  });

  const momentumScore = getMomentumScore({
    trustDelta: lineageResult?.totalTrustDelta ?? null,
    recoveryDelta: lineageResult?.totalRecoveryDelta ?? null,
    reliabilityDelta: confidenceHistoryResult?.totalReliabilityDelta ?? null,
    volatilityDelta: lineageResult?.totalVolatilityDelta ?? null,
    lineageDirection: lineageResult?.direction ?? null,
    trustTrend: confidenceHistoryResult?.trustTrend ?? null,
    reliabilityTrend: confidenceHistoryResult?.reliabilityTrend ?? null,
  });

  const signalHistoryScore =
    getKnownAverage([
      confidenceHistoryResult?.averageTrustScore,
      confidenceHistoryResult?.averageRecoveryScore,
      confidenceHistoryResult?.averageReliabilityScore,
    ]) ?? 0;

  const maturityScore = getMaturityScore({
    trustScore,
    stabilityIndex,
    signalHistoryScore,
    snapshotCount: lineageResult?.snapshotCount ?? 0,
    pointCount: confidenceHistoryResult?.pointCount ?? 0,
    lineageDirection: lineageResult?.direction ?? null,
  });

  const reuseReadinessScore = getReuseReadinessScore({
    trustScore,
    stabilityIndex,
    maturityScore,
    repairOpportunityScore,
    volatilityScore,
  });

  const signalScore = round1(
    clamp100(
      (trustScore ?? 0) * 0.28 +
        stabilityIndex * 0.22 +
        confidenceScore * 0.2 +
        momentumScore * 0.12 +
        maturityScore * 0.1 +
        reuseReadinessScore * 0.08
    )
  );

  const discoveryScore = getDiscoveryScore({
    signalScore,
    maturityScore,
    reuseReadinessScore,
    confidenceScore,
    momentumScore,
  });

  const reasons = buildReasons({
    trustScore,
    stabilityIndex,
    confidenceScore,
    momentumScore,
    reuseReadinessScore,
    volatilityScore,
    repairOpportunityScore,
    trustLevel: trustState?.trustLevel ?? null,
    lineageDirection: lineageResult?.direction ?? null,
    volatilityTrend: confidenceHistoryResult?.volatilityTrend ?? null,
    pointCount: confidenceHistoryResult?.pointCount ?? 0,
  });

  const strongestReason = getStrongestReason({
    reasons,
    trustScore,
    confidenceScore,
    stabilityIndex,
    reuseReadinessScore,
    lineageDirection: lineageResult?.direction ?? null,
    pointCount: confidenceHistoryResult?.pointCount ?? 0,
  });

  return {
    familyId,
    signalScore,
    signalStrength: getSignalStrength(signalScore),
    maturityScore,
    reuseReadinessScore,
    discoveryScore,
    stabilityIndex,
    momentumScore,
    confidenceScore,
    strongestReason,
    reasons,
    reuseReadiness: getReuseReadiness(reuseReadinessScore),
    trustState,
    lineageResult,
    confidenceHistoryResult,
  };
}