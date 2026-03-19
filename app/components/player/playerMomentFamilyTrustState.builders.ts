import type {
  BuildFamilyTrustStateParams,
  FamilyTrustReason,
  FamilyTrustStateResult,
} from "./playerMomentFamilyTrustState.types";

import {
  average,
  clamp01,
  clamp100,
  dedupeReasons,
  getTrustLevel,
  round1,
} from "./playerMomentFamilyTrustState.shared";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function clampCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function normalizeScore(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return round1(clamp100(n));
}

function getKnownScoreAverage(values: Array<number | null | undefined>): number | null {
  const valid = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!valid.length) return null;

  return round1(clamp100(average(valid)));
}

function getNormalizedActionMix(params: {
  totalActions: number;
  missingActions: number;
  nearActions: number;
  presentActions: number;
}): {
  total: number;
  presentRatio: number;
  nearRatio: number;
  missingRatio: number;
  unresolvedRatio: number;
} | null {
  const total = clampCount(params.totalActions);
  const missing = clampCount(params.missingActions);
  const near = clampCount(params.nearActions);
  const present = clampCount(params.presentActions);

  if (total <= 0) return null;

  const safePresent = Math.min(total, present);
  const remainingAfterPresent = Math.max(0, total - safePresent);
  const safeNear = Math.min(remainingAfterPresent, near);
  const remainingAfterNear = Math.max(0, remainingAfterPresent - safeNear);
  const safeMissing = Math.min(remainingAfterNear, missing);
  const unresolved = Math.max(0, total - safePresent - safeNear - safeMissing);

  return {
    total,
    presentRatio: clamp01(safePresent / total),
    nearRatio: clamp01(safeNear / total),
    missingRatio: clamp01(safeMissing / total),
    unresolvedRatio: clamp01(unresolved / total),
  };
}

function getActionCoverageScore(params: {
  totalActions: number;
  missingActions: number;
  nearActions: number;
  presentActions: number;
}): number | null {
  const mix = getNormalizedActionMix(params);
  if (!mix) return null;

  const raw =
    mix.presentRatio * 100 * 0.74 +
    mix.nearRatio * 100 * 0.16 +
    (1 - mix.missingRatio) * 100 * 0.1;

  const penalty =
    mix.missingRatio * 24 +
    mix.unresolvedRatio * 10 +
    (mix.presentRatio === 0 ? 10 : 0) +
    (mix.missingRatio >= 0.4 ? 8 : 0) +
    (mix.nearRatio > mix.presentRatio ? 4 : 0);

  return round1(clamp100(raw - penalty));
}

function getRepairOpportunityScore(params: {
  bestPayoffScore: number;
  bestImpactScore: number;
  averageImpactScore: number;
}): number {
  const base = average([
    params.bestPayoffScore,
    params.bestImpactScore,
    params.averageImpactScore,
  ]);

  const spreadPenalty = Math.abs(params.bestImpactScore - params.averageImpactScore) * 0.08;

  return round1(clamp100(base - spreadPenalty));
}

function getTrustPenalty(params: {
  missingActions: number;
  nearActions: number;
  driftHealthScore: number | null;
  stabilityScore: number | null;
  structuralConfidenceScore: number | null;
  repeatCoverageScore: number | null;
  repairPriorityScore: number;
  highestDriftSeverity: number;
}): number {
  let penalty = 0;

  if (params.missingActions > 0) penalty += Math.min(20, params.missingActions * 6);
  if (params.nearActions >= 2) penalty += Math.min(8, (params.nearActions - 1) * 2);

  if ((params.driftHealthScore ?? 100) < 40) penalty += 16;
  else if ((params.driftHealthScore ?? 100) < 55) penalty += 9;
  else if ((params.driftHealthScore ?? 100) < 70) penalty += 4;

  if ((params.stabilityScore ?? 100) < 45) penalty += 16;
  else if ((params.stabilityScore ?? 100) < 60) penalty += 9;
  else if ((params.stabilityScore ?? 100) < 72) penalty += 4;

  if ((params.structuralConfidenceScore ?? 100) < 50) penalty += 10;
  else if ((params.structuralConfidenceScore ?? 100) < 62) penalty += 5;

  if ((params.repeatCoverageScore ?? 100) < 55) penalty += 8;
  else if ((params.repeatCoverageScore ?? 100) < 68) penalty += 4;

  if (params.repairPriorityScore >= 18) penalty += 12;
  else if (params.repairPriorityScore >= 12) penalty += 6;

  if (params.highestDriftSeverity >= 3) penalty += 10;
  else if (params.highestDriftSeverity >= 2) penalty += 5;

  return round1(clamp100(penalty));
}

