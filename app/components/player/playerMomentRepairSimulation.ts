import { buildMomentRepairSimulationResult } from "./playerMomentRepairSimulation.builders";

import type {
  BuildRepairSimulationParams,
  RepairSimulationResult,
  RepairSimulationScenario,
  RepairSimulationScenarioType,
} from "./playerMomentRepairSimulation.types";

export type {
  BuildRepairSimulationParams,
  RepairSimulationResult,
  RepairSimulationScenario,
  RepairSimulationScenarioType,
} from "./playerMomentRepairSimulation.types";

export function buildMomentRepairSimulation(
  params: BuildRepairSimulationParams
): RepairSimulationResult {
  return buildMomentRepairSimulationResult(params);
}