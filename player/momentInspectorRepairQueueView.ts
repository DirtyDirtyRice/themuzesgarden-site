import type { IntendedActionPlan } from "./playerMomentIntendedActions";
import type { PhraseDriftEngineResult } from "./playerMomentPhraseDrift";
import type { PhraseStabilityEngineResult } from "./playerMomentPhraseStability";

export type InspectorRepairQueueRow = {
  familyId: string;
  missingCount: number;
  nearCount: number;
  presentCount: number;
  driftUnstableCount: number;
  highestDriftSeverity: number;
  stabilityScore: number | null;
  stabilityPenalty: number;
  repairPriorityScore: number;
};

export type InspectorRepairQueueView = {
  rows: InspectorRepairQueueRow[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function severityRank(severity: string | null | undefined): number {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  if (severity === "low") return 1;
  return 0;
}

function clampCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

function normalizeStabilityScore(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Number(n.toFixed(1));
}

function buildStabilityPenalty(stabilityScore: number | null): number {
  if (stabilityScore === null) return 0;
  if (stabilityScore < 40) return 6;
  if (stabilityScore < 55) return 5;
  if (stabilityScore < 70) return 3;
  if (stabilityScore < 85) return 1;
  return 0;
}

function getPlanStatusCounts(plan: IntendedActionPlan): {
  missingCount: number;
  nearCount: number;
  presentCount: number;
} {
  const actions = Array.isArray(plan.actions) ? plan.actions : [];

  let missingCount = 0;
  let nearCount = 0;
  let presentCount = 0;

  for (const action of actions) {
    if (action?.status === "missing") {
      missingCount += 1;
      continue;
    }

    if (action?.status === "near") {
      nearCount += 1;
      continue;
    }

    if (action?.status === "present") {
      presentCount += 1;
    }
  }

  return {
    missingCount: clampCount(missingCount),
    nearCount: clampCount(nearCount),
    presentCount: clampCount(presentCount),
  };
}

function buildRepairPriorityScore(row: InspectorRepairQueueRow): number {
  const missingWeight = row.missingCount * 6;
  const nearWeight = row.nearCount * 3.5;
  const presentWeight = row.presentCount * 0.25;
  const driftWeight = row.driftUnstableCount * 2.5;
  const severityWeight = row.highestDriftSeverity * 2;
  const stabilityWeight = row.stabilityPenalty;

  return Number(
    (
      missingWeight +
      nearWeight +
      presentWeight +
      driftWeight +
      severityWeight +
      stabilityWeight
    ).toFixed(3)
  );
}

function compareRepairQueueRows(
  a: InspectorRepairQueueRow,
  b: InspectorRepairQueueRow
): number {
  if (b.repairPriorityScore !== a.repairPriorityScore) {
    return b.repairPriorityScore - a.repairPriorityScore;
  }

  if (b.missingCount !== a.missingCount) {
    return b.missingCount - a.missingCount;
  }

  if (b.nearCount !== a.nearCount) {
    return b.nearCount - a.nearCount;
  }

  if (b.stabilityPenalty !== a.stabilityPenalty) {
    return b.stabilityPenalty - a.stabilityPenalty;
  }

  if (b.driftUnstableCount !== a.driftUnstableCount) {
    return b.driftUnstableCount - a.driftUnstableCount;
  }

  if (b.highestDriftSeverity !== a.highestDriftSeverity) {
    return b.highestDriftSeverity - a.highestDriftSeverity;
  }

  if (a.presentCount !== b.presentCount) {
    return a.presentCount - b.presentCount;
  }

  return a.familyId.localeCompare(b.familyId);
}

export function buildInspectorRepairQueueView(params: {
  intendedPlans: IntendedActionPlan[];
  phraseDriftResult?: PhraseDriftEngineResult | null;
  phraseStabilityResult?: PhraseStabilityEngineResult | null;
}): InspectorRepairQueueView {
  const { intendedPlans, phraseDriftResult, phraseStabilityResult } = params;

  const rows: InspectorRepairQueueRow[] = [];

  for (const plan of intendedPlans) {
    const familyId = normalizeText(plan.familyId);
    if (!familyId) continue;

    const { missingCount, nearCount, presentCount } = getPlanStatusCounts(plan);

    const driftFamily = phraseDriftResult?.byFamilyId?.[familyId] ?? null;
    const stabilityFamily = phraseStabilityResult?.byFamilyId?.[familyId] ?? null;

    const driftUnstableCount = clampCount(driftFamily?.unstableCount ?? 0);
    const highestDriftSeverity = severityRank(driftFamily?.highestSeverity);
    const stabilityScore = normalizeStabilityScore(stabilityFamily?.stabilityScore);
    const stabilityPenalty = buildStabilityPenalty(stabilityScore);

    const row: InspectorRepairQueueRow = {
      familyId,
      missingCount,
      nearCount,
      presentCount,
      driftUnstableCount,
      highestDriftSeverity,
      stabilityScore,
      stabilityPenalty,
      repairPriorityScore: 0,
    };

    row.repairPriorityScore = buildRepairPriorityScore(row);
    rows.push(row);
  }

  rows.sort(compareRepairQueueRows);

  return {
    rows,
  };
}