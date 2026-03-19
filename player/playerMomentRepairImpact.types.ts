import type {
  RepairSimulationResult,
  RepairSimulationScenario,
  RepairSimulationScenarioType,
} from "./playerMomentRepairSimulation.types";

export type RepairImpactLevel =
  | "low"
  | "moderate"
  | "strong"
  | "high"
  | "transformative";

export type RepairImpactScenario = {
  familyId: string;
  scenarioType: RepairSimulationScenarioType;
  label: string;
  impactScore: number;
  impactLevel: RepairImpactLevel;
  executionRiskScore: number;
  efficiencyScore: number;
  confidenceLiftScore: number;
  readinessLiftScore: number;
  stabilityLiftScore: number;
  driftReliefScore: number;
  repairReliefScore: number;
  summary: string;
  sourceScenario: RepairSimulationScenario;
};

export type RepairImpactResult = {
  familyId: string;
  baselinePayoffScore: number;
  bestImpactScore: number;
  bestImpactLevel: RepairImpactLevel;
  averageImpactScore: number;
  scenarioCount: number;
  bestScenario: RepairImpactScenario | null;
  scenarios: RepairImpactScenario[];
  sourceResult: RepairSimulationResult;
};

export type BuildRepairImpactParams = {
  result: RepairSimulationResult;
};