function buildReasons(params: {
  trustScore: number;
  recoveryScore: number;
  volatilityScore: number;
  stabilityScore: number | null;
  driftHealthScore: number | null;
  actionCoverageScore: number | null;
  structuralConfidenceScore: number | null;
  repeatCoverageScore: number | null;
  repairPriorityScore: number;
  repairOpportunityScore: number;
  missingActions: number;
  nearActions: number;
  highestDriftSeverity: number;
}): FamilyTrustReason[] {
  const reasons: FamilyTrustReason[] = [];

  if ((params.stabilityScore ?? 0) >= 78) reasons.push("good-stability");
  if ((params.driftHealthScore ?? 0) >= 78) reasons.push("good-drift-health");
  if ((params.actionCoverageScore ?? 0) >= 76) reasons.push("good-action-coverage");
  if ((params.structuralConfidenceScore ?? 0) >= 78) {
    reasons.push("good-structural-confidence");
  }

  if (
    params.highestDriftSeverity >= 2 ||
    (params.driftHealthScore ?? 100) < 45 ||
    params.volatilityScore >= 62
  ) {
    reasons.push("high-drift");
  }

  if (params.missingActions > 0 || params.nearActions >= 3) {
    reasons.push("missing-actions");
  }

  if ((params.repeatCoverageScore ?? 100) < 65) {
    reasons.push("low-repeat-coverage");
  }

  if ((params.structuralConfidenceScore ?? 100) < 60) {
    reasons.push("low-structural-confidence");
  }

  if (params.repairPriorityScore >= 16) {
    reasons.push("high-repair-pressure");
  }

  if (
    (params.repairOpportunityScore >= 55 || params.recoveryScore >= 72) &&
    params.trustScore < 75
  ) {
    reasons.push("repair-upside-available");
  }

  return dedupeReasons(reasons);
}

function getStrongestReason(params: {
  reasons: FamilyTrustReason[];
  trustScore: number;
  recoveryScore: number;
  repairOpportunityScore: number;
  repairPriorityScore: number;
  volatilityScore: number;
  stabilityScore: number | null;
  driftHealthScore: number | null;
  structuralConfidenceScore: number | null;
  repeatCoverageScore: number | null;
  missingActions: number;
  nearActions: number;
}): FamilyTrustReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (
    (params.missingActions > 0 || params.nearActions >= 3) &&
    reasons.includes("missing-actions")
  ) {
    return "missing-actions";
  }

  if (
    ((params.driftHealthScore ?? 100) < 45 || params.volatilityScore >= 62) &&
    reasons.includes("high-drift")
  ) {
    return "high-drift";
  }

  if (
    params.repairPriorityScore >= 16 &&
    reasons.includes("high-repair-pressure")
  ) {
    return "high-repair-pressure";
  }

  if (
    (params.structuralConfidenceScore ?? 100) < 60 &&
    reasons.includes("low-structural-confidence")
  ) {
    return "low-structural-confidence";
  }

  if (
    (params.repeatCoverageScore ?? 100) < 65 &&
    reasons.includes("low-repeat-coverage")
  ) {
    return "low-repeat-coverage";
  }

  if (
    params.recoveryScore >= 72 &&
    params.repairOpportunityScore >= 55 &&
    params.trustScore < 75 &&
    reasons.includes("repair-upside-available")
  ) {
    return "repair-upside-available";
  }

  if ((params.stabilityScore ?? 0) >= 78 && reasons.includes("good-stability")) {
    return "good-stability";
  }

  if (
    (params.driftHealthScore ?? 0) >= 78 &&
    reasons.includes("good-drift-health")
  ) {
    return "good-drift-health";
  }

  if (params.trustScore >= 78 && reasons.includes("good-action-coverage")) {
    return "good-action-coverage";
  }

  if (
    (params.structuralConfidenceScore ?? 0) >= 78 &&
    reasons.includes("good-structural-confidence")
  ) {
    return "good-structural-confidence";
  }

  return reasons[0] ?? null;
}

