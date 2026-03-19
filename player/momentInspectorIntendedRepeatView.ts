import type {
  IntendedRepeatFamilyPlan,
  IntendedRepeatPlacement,
} from "./playerMomentIntendedRepeat";

export type InspectorIntendedRepeatSummaryRow = {
  familyId: string;
  memberCount: number;
  repeatInterval: number | null;
  presentCount: number;
  nearCount: number;
  missingCount: number;
  strongestScore: number;
  averageScore: number;
};

export type InspectorIntendedRepeatPlacementRow = {
  familyId: string;
  expectedAt: number;
  nearestMomentId: string | null;
  nearestActualStart: number | null;
  deltaFromExpected: number | null;
  status: "present" | "near" | "missing";
  confidence: number;
};

export type InspectorIntendedRepeatView = {
  summaryRows: InspectorIntendedRepeatSummaryRow[];
  placementsByFamilyId: Record<string, InspectorIntendedRepeatPlacementRow[]>;
};

function clamp01(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round3(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(3));
}

function getStatusRank(status: "present" | "near" | "missing"): number {
  if (status === "missing") return 0;
  if (status === "near") return 1;
  return 2;
}

function getCoverageScore(row: InspectorIntendedRepeatSummaryRow): number {
  const total = row.presentCount + row.nearCount + row.missingCount;
  if (total <= 0) return 0;

  const weighted = row.presentCount * 1 + row.nearCount * 0.6;
  return weighted / total;
}

function getRepeatPriority(row: InspectorIntendedRepeatSummaryRow): number {
  const total = row.presentCount + row.nearCount + row.missingCount;
  const coverageScore = getCoverageScore(row);

  return Number(
    (
      row.missingCount * 4 +
      row.nearCount * 2 +
      Math.max(0, row.memberCount - 1) * 1.25 +
      (1 - coverageScore) * 3 +
      row.strongestScore * 1.5 +
      row.averageScore * 1.5 +
      (total > 0 ? 1 : 0)
    ).toFixed(3)
  );
}

function toPlacementRow(
  placement: IntendedRepeatPlacement
): InspectorIntendedRepeatPlacementRow {
  return {
    familyId: normalizeText(placement.familyId),
    expectedAt: Number(placement.expectedAt ?? 0),
    nearestMomentId: normalizeText(placement.nearestMomentId) || null,
    nearestActualStart: round3(toNumberOrNull(placement.nearestActualStart)),
    deltaFromExpected: round3(toNumberOrNull(placement.deltaFromExpected)),
    status: placement.status,
    confidence: clamp01(placement.confidence),
  };
}

export function buildInspectorIntendedRepeatView(
  plans: IntendedRepeatFamilyPlan[]
): InspectorIntendedRepeatView {
  const summaryRows: InspectorIntendedRepeatSummaryRow[] = [];
  const placementsByFamilyId: Record<string, InspectorIntendedRepeatPlacementRow[]> = {};

  for (const plan of plans) {
    const familyId = normalizeText(plan.familyId);
    if (!familyId) continue;

    const summaryRow: InspectorIntendedRepeatSummaryRow = {
      familyId,
      memberCount: Math.max(0, Number(plan.memberCount ?? 0)),
      repeatInterval: round3(toNumberOrNull(plan.repeatInterval)),
      presentCount: Math.max(0, Number(plan.presentCount ?? 0)),
      nearCount: Math.max(0, Number(plan.nearCount ?? 0)),
      missingCount: Math.max(0, Number(plan.missingCount ?? 0)),
      strongestScore: clamp01(plan.strongestScore),
      averageScore: clamp01(plan.averageScore),
    };

    summaryRows.push(summaryRow);

    placementsByFamilyId[familyId] = Array.isArray(plan.expectedPlacements)
      ? plan.expectedPlacements.map(toPlacementRow)
      : [];
  }

  summaryRows.sort((a, b) => {
    const priorityA = getRepeatPriority(a);
    const priorityB = getRepeatPriority(b);

    if (priorityB !== priorityA) return priorityB - priorityA;
    if (b.missingCount !== a.missingCount) return b.missingCount - a.missingCount;
    if (b.nearCount !== a.nearCount) return b.nearCount - a.nearCount;
    if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
    if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
    if (b.strongestScore !== a.strongestScore) return b.strongestScore - a.strongestScore;

    return a.familyId.localeCompare(b.familyId);
  });

  for (const familyId of Object.keys(placementsByFamilyId)) {
    placementsByFamilyId[familyId] = placementsByFamilyId[familyId]
      .slice()
      .sort((a, b) => {
        const statusCompare = getStatusRank(a.status) - getStatusRank(b.status);
        if (statusCompare !== 0) return statusCompare;

        const deltaA = Math.abs(a.deltaFromExpected ?? 0);
        const deltaB = Math.abs(b.deltaFromExpected ?? 0);
        if (deltaB !== deltaA) return deltaB - deltaA;

        if (b.confidence !== a.confidence) return b.confidence - a.confidence;

        return a.expectedAt - b.expectedAt;
      });
  }

  return {
    summaryRows,
    placementsByFamilyId,
  };
}