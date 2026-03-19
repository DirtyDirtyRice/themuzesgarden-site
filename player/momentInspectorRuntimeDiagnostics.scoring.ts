import type { InspectorIntendedActionSummaryRow } from "./momentInspectorIntendedActionView";
import type { InspectorPhraseDriftFamilyRow } from "./momentInspectorPhraseDriftView";
import type { InspectorPhraseStabilityFamilyRow } from "./momentInspectorPhraseStabilityView";

import {
  clamp01,
  clamp100,
  getSeverityWeightFromText,
  round1,
} from "./momentInspectorRuntimeDiagnostics.shared";

function clampCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function getCoverageScore(params: {
  actionCount: number;
  presentCount: number;
  nearCount: number;
}): number {
  const { actionCount, presentCount, nearCount } = params;
  if (actionCount <= 0) return 0;

  const nearCredit = Math.min(
    nearCount,
    Math.max(0, actionCount - presentCount)
  ) * 0.4;

  return clamp100(((presentCount + nearCredit) / actionCount) * 100);
}

function getActionSupportScore(params: {
  actionCount: number;
  presentCount: number;
  nearCount: number;
  missingCount: number;
}): number {
  const { actionCount, presentCount, nearCount, missingCount } = params;
  if (actionCount <= 0) return 0;

  const presentRatio = presentCount / actionCount;
  const nearRatio = nearCount / actionCount;
  const missingRatio = missingCount / actionCount;

  const raw =
    presentRatio * 100 * 0.76 +
    nearRatio * 100 * 0.16 +
    (100 - missingRatio * 100) * 0.08;

  return clamp100(raw);
}

function getActionCountConfidenceBoost(actionCount: number): number {
  if (actionCount >= 8) return 100;
  if (actionCount >= 6) return 92;
  if (actionCount >= 4) return 84;
  if (actionCount >= 3) return 76;
  if (actionCount >= 2) return 66;
  if (actionCount === 1) return 50;
  return 30;
}

export function getConfidenceScore(
  actionSummaryRow?: InspectorIntendedActionSummaryRow | null,
  stabilityFamilyRow?: InspectorPhraseStabilityFamilyRow | null
): number {
  const topConfidence = clamp01(actionSummaryRow?.topConfidence ?? 0) * 100;
  const structuralConfidence = clamp100(
    stabilityFamilyRow?.structuralConfidence ?? 0
  );
  const stabilityScore = clamp100(stabilityFamilyRow?.stabilityScore ?? 0);

  const actionCount = clampCount(actionSummaryRow?.totalActions);
  const presentCount = clampCount(actionSummaryRow?.presentActions);
  const nearCount = clampCount(actionSummaryRow?.nearActions);
  const missingCount = clampCount(actionSummaryRow?.missingActions);

  const coverageScore = getCoverageScore({
    actionCount,
    presentCount,
    nearCount,
  });

  const actionSupportScore = getActionSupportScore({
    actionCount,
    presentCount,
    nearCount,
    missingCount,
  });

  const actionCountConfidence = getActionCountConfidenceBoost(actionCount);

  const missingRatio = actionCount > 0 ? missingCount / actionCount : 1;
  const presentRatio = actionCount > 0 ? presentCount / actionCount : 0;
  const nearRatio = actionCount > 0 ? nearCount / actionCount : 0;

  const missingPenalty = missingRatio * 30;
  const lowPresentPenalty = presentRatio < 0.3 ? (0.3 - presentRatio) * 18 : 0;
  const heavyNearPenalty = nearRatio > 0.5 ? (nearRatio - 0.5) * 12 : 0;
  const zeroActionPenalty = actionCount === 0 ? 16 : 0;

  const raw =
    topConfidence * 0.28 +
    structuralConfidence * 0.24 +
    stabilityScore * 0.16 +
    coverageScore * 0.16 +
    actionSupportScore * 0.1 +
    actionCountConfidence * 0.06 -
    missingPenalty -
    lowPresentPenalty -
    heavyNearPenalty -
    zeroActionPenalty;

  return round1(clamp100(raw));
}

export function getDriftSeverityScore(
  driftFamilyRow?: InspectorPhraseDriftFamilyRow | null
): number {
  if (!driftFamilyRow) return 0;

  const comparedMemberCount = clampCount(driftFamilyRow.comparedMemberCount);
  const unstableCount = clampCount(driftFamilyRow.unstableCount);

  const unstableRatio =
    comparedMemberCount > 0 ? unstableCount / comparedMemberCount : 0;

  const unstableScore = clamp100(unstableRatio * 100) * 0.42;

  const severityScore =
    clamp100(getSeverityWeightFromText(driftFamilyRow.highestSeverity)) * 0.26;

  const timingScore =
    clamp100(Math.abs(Number(driftFamilyRow.averageAbsoluteTimingOffset ?? 0)) * 140) *
    0.1;

  const durationScore =
    clamp100(Math.abs(Number(driftFamilyRow.averageAbsoluteDurationDrift ?? 0)) * 140) *
    0.08;

  const healthPenalty =
    clamp100(100 - clamp100(driftFamilyRow.driftHealthScore)) * 0.14;

  const sparseComparisonPenalty =
    comparedMemberCount <= 1 ? 8 : comparedMemberCount === 2 ? 4 : 0;

  const raw =
    unstableScore +
    severityScore +
    timingScore +
    durationScore +
    healthPenalty +
    sparseComparisonPenalty;

  return round1(clamp100(raw));
}

export function getReadinessScore(params: {
  confidenceScore: number;
  driftSeverityScore: number;
  repairPriorityScore: number;
  stabilityFamilyRow?: InspectorPhraseStabilityFamilyRow | null;
}): number {
  const {
    confidenceScore,
    driftSeverityScore,
    repairPriorityScore,
    stabilityFamilyRow,
  } = params;

  const stabilityScore = clamp100(stabilityFamilyRow?.stabilityScore ?? 0);
  const repeatCoverage = clamp100(stabilityFamilyRow?.repeatCoverage ?? 0);
  const structuralConfidence = clamp100(
    stabilityFamilyRow?.structuralConfidence ?? 0
  );

  const repairPenaltyScore = clamp100(repairPriorityScore * 5.5);
  const driftPenaltyScore = clamp100(driftSeverityScore);

  const base =
    confidenceScore * 0.28 +
    stabilityScore * 0.28 +
    repeatCoverage * 0.16 +
    structuralConfidence * 0.16 +
    (100 - driftPenaltyScore) * 0.08 +
    (100 - repairPenaltyScore) * 0.04;

  let penalty = 0;

  if (stabilityScore < 50) penalty += 12;
  else if (stabilityScore < 65) penalty += 6;

  if (repeatCoverage < 45) penalty += 9;
  else if (repeatCoverage < 60) penalty += 4;

  if (structuralConfidence < 50) penalty += 8;
  else if (structuralConfidence < 65) penalty += 4;

  if (driftSeverityScore >= 80) penalty += 14;
  else if (driftSeverityScore >= 60) penalty += 8;
  else if (driftSeverityScore >= 40) penalty += 3;

  if (repairPriorityScore >= 14) penalty += 10;
  else if (repairPriorityScore >= 8) penalty += 5;

  return round1(clamp100(base - penalty));
}

export function getNormalizedRepairPriorityScore(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Number(n.toFixed(1));
}