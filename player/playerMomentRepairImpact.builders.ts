import type {
  BuildRepairImpactParams,
  RepairImpactResult,
  RepairImpactScenario,
} from "./playerMomentRepairImpact.types";

import {
  average,
  clamp100,
  getImpactLevel,
  round1,
  scoreEfficiency,
  scoreExecutionRisk,
  scoreLift,
} from "./playerMomentRepairImpact.shared";

import type { RepairSimulationScenario } from "./playerMomentRepairSimulation.types";

function buildImpactScenario(
  familyId: string,
  scenario: RepairSimulationScenario
): RepairImpactScenario {
  const confidenceLiftScore = scoreLift({
    gain: scenario.estimatedConfidenceGain,
    projected: scenario.projectedConfidenceScore,
  });

  const readinessLiftScore = scoreLift({
    gain: scenario.estimatedReadinessGain,
    projected: scenario.projectedReadinessScore,
  });

  const stabilityLiftScore = scoreLift({
    gain: scenario.estimatedStabilityGain,
    projected: scenario.projectedStabilityScore ?? 0,
  });

  const driftReliefScore = scoreLift({
    gain: scenario.estimatedDriftReduction,
    projected: 100 - scenario.projectedDriftSeverityScore,
  });

  const repairReliefScore = scoreLift({
    gain: scenario.estimatedRepairPressureDrop,
    projected: 100 - scenario.projectedRepairPriorityScore,
  });

  const efficiencyScore = scoreEfficiency({
    payoffScore: scenario.payoffScore,
    repairPriorityScore: scenario.projectedRepairPriorityScore,
  });

  const executionRiskScore = scoreExecutionRisk({
    driftSeverityScore: scenario.projectedDriftSeverityScore,
    repairPriorityScore: scenario.projectedRepairPriorityScore,
  });

  const impactScore = clamp100(
    round1(
      confidenceLiftScore * 0.18 +
        readinessLiftScore * 0.2 +
        stabilityLiftScore * 0.18 +
        driftReliefScore * 0.16 +
        repairReliefScore * 0.16 +
        efficiencyScore * 0.12 -
        executionRiskScore * 0.08
    )
  );

  return {
    familyId,
    scenarioType: scenario.scenarioType,
    label: scenario.label,
    impactScore,
    impactLevel: getImpactLevel(impactScore),
    executionRiskScore,
    efficiencyScore,
    confidenceLiftScore,
    readinessLiftScore,
    stabilityLiftScore,
    driftReliefScore,
    repairReliefScore,
    summary: scenario.summary,
    sourceScenario: scenario,
  };
}

function compareImpact(a: RepairImpactScenario, b: RepairImpactScenario) {
  if (b.impactScore !== a.impactScore) {
    return b.impactScore - a.impactScore;
  }

  if (a.executionRiskScore !== b.executionRiskScore) {
    return a.executionRiskScore - b.executionRiskScore;
  }

  return a.label.localeCompare(b.label);
}

export function buildRepairImpactResult(
  params: BuildRepairImpactParams
): RepairImpactResult {
  const result = params.result;

  const familyId = String(result.familyId ?? "").trim();

  const scenarios = result.scenarios.map((scenario) =>
    buildImpactScenario(familyId, scenario)
  );

  scenarios.sort(compareImpact);

  const bestScenario = scenarios[0] ?? null;

  const averageImpactScore = round1(
    average(scenarios.map((s) => s.impactScore))
  );

  const bestImpactScore = bestScenario?.impactScore ?? 0;

  return {
    familyId,
    baselinePayoffScore: result.bestScenario?.payoffScore ?? 0,
    bestImpactScore,
    bestImpactLevel: getImpactLevel(bestImpactScore),
    averageImpactScore,
    scenarioCount: scenarios.length,
    bestScenario,
    scenarios,
    sourceResult: result,
  };
}