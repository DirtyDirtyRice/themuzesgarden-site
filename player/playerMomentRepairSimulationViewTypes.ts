import type {
  RepairSimulationResult,
  RepairSimulationScenarioType,
} from "./playerMomentRepairSimulation.types";

export type RepairSimulationScenarioRow = {
  familyId: string;
  scenarioType: RepairSimulationScenarioType;
  confidence: number;
  expectedImprovement: number;
  risk: number;
  label: string;
};

export type RepairSimulationFamilySummary = {
  familyId: string;
  totalScenarios: number;
  bestImprovement: number;
  highestConfidence: number;
  highestRisk: number;
};

export type RepairSimulationViewModel = {
  rows: RepairSimulationScenarioRow[];
  familySummaries: RepairSimulationFamilySummary[];
};

export type BuildRepairSimulationViewParams = {
  result: RepairSimulationResult;
};