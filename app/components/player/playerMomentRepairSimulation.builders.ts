import type {
  BuildRepairSimulationParams,
  RepairSimulationResult,
  RepairSimulationScenario,
  RepairSimulationScenarioType,
} from "./playerMomentRepairSimulation.types";

import {
  clamp100,
  clampNonNegative,
  getBaselineStabilityScore,
  normalizeText,
  round1,
  round3,
  buildProjectedScores,
  buildPayoffScore,
  compareScenarios,
} from "./playerMomentRepairSimulation.shared";

function clamp01(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function clampCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function clampPositiveScore(value: unknown): number {
  return round1(clampNonNegative(value));
}

function buildImpactScore(params: {
  estimatedConfidenceGain: number;
  estimatedReadinessGain: number;
  estimatedRepairPressureDrop: number;
  estimatedDriftReduction: number;
  estimatedStabilityGain: number;
}): number {
  const {
    estimatedConfidenceGain,
    estimatedReadinessGain,
    estimatedRepairPressureDrop,
    estimatedDriftReduction,
    estimatedStabilityGain,
  } = params;

  return round3(
    estimatedConfidenceGain +
      estimatedReadinessGain +
      estimatedRepairPressureDrop +
      estimatedDriftReduction +
      estimatedStabilityGain
  );
}

function buildPriorityScore(params: {
  payoffScore: number;
  projectedReadinessScore: number;
  projectedConfidenceScore: number;
  projectedRepairPriorityScore: number;
  projectedDriftSeverityScore: number;
}): number {
  const {
    payoffScore,
    projectedReadinessScore,
    projectedConfidenceScore,
    projectedRepairPriorityScore,
    projectedDriftSeverityScore,
  } = params;

  return round3(
    payoffScore * 0.55 +
      clamp100(projectedReadinessScore) * 0.2 +
      clamp100(projectedConfidenceScore) * 0.14 -
      clampNonNegative(projectedRepairPriorityScore) * 0.06 -
      clampNonNegative(projectedDriftSeverityScore) * 0.05
  );
}

function pushScenarioIfUseful(params: {
  scenarios: RepairSimulationScenario[];
  familyId: string;
  scenarioType: RepairSimulationScenarioType;
  label: string;
  baselineConfidenceScore: number;
  baselineReadinessScore: number;
  baselineRepairPriorityScore: number;
  baselineDriftSeverityScore: number;
  baselineStabilityScore: number | null;
  estimatedConfidenceGain: number;
  estimatedReadinessGain: number;
  estimatedRepairPressureDrop: number;
  estimatedDriftReduction: number;
  estimatedStabilityGain: number;
  summary: string;
}) {
  const gainTotal =
    clampPositiveScore(params.estimatedConfidenceGain) +
    clampPositiveScore(params.estimatedReadinessGain) +
    clampPositiveScore(params.estimatedRepairPressureDrop) +
    clampPositiveScore(params.estimatedDriftReduction) +
    clampPositiveScore(params.estimatedStabilityGain);

  if (gainTotal <= 0) return;

  params.scenarios.push(
    buildScenario({
      familyId: params.familyId,
      scenarioType: params.scenarioType,
      label: params.label,
      baselineConfidenceScore: params.baselineConfidenceScore,
      baselineReadinessScore: params.baselineReadinessScore,
      baselineRepairPriorityScore: params.baselineRepairPriorityScore,
      baselineDriftSeverityScore: params.baselineDriftSeverityScore,
      baselineStabilityScore: params.baselineStabilityScore,
      estimatedConfidenceGain: params.estimatedConfidenceGain,
      estimatedReadinessGain: params.estimatedReadinessGain,
      estimatedRepairPressureDrop: params.estimatedRepairPressureDrop,
      estimatedDriftReduction: params.estimatedDriftReduction,
      estimatedStabilityGain: params.estimatedStabilityGain,
      summary: params.summary,
    })
  );
}

function buildScenario(params: {
  familyId: string;
  scenarioType: RepairSimulationScenarioType;
  label: string;
  baselineConfidenceScore: number;
  baselineReadinessScore: number;
  baselineRepairPriorityScore: number;
  baselineDriftSeverityScore: number;
  baselineStabilityScore: number | null;
  estimatedConfidenceGain: number;
  estimatedReadinessGain: number;
  estimatedRepairPressureDrop: number;
  estimatedDriftReduction: number;
  estimatedStabilityGain: number;
  summary: string;
}): RepairSimulationScenario {
  const projected = buildProjectedScores({
    baselineConfidenceScore: params.baselineConfidenceScore,
    baselineReadinessScore: params.baselineReadinessScore,
    baselineRepairPriorityScore: params.baselineRepairPriorityScore,
    baselineDriftSeverityScore: params.baselineDriftSeverityScore,
    baselineStabilityScore: params.baselineStabilityScore,
    confidenceGain: params.estimatedConfidenceGain,
    readinessGain: params.estimatedReadinessGain,
    repairPressureDrop: params.estimatedRepairPressureDrop,
    driftReduction: params.estimatedDriftReduction,
    stabilityGain: params.estimatedStabilityGain,
  });

  const payoffScore = buildPayoffScore({
    confidenceGain: params.estimatedConfidenceGain,
    readinessGain: params.estimatedReadinessGain,
    repairPressureDrop: params.estimatedRepairPressureDrop,
    driftReduction: params.estimatedDriftReduction,
    stabilityGain: params.estimatedStabilityGain,
  });

  const impactScore = buildImpactScore({
    estimatedConfidenceGain: params.estimatedConfidenceGain,
    estimatedReadinessGain: params.estimatedReadinessGain,
    estimatedRepairPressureDrop: params.estimatedRepairPressureDrop,
    estimatedDriftReduction: params.estimatedDriftReduction,
    estimatedStabilityGain: params.estimatedStabilityGain,
  });

  const priorityScore = buildPriorityScore({
    payoffScore,
    projectedReadinessScore: projected.projectedReadinessScore,
    projectedConfidenceScore: projected.projectedConfidenceScore,
    projectedRepairPriorityScore: projected.projectedRepairPriorityScore,
    projectedDriftSeverityScore: projected.projectedDriftSeverityScore,
  });

  return {
    familyId: params.familyId,
    scenarioType: params.scenarioType,
    label: params.label,
    estimatedConfidenceGain: round1(params.estimatedConfidenceGain),
    estimatedReadinessGain: round1(params.estimatedReadinessGain),
    estimatedRepairPressureDrop: round1(params.estimatedRepairPressureDrop),
    estimatedDriftReduction: round1(params.estimatedDriftReduction),
    estimatedStabilityGain: round1(params.estimatedStabilityGain),
    projectedConfidenceScore: projected.projectedConfidenceScore,
    projectedReadinessScore: projected.projectedReadinessScore,
    projectedRepairPriorityScore: projected.projectedRepairPriorityScore,
    projectedDriftSeverityScore: projected.projectedDriftSeverityScore,
    projectedStabilityScore: projected.projectedStabilityScore,
    payoffScore,
    impactScore,
    priorityScore,
    summary: params.summary,
  };
}

export function buildMomentRepairSimulationResult(
  params: BuildRepairSimulationParams
): RepairSimulationResult {
  const familyId = normalizeText(params.familyId) || "unknown-family";

  const baselineConfidenceScore = round1(
    clamp100(params.runtimeDiagnostic?.confidenceScore ?? 0)
  );
  const baselineReadinessScore = round1(
    clamp100(params.runtimeDiagnostic?.readinessScore ?? 0)
  );
  const baselineRepairPriorityScore = Number(
    clampNonNegative(params.runtimeDiagnostic?.repairPriorityScore ?? 0).toFixed(1)
  );
  const baselineDriftSeverityScore = Number(
    clampNonNegative(params.runtimeDiagnostic?.driftSeverityScore ?? 0).toFixed(1)
  );
  const baselineStabilityScore = getBaselineStabilityScore(
    params.stabilityFamilyRow
  );

  const missingActions = clampCount(params.actionSummaryRow?.missingActions);
  const nearActions = clampCount(params.actionSummaryRow?.nearActions);
  const presentActions = clampCount(params.actionSummaryRow?.presentActions);
  const totalActions = clampCount(params.actionSummaryRow?.totalActions);

  const unstableCount = clampCount(params.driftFamilyRow?.unstableCount);
  const comparedMemberCount = clampCount(
    params.driftFamilyRow?.comparedMemberCount
  );

  const repeatCoverage = clamp100(params.stabilityFamilyRow?.repeatCoverage ?? 0);
  const structuralConfidence = clamp100(
    params.stabilityFamilyRow?.structuralConfidence ?? 0
  );
  const stabilityScore = clamp100(params.stabilityFamilyRow?.stabilityScore ?? 0);

  const repairPriorityScore = clampNonNegative(
    params.repairQueueRow?.repairPriorityScore ??
      params.runtimeDiagnostic?.repairPriorityScore ??
      0
  );

  const topConfidence = clamp01(params.actionSummaryRow?.topConfidence ?? 0) * 100;

  const actionCoverageRatio =
    totalActions > 0 ? (presentActions + nearActions * 0.5) / totalActions : 0;

  const confirmedCoverageRatio =
    totalActions > 0 ? presentActions / totalActions : 0;

  const driftRatio =
    comparedMemberCount > 0 ? unstableCount / comparedMemberCount : 0;

  const repeatGap = Math.max(0, 85 - repeatCoverage);
  const structuralGap = Math.max(0, 80 - structuralConfidence);
  const stabilityGap = Math.max(0, 75 - stabilityScore);
  const confidenceGap = Math.max(0, 75 - baselineConfidenceScore);
  const readinessGap = Math.max(0, 78 - baselineReadinessScore);

  const scenarios: RepairSimulationScenario[] = [];

  if (missingActions > 0) {
    pushScenarioIfUseful({
      scenarios,
      familyId,
      scenarioType: "fill-missing-actions",
      label: "Fill missing actions",
      baselineConfidenceScore,
      baselineReadinessScore,
      baselineRepairPriorityScore,
      baselineDriftSeverityScore,
      baselineStabilityScore,
      estimatedConfidenceGain:
        missingActions * 7 +
        (1 - confirmedCoverageRatio) * 8 +
        confidenceGap * 0.08,
      estimatedReadinessGain:
        missingActions * 8.5 +
        readinessGap * 0.1 +
        (1 - actionCoverageRatio) * 6,
      estimatedRepairPressureDrop: Math.min(
        repairPriorityScore,
        missingActions * 3.8 + (repairPriorityScore >= 10 ? 1.5 : 0)
      ),
      estimatedDriftReduction: Math.min(
        baselineDriftSeverityScore,
        missingActions * 1.4 + driftRatio * 5
      ),
      estimatedStabilityGain:
        missingActions * 4.2 +
        stabilityGap * 0.06 +
        (repeatGap > 0 ? 2 : 0),
      summary:
        "Simulates filling missing intended occurrences first so baseline coverage and readiness can recover quickly.",
    });
  }

  if (nearActions > 0) {
    pushScenarioIfUseful({
      scenarios,
      familyId,
      scenarioType: "tighten-near-actions",
      label: "Tighten near actions",
      baselineConfidenceScore,
      baselineReadinessScore,
      baselineRepairPriorityScore,
      baselineDriftSeverityScore,
      baselineStabilityScore,
      estimatedConfidenceGain:
        nearActions * 4.8 +
        confidenceGap * 0.05 +
        (driftRatio > 0 ? 1.5 : 0),
      estimatedReadinessGain:
        nearActions * 5.6 +
        readinessGap * 0.05 +
        (repeatGap > 0 ? 1.5 : 0),
      estimatedRepairPressureDrop: Math.min(
        repairPriorityScore,
        nearActions * 2.4 + driftRatio * 2
      ),
      estimatedDriftReduction: Math.min(
        baselineDriftSeverityScore,
        nearActions * 3.1 + driftRatio * 8
      ),
      estimatedStabilityGain:
        nearActions * 3.4 + stabilityGap * 0.04 + (structuralGap > 0 ? 1 : 0),
      summary:
        "Simulates tightening near placements so ambiguous action matches become cleaner and more trustworthy.",
    });
  }

  if (unstableCount > 0 || baselineDriftSeverityScore >= 35) {
    pushScenarioIfUseful({
      scenarios,
      familyId,
      scenarioType: "reduce-drift",
      label: "Reduce phrase drift",
      baselineConfidenceScore,
      baselineReadinessScore,
      baselineRepairPriorityScore,
      baselineDriftSeverityScore,
      baselineStabilityScore,
      estimatedConfidenceGain:
        driftRatio * 16 +
        baselineDriftSeverityScore * 0.06 +
        (structuralGap > 0 ? 2 : 0),
      estimatedReadinessGain:
        driftRatio * 20 +
        baselineDriftSeverityScore * 0.1 +
        readinessGap * 0.05,
      estimatedRepairPressureDrop: Math.min(
        repairPriorityScore,
        unstableCount * 2.2 + driftRatio * 5
      ),
      estimatedDriftReduction: Math.min(
        baselineDriftSeverityScore,
        driftRatio * 46 + unstableCount * 1.8 + baselineDriftSeverityScore * 0.12
      ),
      estimatedStabilityGain:
        driftRatio * 15 +
        stabilityGap * 0.08 +
        (repeatGap > 0 ? 2 : 0),
      summary:
        "Simulates repairing unstable phrase members first so drift pressure drops and downstream trust can recover.",
    });
  }

  if (repeatCoverage < 85 || stabilityScore < 70) {
    pushScenarioIfUseful({
      scenarios,
      familyId,
      scenarioType: "improve-repeat-coverage",
      label: "Improve repeat coverage",
      baselineConfidenceScore,
      baselineReadinessScore,
      baselineRepairPriorityScore,
      baselineDriftSeverityScore,
      baselineStabilityScore,
      estimatedConfidenceGain:
        repeatGap * 0.12 +
        stabilityGap * 0.08 +
        (totalActions > 0 ? 2 : 0),
      estimatedReadinessGain:
        repeatGap * 0.22 +
        readinessGap * 0.06 +
        (stabilityGap > 0 ? 2.5 : 0),
      estimatedRepairPressureDrop: Math.min(
        repairPriorityScore,
        repeatGap * 0.08 + (repairPriorityScore >= 8 ? 1.5 : 0)
      ),
      estimatedDriftReduction: Math.min(
        baselineDriftSeverityScore,
        repeatGap * 0.07 + driftRatio * 4
      ),
      estimatedStabilityGain:
        repeatGap * 0.26 + stabilityGap * 0.18 + 4,
      summary:
        "Simulates strengthening repeat coverage so the family pattern locks more consistently across expected placements.",
    });
  }

  if (structuralConfidence < 80 || baselineConfidenceScore < 70) {
    pushScenarioIfUseful({
      scenarios,
      familyId,
      scenarioType: "confidence-reinforcement",
      label: "Reinforce confidence signals",
      baselineConfidenceScore,
      baselineReadinessScore,
      baselineRepairPriorityScore,
      baselineDriftSeverityScore,
      baselineStabilityScore,
      estimatedConfidenceGain:
        structuralGap * 0.24 +
        confidenceGap * 0.18 +
        (topConfidence < 60 ? 4 : 2),
      estimatedReadinessGain:
        structuralGap * 0.14 +
        readinessGap * 0.08 +
        (stabilityGap > 0 ? 2 : 0),
      estimatedRepairPressureDrop: Math.min(
        repairPriorityScore,
        structuralGap * 0.06 + (repairPriorityScore >= 7 ? 1 : 0)
      ),
      estimatedDriftReduction: Math.min(
        baselineDriftSeverityScore,
        structuralGap * 0.05 + (driftRatio > 0 ? 2 : 0)
      ),
      estimatedStabilityGain:
        structuralGap * 0.16 + stabilityGap * 0.08 + 2,
      summary:
        "Simulates reinforcing structural evidence and consistency so confidence can rise without forcing a full rebuild.",
    });
  }

  const combinedSignalWeight =
    missingActions * 1.2 +
    nearActions * 0.8 +
    unstableCount * 1.1 +
    repeatGap * 0.06 +
    structuralGap * 0.05 +
    stabilityGap * 0.05 +
    confidenceGap * 0.04 +
    readinessGap * 0.04;

  if (combinedSignalWeight > 0) {
    pushScenarioIfUseful({
      scenarios,
      familyId,
      scenarioType: "combined-first-pass",
      label: "Combined first-pass repair",
      baselineConfidenceScore,
      baselineReadinessScore,
      baselineRepairPriorityScore,
      baselineDriftSeverityScore,
      baselineStabilityScore,
      estimatedConfidenceGain:
        missingActions * 4.4 +
        nearActions * 2.7 +
        driftRatio * 8 +
        structuralGap * 0.12 +
        confidenceGap * 0.08,
      estimatedReadinessGain:
        missingActions * 5.3 +
        nearActions * 3.2 +
        driftRatio * 11 +
        repeatGap * 0.16 +
        readinessGap * 0.08,
      estimatedRepairPressureDrop: Math.min(
        repairPriorityScore,
        missingActions * 2.6 +
          nearActions * 1.6 +
          unstableCount * 1.4 +
          repeatGap * 0.05 +
          3
      ),
      estimatedDriftReduction: Math.min(
        baselineDriftSeverityScore,
        driftRatio * 30 +
          nearActions * 2.2 +
          missingActions * 1.2 +
          4
      ),
      estimatedStabilityGain:
        missingActions * 2.7 +
        nearActions * 2.1 +
        repeatGap * 0.14 +
        structuralGap * 0.1 +
        stabilityGap * 0.08 +
        3,
      summary:
        "Simulates a practical first-pass bundle: close obvious coverage gaps, tighten near matches, and reduce top drift pressure together.",
    });
  }

  scenarios.sort(compareScenarios);

  return {
    familyId,
    baselineConfidenceScore,
    baselineReadinessScore,
    baselineRepairPriorityScore,
    baselineDriftSeverityScore,
    baselineStabilityScore,
    scenarios,
    bestScenario: scenarios[0] ?? null,
    bestPriorityScore: scenarios[0]?.priorityScore ?? 0,
    totalScenarioCount: scenarios.length,
  };
}