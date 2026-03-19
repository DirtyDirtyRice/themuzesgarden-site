import { buildRepairImpactResult } from "./playerMomentRepairImpact.builders";

import type {
  BuildRepairImpactParams,
  RepairImpactLevel,
  RepairImpactResult,
  RepairImpactScenario,
} from "./playerMomentRepairImpact.types";

export type {
  BuildRepairImpactParams,
  RepairImpactLevel,
  RepairImpactResult,
  RepairImpactScenario,
} from "./playerMomentRepairImpact.types";

export function buildMomentRepairImpact(
  params: BuildRepairImpactParams
): RepairImpactResult {
  return buildRepairImpactResult(params);
}