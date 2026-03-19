import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";
import type { RepairSimulationScenario } from "./playerMomentRepairSimulation.types";

export function clamp01(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function clamp100(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

export function clampNonNegative(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function round1(value: number): number {
  const safe = Number.isFinite(value) ? value : 0;
  return Number(clamp100(safe).toFixed(1));
}

export function round3(value: number): number {
  const safe = Number.isFinite(value) ? value : 0;
  return Number(safe.toFixed(3));
}

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function clampGain(value: unknown): number {
  return round1(clampNonNegative(value));
}

function clampScoreDelta(value: unknown): number {
  return clampNonNegative(value);
}

function getProjectedScore(base: number, gain: number): number {
  return round1(clamp100(base + gain));
}

function getProjectedReduction(base: number, drop: number): number {
  return Number(
    Math.max(0, clampNonNegative(base) - clampNonNegative(drop)).toFixed(1)
  );
}

function getBalanceBonus(values: number[]): number {
  const positive = values
    .map((value) => clampNonNegative(value))
    .filter((value) => value > 0);

  if (!positive.length) return 0;

  const min = Math.min(...positive);
  const max = Math.max(...positive);

  if (max <= 0) return 0;

  const balanceRatio = min / max;
  return balanceRatio * Math.min(positive.length * 1.2, 6);
}

function getConcentrationPenalty(values: number[]): number {
  const positive = values
    .map((value) => clampNonNegative(value))
    .filter((value) => value > 0);

  if (positive.length <= 1) return 0;

  const total = positive.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;

  const max = Math.max(...positive);
  const dominanceRatio = max / total;

  if (dominanceRatio <= 0.7) return 0;
  return (dominanceRatio - 0.7) * 10;
}

export function getBaselineStabilityScore(
  stabilityFamilyRow?: InspectorPhraseStabilityFamilyRow | null
): number | null {
  if (!stabilityFamilyRow) return null;
  return round1(clamp100(stabilityFamilyRow.stabilityScore));
}

export function buildProjectedScores(params: {
  baselineConfidenceScore: number;
  baselineReadinessScore: number;
  baselineRepairPriorityScore: number;
  baselineDriftSeverityScore: number;
  baselineStabilityScore: number | null;
  confidenceGain: number;
  readinessGain: number;
  repairPressureDrop: number;
  driftReduction: number;
  stabilityGain: number;
}) {
  const {
    baselineConfidenceScore,
    baselineReadinessScore,
    baselineRepairPriorityScore,
    baselineDriftSeverityScore,
    baselineStabilityScore,
    confidenceGain,
    readinessGain,
    repairPressureDrop,
    driftReduction,
    stabilityGain,
  } = params;

  const cleanConfidenceGain = clampGain(confidenceGain);
  const cleanReadinessGain = clampGain(readinessGain);
  const cleanRepairDrop = clampGain(repairPressureDrop);
  const cleanDriftReduction = clampGain(driftReduction);
  const cleanStabilityGain = clampGain(stabilityGain);

  return {
    projectedConfidenceScore: getProjectedScore(
      clamp100(baselineConfidenceScore),
      cleanConfidenceGain
    ),
    projectedReadinessScore: getProjectedScore(
      clamp100(baselineReadinessScore),
      cleanReadinessGain
    ),
    projectedRepairPriorityScore: getProjectedReduction(
      baselineRepairPriorityScore,
      cleanRepairDrop
    ),
    projectedDriftSeverityScore: getProjectedReduction(
      baselineDriftSeverityScore,
      cleanDriftReduction
    ),
    projectedStabilityScore:
      baselineStabilityScore === null
        ? null
        : getProjectedScore(baselineStabilityScore, cleanStabilityGain),
  };
}

export function buildPayoffScore(params: {
  confidenceGain: number;
  readinessGain: number;
  repairPressureDrop: number;
  driftReduction: number;
  stabilityGain: number;
}): number {
  const confidenceGain = clampScoreDelta(params.confidenceGain);
  const readinessGain = clampScoreDelta(params.readinessGain);
  const repairPressureDrop = clampScoreDelta(params.repairPressureDrop);
  const driftReduction = clampScoreDelta(params.driftReduction);
  const stabilityGain = clampScoreDelta(params.stabilityGain);

  const baseScore =
    confidenceGain * 0.22 +
    readinessGain * 0.3 +
    repairPressureDrop * 0.14 +
    driftReduction * 0.2 +
    stabilityGain * 0.14;

  const balanceBonus = getBalanceBonus([
    confidenceGain,
    readinessGain,
    repairPressureDrop,
    driftReduction,
    stabilityGain,
  ]);

  const concentrationPenalty = getConcentrationPenalty([
    confidenceGain,
    readinessGain,
    repairPressureDrop,
    driftReduction,
    stabilityGain,
  ]);

  return round3(Math.max(0, baseScore + balanceBonus - concentrationPenalty));
}

export function compareScenarios(
  a: RepairSimulationScenario,
  b: RepairSimulationScenario
): number {
  if (b.payoffScore !== a.payoffScore) return b.payoffScore - a.payoffScore;

  const aProjectedReadiness = clamp100(a.projectedReadinessScore);
  const bProjectedReadiness = clamp100(b.projectedReadinessScore);
  if (bProjectedReadiness !== aProjectedReadiness) {
    return bProjectedReadiness - aProjectedReadiness;
  }

  const aProjectedConfidence = clamp100(a.projectedConfidenceScore);
  const bProjectedConfidence = clamp100(b.projectedConfidenceScore);
  if (bProjectedConfidence !== aProjectedConfidence) {
    return bProjectedConfidence - aProjectedConfidence;
  }

  const aProjectedDrift = clampNonNegative(a.projectedDriftSeverityScore);
  const bProjectedDrift = clampNonNegative(b.projectedDriftSeverityScore);
  if (aProjectedDrift !== bProjectedDrift) {
    return aProjectedDrift - bProjectedDrift;
  }

  const aProjectedRepair = clampNonNegative(a.projectedRepairPriorityScore);
  const bProjectedRepair = clampNonNegative(b.projectedRepairPriorityScore);
  if (aProjectedRepair !== bProjectedRepair) {
    return aProjectedRepair - bProjectedRepair;
  }

  if (b.estimatedReadinessGain !== a.estimatedReadinessGain) {
    return b.estimatedReadinessGain - a.estimatedReadinessGain;
  }

  if (b.estimatedConfidenceGain !== a.estimatedConfidenceGain) {
    return b.estimatedConfidenceGain - a.estimatedConfidenceGain;
  }

  return a.label.localeCompare(b.label);
}