import type {
  BuildConfidenceHistoryParams,
  BuildConfidenceHistoryPointParams,
  ConfidenceHistoryPoint,
  ConfidenceHistoryResult,
} from "./playerMomentConfidenceHistory.types";

import {
  average,
  clamp100,
  computeReliabilityScore,
  delta,
  normalizeText,
  round1,
  sortHistoryPoints,
  getTrend,
  getVolatilityTrend,
} from "./playerMomentConfidenceHistory.shared";

function normalizeOrderIndex(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

export function buildConfidenceHistoryPoint(
  params: BuildConfidenceHistoryPointParams
): ConfidenceHistoryPoint {
  const snapshot = params.snapshot;

  const reliabilityScore = computeReliabilityScore({
    trustScore: snapshot.trustScore,
    recoveryScore: snapshot.recoveryScore,
    volatilityScore: snapshot.volatilityScore,
  });

  return {
    familyId: normalizeText(snapshot.familyId),
    revisionId: normalizeText(snapshot.revisionId),
    orderIndex: normalizeOrderIndex(snapshot.orderIndex),
    trustScore: round1(clamp100(snapshot.trustScore)),
    trustLevel: snapshot.trustLevel,
    recoveryScore: round1(clamp100(snapshot.recoveryScore)),
    volatilityScore: round1(clamp100(snapshot.volatilityScore)),
    repairOpportunityScore: round1(clamp100(snapshot.repairOpportunityScore)),
    strongestReason: snapshot.strongestReason,
    reliabilityScore,
    sourceSnapshot: snapshot,
  };
}

export function buildMomentConfidenceHistory(
  params: BuildConfidenceHistoryParams
): ConfidenceHistoryResult {
  const familyId = normalizeText(params.familyId);

  const points = sortHistoryPoints(
    (params.snapshots ?? []).map((snapshot) =>
      buildConfidenceHistoryPoint({ snapshot })
    )
  );

  const firstPoint = points[0] ?? null;
  const latestPoint = points[points.length - 1] ?? null;
  const previousPoint = points[points.length - 2] ?? null;

  const averageTrustScore = round1(average(points.map((p) => p.trustScore)));
  const averageRecoveryScore = round1(average(points.map((p) => p.recoveryScore)));
  const averageVolatilityScore = round1(
    average(points.map((p) => p.volatilityScore))
  );
  const averageReliabilityScore = round1(
    average(points.map((p) => p.reliabilityScore))
  );

  const totalTrustDelta =
    firstPoint && latestPoint ? delta(firstPoint.trustScore, latestPoint.trustScore) : 0;

  const totalRecoveryDelta =
    firstPoint && latestPoint
      ? delta(firstPoint.recoveryScore, latestPoint.recoveryScore)
      : 0;

  const totalVolatilityDelta =
    firstPoint && latestPoint
      ? delta(firstPoint.volatilityScore, latestPoint.volatilityScore)
      : 0;

  const totalReliabilityDelta =
    firstPoint && latestPoint
      ? delta(firstPoint.reliabilityScore, latestPoint.reliabilityScore)
      : 0;

  const trustTrend = getTrend(totalTrustDelta, points.length);
  const recoveryTrend = getTrend(totalRecoveryDelta, points.length);
  const volatilityTrend = getVolatilityTrend(totalVolatilityDelta, points.length);
  const reliabilityTrend = getTrend(totalReliabilityDelta, points.length);

  return {
    familyId,
    pointCount: points.length,
    trustTrend,
    recoveryTrend,
    volatilityTrend,
    reliabilityTrend,
    latestPoint,
    previousPoint,
    averageTrustScore,
    averageRecoveryScore,
    averageVolatilityScore,
    averageReliabilityScore,
    totalTrustDelta,
    totalRecoveryDelta,
    totalVolatilityDelta,
    totalReliabilityDelta,
    points,
  };
}