export function buildFamilyTrustState(
  params: BuildFamilyTrustStateParams
): FamilyTrustStateResult {
  const familyId = normalizeText(params.familyId);

  const driftHealthScore = normalizeScore(params.driftFamilyRow?.driftHealthScore);
  const stabilityScore = normalizeScore(params.stabilityFamilyRow?.stabilityScore);
  const structuralConfidenceScore = normalizeScore(
    params.stabilityFamilyRow?.structuralConfidence
  );
  const repeatCoverageScore = normalizeScore(params.stabilityFamilyRow?.repeatCoverage);

  const missingActions = clampCount(params.actionSummaryRow?.missingActions);
  const nearActions = clampCount(params.actionSummaryRow?.nearActions);

  const actionCoverageScore = getActionCoverageScore({
    totalActions: params.actionSummaryRow?.totalActions ?? 0,
    missingActions,
    nearActions,
    presentActions: params.actionSummaryRow?.presentActions ?? 0,
  });

  const repairPriorityScore = round1(
    clamp100(Number(params.repairQueueRow?.repairPriorityScore ?? 0))
  );

  const highestDriftSeverity = clampCount(
    Number(params.repairQueueRow?.highestDriftSeverity ?? 0)
  );

  const bestPayoffScore = round1(
    clamp100(Number(params.repairSimulationResult?.bestScenario?.payoffScore ?? 0))
  );

  const bestImpactScore = round1(
    clamp100(Number(params.repairImpactResult?.bestImpactScore ?? 0))
  );

  const averageImpactScore = round1(
    clamp100(Number(params.repairImpactResult?.averageImpactScore ?? 0))
  );

  const repairOpportunityScore = getRepairOpportunityScore({
    bestPayoffScore,
    bestImpactScore,
    averageImpactScore,
  });

  const coreHealthScore =
    getKnownScoreAverage([
      stabilityScore,
      driftHealthScore,
      actionCoverageScore,
      structuralConfidenceScore,
    ]) ?? 0;

  const supportHealthScore =
    getKnownScoreAverage([repeatCoverageScore, 100 - repairPriorityScore]) ?? 0;

  const knownComponentCount = [
    driftHealthScore,
    stabilityScore,
    actionCoverageScore,
    structuralConfidenceScore,
    repeatCoverageScore,
  ].filter((value) => value !== null).length;

  const limitedDataPenalty = knownComponentCount <= 1 ? 12 : knownComponentCount === 2 ? 6 : 0;

  const baseTrustScore = clamp100(coreHealthScore * 0.8 + supportHealthScore * 0.2);

  const trustPenalty = clamp100(
    getTrustPenalty({
      missingActions,
      nearActions,
      driftHealthScore,
      stabilityScore,
      structuralConfidenceScore,
      repeatCoverageScore,
      repairPriorityScore,
      highestDriftSeverity,
    }) + limitedDataPenalty
  );

  const trustScore = round1(clamp100(baseTrustScore - trustPenalty));

  const volatilityScore = round1(
    clamp100(
      (100 - (driftHealthScore ?? 100)) * 0.34 +
        (100 - (stabilityScore ?? 100)) * 0.26 +
        repairPriorityScore * 0.16 +
        Math.min(100, missingActions * 16 + nearActions * 5) * 0.12 +
        Math.min(100, highestDriftSeverity * 22) * 0.12
    )
  );

  const recoveryScore = round1(
    clamp100(
      repairOpportunityScore * 0.34 +
        bestImpactScore * 0.2 +
        bestPayoffScore * 0.18 +
        (structuralConfidenceScore ?? 0) * 0.12 +
        (repeatCoverageScore ?? 0) * 0.08 +
        (100 - volatilityScore) * 0.08
    )
  );

  const reasons = buildReasons({
    trustScore,
    recoveryScore,
    volatilityScore,
    stabilityScore,
    driftHealthScore,
    actionCoverageScore,
    structuralConfidenceScore,
    repeatCoverageScore,
    repairPriorityScore,
    repairOpportunityScore,
    missingActions,
    nearActions,
    highestDriftSeverity,
  });

  const strongestReason = getStrongestReason({
    reasons,
    trustScore,
    recoveryScore,
    repairOpportunityScore,
    repairPriorityScore,
    volatilityScore,
    stabilityScore,
    driftHealthScore,
    structuralConfidenceScore,
    repeatCoverageScore,
    missingActions,
    nearActions,
  });

  return {
    familyId,
    trustScore,
    trustLevel: getTrustLevel(trustScore),
    recoveryScore,
    volatilityScore,
    repairOpportunityScore,
    strongestReason,
    reasons,
    driftHealthScore,
    stabilityScore,
    actionCoverageScore,
    structuralConfidenceScore,
    repeatCoverageScore,
  };
}