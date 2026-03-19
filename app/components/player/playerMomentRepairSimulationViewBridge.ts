import type { RepairSimulationScenario } from "./playerMomentRepairSimulation.types";
import {
  toScenarioLabel,
  toWholePercent,
  toWholeScore,
} from "./playerMomentRepairSimulationViewHelpers";
import type {
  BuildRepairSimulationViewParams,
  RepairSimulationFamilySummary,
  RepairSimulationScenarioRow,
  RepairSimulationViewModel,
} from "./playerMomentRepairSimulationViewTypes";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function clampNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function clamp100(value: unknown): number {
  const n = clampNumber(value);
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function getScenarioConfidence(scenario: RepairSimulationScenario): number {
  return clamp100(scenario.projectedConfidenceScore);
}

function getScenarioExpectedImprovement(scenario: RepairSimulationScenario): number {
  return clamp100(
    scenario.impactScore > 0
      ? scenario.impactScore
      : scenario.payoffScore
  );
}

function getScenarioRisk(scenario: RepairSimulationScenario): number {
  return clamp100(
    scenario.projectedRepairPriorityScore * 0.75 +
      scenario.projectedDriftSeverityScore * 0.25
  );
}

function getScenarioPriorityScore(row: RepairSimulationScenarioRow): number {
  const improvement = clamp100(row.expectedImprovement);
  const confidence = clamp100(row.confidence);
  const risk = clamp100(row.risk);

  const raw = improvement * 0.52 + confidence * 0.33 - risk * 0.24;

  return Math.round(raw * 10) / 10;
}

function compareScenarioRows(
  a: RepairSimulationScenarioRow,
  b: RepairSimulationScenarioRow
): number {
  const aPriority = getScenarioPriorityScore(a);
  const bPriority = getScenarioPriorityScore(b);

  if (bPriority !== aPriority) {
    return bPriority - aPriority;
  }

  if (b.expectedImprovement !== a.expectedImprovement) {
    return b.expectedImprovement - a.expectedImprovement;
  }

  if (b.confidence !== a.confidence) {
    return b.confidence - a.confidence;
  }

  if (a.risk !== b.risk) {
    return a.risk - b.risk;
  }

  if (a.familyId !== b.familyId) {
    return a.familyId.localeCompare(b.familyId);
  }

  return a.label.localeCompare(b.label);
}

function normalizeScenarioRows(
  scenarios: RepairSimulationScenario[]
): RepairSimulationScenarioRow[] {
  return scenarios
    .map((scenario) => ({
      familyId: normalizeText(scenario.familyId) || "unknown",
      scenarioType: scenario.scenarioType,
      confidence: toWholePercent(getScenarioConfidence(scenario)),
      expectedImprovement: toWholeScore(
        getScenarioExpectedImprovement(scenario)
      ),
      risk: toWholeScore(getScenarioRisk(scenario)),
      label:
        normalizeText(scenario.label) ||
        toScenarioLabel(String(scenario.scenarioType ?? "")),
    }))
    .sort(compareScenarioRows);
}

function buildFamilySummaries(
  rows: RepairSimulationScenarioRow[]
): RepairSimulationFamilySummary[] {
  const map = new Map<string, RepairSimulationFamilySummary>();
  const bestPriorityByFamily = new Map<string, number>();
  const lowestRiskByFamily = new Map<string, number>();

  for (const row of rows) {
    const familyId = row.familyId || "unknown";
    const priority = getScenarioPriorityScore(row);

    const existing = map.get(familyId);
    if (!existing) {
      map.set(familyId, {
        familyId,
        totalScenarios: 1,
        bestImprovement: row.expectedImprovement,
        highestConfidence: row.confidence,
        highestRisk: row.risk,
      });
      bestPriorityByFamily.set(familyId, priority);
      lowestRiskByFamily.set(familyId, row.risk);
      continue;
    }

    existing.totalScenarios += 1;

    if (row.expectedImprovement > existing.bestImprovement) {
      existing.bestImprovement = row.expectedImprovement;
    }

    if (row.confidence > existing.highestConfidence) {
      existing.highestConfidence = row.confidence;
    }

    if (row.risk > existing.highestRisk) {
      existing.highestRisk = row.risk;
    }

    if (priority > (bestPriorityByFamily.get(familyId) ?? -Infinity)) {
      bestPriorityByFamily.set(familyId, priority);
    }

    if (row.risk < (lowestRiskByFamily.get(familyId) ?? Infinity)) {
      lowestRiskByFamily.set(familyId, row.risk);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const aPriority = bestPriorityByFamily.get(a.familyId) ?? -Infinity;
    const bPriority = bestPriorityByFamily.get(b.familyId) ?? -Infinity;

    if (bPriority !== aPriority) {
      return bPriority - aPriority;
    }

    if (b.bestImprovement !== a.bestImprovement) {
      return b.bestImprovement - a.bestImprovement;
    }

    if (b.highestConfidence !== a.highestConfidence) {
      return b.highestConfidence - a.highestConfidence;
    }

    const aLowestRisk = lowestRiskByFamily.get(a.familyId) ?? Infinity;
    const bLowestRisk = lowestRiskByFamily.get(b.familyId) ?? Infinity;

    if (aLowestRisk !== bLowestRisk) {
      return aLowestRisk - bLowestRisk;
    }

    return a.familyId.localeCompare(b.familyId);
  });
}

export function buildRepairSimulationViewModel(
  params: BuildRepairSimulationViewParams
): RepairSimulationViewModel {
  const scenarios = Array.isArray(params.result?.scenarios)
    ? params.result.scenarios
    : [];

  const rows = normalizeScenarioRows(scenarios);

  return {
    rows,
    familySummaries: buildFamilySummaries(rows),
  };
}