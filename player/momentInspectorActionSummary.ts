import type { IntendedActionPlan } from "./playerMomentIntendedActions";

export type MomentInspectorActionSummaryRow = {
  familyId: string;
  totalActions: number;
  missingActions: number;
  nearActions: number;
  presentActions: number;
  topConfidence: number;
  actionCoverageScore: number;
};

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function getCoverageScore(params: {
  totalActions: number;
  missingActions: number;
  nearActions: number;
  presentActions: number;
}): number {
  const total = Math.max(0, Number(params.totalActions) || 0);
  const missing = Math.max(0, Number(params.missingActions) || 0);
  const near = Math.max(0, Number(params.nearActions) || 0);
  const present = Math.max(0, Number(params.presentActions) || 0);

  if (total <= 0) return 0;

  const presentRatio = clamp01(present / total);
  const nearRatio = clamp01(near / total);
  const missingRatio = clamp01(missing / total);

  return clamp01(
    presentRatio * 0.76 + nearRatio * 0.18 + (1 - missingRatio) * 0.06
  );
}

export function buildMomentInspectorActionSummary(
  plans: IntendedActionPlan[] | null | undefined
): MomentInspectorActionSummaryRow[] {
  if (!plans || !plans.length) return [];

  const rows: MomentInspectorActionSummaryRow[] = [];

  for (const plan of plans) {
    const familyId = normalizeText(plan.familyId);
    if (!familyId) continue;

    const actions = Array.isArray(plan.actions) ? plan.actions : [];

    let missing = 0;
    let near = 0;
    let present = 0;
    let topConfidence = 0;

    for (const action of actions) {
      const confidence = clamp01(Number(action.confidence) || 0);

      if (confidence > topConfidence) {
        topConfidence = confidence;
      }

      if (action.status === "missing") {
        missing += 1;
        continue;
      }

      if (action.status === "near") {
        near += 1;
        continue;
      }

      if (action.status === "present") {
        present += 1;
      }
    }

    rows.push({
      familyId,
      totalActions: actions.length,
      missingActions: missing,
      nearActions: near,
      presentActions: present,
      topConfidence,
      actionCoverageScore: getCoverageScore({
        totalActions: actions.length,
        missingActions: missing,
        nearActions: near,
        presentActions: present,
      }),
    });
  }

  rows.sort((a, b) => {
    if (a.missingActions !== b.missingActions) {
      return b.missingActions - a.missingActions;
    }

    if (a.nearActions !== b.nearActions) {
      return b.nearActions - a.nearActions;
    }

    if (a.actionCoverageScore !== b.actionCoverageScore) {
      return a.actionCoverageScore - b.actionCoverageScore;
    }

    if (a.topConfidence !== b.topConfidence) {
      return b.topConfidence - a.topConfidence;
    }

    return a.familyId.localeCompare(b.familyId);
  });

  return rows;
}