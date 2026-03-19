import type { MomentInspectorActionSummaryRow } from "./momentInspectorActionSummary";

function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function safeDivide(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return 0;
  return a / b;
}

export type MomentInspectorHealthResult = {
  overallHealth: number;
  structureConfidence: number;
  repeatIntegrity: number;
  actionCoverageAverage: number;
  totalFamilies: number;
  totalActions: number;
  missingActions: number;
  nearActions: number;
  presentActions: number;
};

export function buildMomentInspectorHealth(
  rows: MomentInspectorActionSummaryRow[] | null | undefined
): MomentInspectorHealthResult {
  if (!rows || !rows.length) {
    return {
      overallHealth: 0,
      structureConfidence: 0,
      repeatIntegrity: 0,
      actionCoverageAverage: 0,
      totalFamilies: 0,
      totalActions: 0,
      missingActions: 0,
      nearActions: 0,
      presentActions: 0,
    };
  }

  let totalActions = 0;
  let missingActions = 0;
  let nearActions = 0;
  let presentActions = 0;

  let weightedConfidenceSum = 0;
  let weightedCoverageSum = 0;
  let familyWeightSum = 0;

  for (const row of rows) {
    const rowTotalActions = Math.max(0, Number(row.totalActions) || 0);
    const rowMissing = Math.max(0, Number(row.missingActions) || 0);
    const rowNear = Math.max(0, Number(row.nearActions) || 0);
    const rowPresent = Math.max(0, Number(row.presentActions) || 0);
    const rowWeight = Math.max(1, rowTotalActions);

    totalActions += rowTotalActions;
    missingActions += rowMissing;
    nearActions += rowNear;
    presentActions += rowPresent;

    weightedConfidenceSum += clamp01(row.topConfidence) * rowWeight;
    weightedCoverageSum += clamp01(row.actionCoverageScore) * rowWeight;
    familyWeightSum += rowWeight;
  }

  const totalFamilies = rows.length;

  const presentRate = clamp01(safeDivide(presentActions, totalActions));
  const nearRate = clamp01(safeDivide(nearActions, totalActions));
  const missingRate = clamp01(safeDivide(missingActions, totalActions));

  const structureConfidence = clamp01(
    safeDivide(weightedConfidenceSum, familyWeightSum)
  );

  const actionCoverageAverage = clamp01(
    safeDivide(weightedCoverageSum, familyWeightSum)
  );

  const repeatIntegrity = clamp01(
    presentRate * 1 -
      nearRate * 0.35 -
      missingRate * 0.85
  );

  const overallHealth = clamp01(
    structureConfidence * 0.3 +
      repeatIntegrity * 0.45 +
      actionCoverageAverage * 0.25
  );

  return {
    overallHealth,
    structureConfidence,
    repeatIntegrity,
    actionCoverageAverage,
    totalFamilies,
    totalActions,
    missingActions,
    nearActions,
    presentActions,
  };
}