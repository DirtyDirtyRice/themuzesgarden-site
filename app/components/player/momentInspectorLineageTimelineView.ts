import type {
  FamilyLineageDirection,
  FamilyLineageResult,
  FamilyLineageSnapshot,
} from "./playerMomentFamilyLineage";

export type InspectorLineageTimelineRow = {
  revisionId: string;
  orderIndex: number;
  trustScore: number;
  trustLevel: string;
  recoveryScore: number;
  volatilityScore: number;
  repairOpportunityScore: number;
  strongestReason: string | null;
};

export type InspectorLineageTimelineView = {
  familyId: string;
  direction: FamilyLineageDirection;
  snapshotCount: number;
  totalTrustDelta: number;
  latestTrustScore: number | null;
  previousTrustScore: number | null;
  rows: InspectorLineageTimelineRow[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function clamp100(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 0;
  return n;
}

function mapSnapshot(snapshot: FamilyLineageSnapshot): InspectorLineageTimelineRow {
  return {
    revisionId: normalizeText(snapshot.revisionId) || "unknown",
    orderIndex: Number(snapshot.orderIndex ?? 0),
    trustScore: clamp100(snapshot.trustScore),
    trustLevel: normalizeText(snapshot.trustLevel) || "unknown",
    recoveryScore: clamp100(snapshot.recoveryScore),
    volatilityScore: clamp100(snapshot.volatilityScore),
    repairOpportunityScore: clamp100(snapshot.repairOpportunityScore),
    strongestReason: normalizeText(snapshot.strongestReason) || null,
  };
}

export function buildInspectorLineageTimelineView(
  lineageResult: FamilyLineageResult | null | undefined
): InspectorLineageTimelineView | null {
  if (!lineageResult) return null;

  const familyId = normalizeText(lineageResult.familyId);
  if (!familyId) return null;

  const rows = Array.isArray(lineageResult.snapshots)
    ? [...lineageResult.snapshots]
        .sort((a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0))
        .map(mapSnapshot)
    : [];

  return {
    familyId,
    direction: lineageResult.direction,
    snapshotCount: Number(lineageResult.snapshotCount ?? rows.length ?? 0),
    totalTrustDelta: Number(lineageResult.totalTrustDelta ?? 0),
    latestTrustScore:
      lineageResult.latestSnapshot?.trustScore != null
        ? clamp100(lineageResult.latestSnapshot.trustScore)
        : null,
    previousTrustScore:
      lineageResult.previousSnapshot?.trustScore != null
        ? clamp100(lineageResult.previousSnapshot.trustScore)
        : null,
    rows,
  };
}