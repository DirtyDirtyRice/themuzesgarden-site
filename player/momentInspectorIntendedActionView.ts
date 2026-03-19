import type {
  IntendedActionCandidate,
  IntendedActionPlan,
  IntendedActionType,
} from "./playerMomentIntendedActions";

export type InspectorIntendedActionSummaryRow = {
  familyId: string;
  totalActions: number;
  missingActions: number;
  nearActions: number;
  presentActions: number;
  topConfidence: number;
};

export type InspectorIntendedActionRow = {
  familyId: string;
  actionType: IntendedActionType;
  targetExpectedAt: number;
  sourceMomentId: string | null;
  anchorMomentId: string | null;
  nearestMomentId: string | null;
  status: "present" | "near" | "missing";
  confidence: number;
  reason: string;
};

export type InspectorIntendedActionView = {
  summaryRows: InspectorIntendedActionSummaryRow[];
  actionsByFamilyId: Record<string, InspectorIntendedActionRow[]>;
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

function normalizeTime(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function getStatusRank(status: "present" | "near" | "missing"): number {
  if (status === "missing") return 0;
  if (status === "near") return 1;
  return 2;
}

function getActionTypeRank(actionType: IntendedActionType): number {
  if (actionType === "fill-missing-occurrence") return 0;
  if (actionType === "tighten-near-occurrence") return 1;
  if (actionType === "reuse-anchor-phrase") return 2;
  return 3;
}

function getActionPriority(row: InspectorIntendedActionRow): number {
  const statusWeight =
    row.status === "missing" ? 5 : row.status === "near" ? 3 : 1;

  const actionWeight =
    row.actionType === "fill-missing-occurrence"
      ? 3
      : row.actionType === "tighten-near-occurrence"
        ? 2
        : row.actionType === "reuse-anchor-phrase"
          ? 1.5
          : 1;

  return Number((statusWeight + actionWeight + row.confidence * 2).toFixed(3));
}

function toActionRow(action: IntendedActionCandidate): InspectorIntendedActionRow {
  return {
    familyId: normalizeText(action.familyId),
    actionType: action.actionType,
    targetExpectedAt: normalizeTime(action.targetExpectedAt),
    sourceMomentId: normalizeText(action.sourceMomentId) || null,
    anchorMomentId: normalizeText(action.anchorMomentId) || null,
    nearestMomentId: normalizeText(action.nearestMomentId) || null,
    status: action.status,
    confidence: clamp01(action.confidence),
    reason: normalizeText(action.reason),
  };
}

function compareActionRows(
  a: InspectorIntendedActionRow,
  b: InspectorIntendedActionRow
): number {
  const statusCompare = getStatusRank(a.status) - getStatusRank(b.status);
  if (statusCompare !== 0) return statusCompare;

  const priorityCompare = getActionPriority(b) - getActionPriority(a);
  if (priorityCompare !== 0) return priorityCompare;

  const actionTypeCompare =
    getActionTypeRank(a.actionType) - getActionTypeRank(b.actionType);
  if (actionTypeCompare !== 0) return actionTypeCompare;

  if (b.confidence !== a.confidence) return b.confidence - a.confidence;
  return a.targetExpectedAt - b.targetExpectedAt;
}

function buildSummaryStats(rows: InspectorIntendedActionRow[]): {
  totalActions: number;
  missingActions: number;
  nearActions: number;
  presentActions: number;
  topConfidence: number;
  urgencyScore: number;
} {
  if (!rows.length) {
    return {
      totalActions: 0,
      missingActions: 0,
      nearActions: 0,
      presentActions: 0,
      topConfidence: 0,
      urgencyScore: 0,
    };
  }

  let missingActions = 0;
  let nearActions = 0;
  let presentActions = 0;
  let confidenceSum = 0;
  let topConfidence = 0;
  let topPriority = 0;

  for (const row of rows) {
    if (row.status === "missing") missingActions += 1;
    else if (row.status === "near") nearActions += 1;
    else if (row.status === "present") presentActions += 1;

    confidenceSum += row.confidence;
    if (row.confidence > topConfidence) topConfidence = row.confidence;

    const priority = getActionPriority(row);
    if (priority > topPriority) topPriority = priority;
  }

  const totalActions = rows.length;
  const avgConfidence = confidenceSum / totalActions;

  const urgencyScore = Number(
    (
      missingActions * 5 +
      nearActions * 3 +
      presentActions * 1 +
      avgConfidence * 2 +
      topPriority
    ).toFixed(3)
  );

  return {
    totalActions,
    missingActions,
    nearActions,
    presentActions,
    topConfidence,
    urgencyScore,
  };
}

export function buildInspectorIntendedActionView(
  plans: IntendedActionPlan[]
): InspectorIntendedActionView {
  const summaryRows: InspectorIntendedActionSummaryRow[] = [];
  const actionsByFamilyId: Record<string, InspectorIntendedActionRow[]> = {};
  const urgencyByFamilyId: Record<string, number> = {};

  for (const plan of plans) {
    const familyId = normalizeText(plan.familyId);
    if (!familyId) continue;

    const rows = Array.isArray(plan.actions) ? plan.actions.map(toActionRow) : [];

    rows.sort(compareActionRows);
    actionsByFamilyId[familyId] = rows;

    const stats = buildSummaryStats(rows);
    urgencyByFamilyId[familyId] = stats.urgencyScore;

    summaryRows.push({
      familyId,
      totalActions: stats.totalActions,
      missingActions: stats.missingActions,
      nearActions: stats.nearActions,
      presentActions: stats.presentActions,
      topConfidence: stats.topConfidence,
    });
  }

  summaryRows.sort((a, b) => {
    const urgencyA = urgencyByFamilyId[a.familyId] ?? 0;
    const urgencyB = urgencyByFamilyId[b.familyId] ?? 0;

    if (urgencyB !== urgencyA) return urgencyB - urgencyA;
    if (b.missingActions !== a.missingActions) {
      return b.missingActions - a.missingActions;
    }
    if (b.nearActions !== a.nearActions) return b.nearActions - a.nearActions;
    if (b.topConfidence !== a.topConfidence) {
      return b.topConfidence - a.topConfidence;
    }
    return a.familyId.localeCompare(b.familyId);
  });

  return {
    summaryRows,
    actionsByFamilyId,
  };
}