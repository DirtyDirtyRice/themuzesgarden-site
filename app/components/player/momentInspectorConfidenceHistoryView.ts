import type {
  ConfidenceHistoryPoint,
  ConfidenceHistoryResult,
  ConfidenceHistoryTrend,
} from "./playerMomentConfidenceHistory";

export type InspectorConfidenceHistoryRow = {
  revisionId: string;
  orderIndex: number;
  trustScore: number;
  trustLevel: string;
  reliabilityScore: number;
  recoveryScore: number;
  volatilityScore: number;
  strongestReason: string | null;
};

export type InspectorConfidenceHistoryView = {
  familyId: string;
  pointCount: number;
  trustTrend: ConfidenceHistoryTrend;
  recoveryTrend: ConfidenceHistoryTrend;
  volatilityTrend: ConfidenceHistoryTrend;
  reliabilityTrend: ConfidenceHistoryTrend;
  averageTrustScore: number;
  averageReliabilityScore: number;
  totalTrustDelta: number;
  totalReliabilityDelta: number;
  latestTrustScore: number | null;
  previousTrustScore: number | null;
  latestReliabilityScore: number | null;
  previousReliabilityScore: number | null;
  rows: InspectorConfidenceHistoryRow[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function clamp100(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function mapPoint(point: ConfidenceHistoryPoint): InspectorConfidenceHistoryRow {
  return {
    revisionId: normalizeText(point.revisionId) || "unknown",
    orderIndex: Number(point.orderIndex ?? 0),
    trustScore: clamp100(point.trustScore),
    trustLevel: normalizeText(point.trustLevel) || "unknown",
    reliabilityScore: clamp100(point.reliabilityScore),
    recoveryScore: clamp100(point.recoveryScore),
    volatilityScore: clamp100(point.volatilityScore),
    strongestReason: normalizeText(point.strongestReason) || null,
  };
}

export function buildInspectorConfidenceHistoryView(
  result: ConfidenceHistoryResult | null | undefined
): InspectorConfidenceHistoryView | null {
  if (!result) return null;

  const familyId = normalizeText(result.familyId);
  if (!familyId) return null;

  const rows = Array.isArray(result.points)
    ? [...result.points]
        .sort((a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0))
        .map(mapPoint)
    : [];

  return {
    familyId,
    pointCount: Number(result.pointCount ?? rows.length ?? 0),
    trustTrend: result.trustTrend,
    recoveryTrend: result.recoveryTrend,
    volatilityTrend: result.volatilityTrend,
    reliabilityTrend: result.reliabilityTrend,
    averageTrustScore: clamp100(result.averageTrustScore),
    averageReliabilityScore: clamp100(result.averageReliabilityScore),
    totalTrustDelta: Number(result.totalTrustDelta ?? 0),
    totalReliabilityDelta: Number(result.totalReliabilityDelta ?? 0),
    latestTrustScore:
      result.latestPoint?.trustScore != null ? clamp100(result.latestPoint.trustScore) : null,
    previousTrustScore:
      result.previousPoint?.trustScore != null ? clamp100(result.previousPoint.trustScore) : null,
    latestReliabilityScore:
      result.latestPoint?.reliabilityScore != null
        ? clamp100(result.latestPoint.reliabilityScore)
        : null,
    previousReliabilityScore:
      result.previousPoint?.reliabilityScore != null
        ? clamp100(result.previousPoint.reliabilityScore)
        : null,
    rows,
  };
}