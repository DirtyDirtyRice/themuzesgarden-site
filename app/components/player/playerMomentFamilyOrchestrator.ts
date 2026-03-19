import { runFamilyOrchestrator as runFamilyOrchestratorBuilder } from "./playerMomentFamilyOrchestrator.builders";

import type {
  FamilyOrchestratorState,
  RunFamilyOrchestratorParams,
} from "./playerMomentFamilyOrchestrator.types";

export type {
  FamilyOrchestratorState,
  RunFamilyOrchestratorParams,
} from "./playerMomentFamilyOrchestrator.types";

export function runFamilyOrchestrator(
  params: RunFamilyOrchestratorParams
): FamilyOrchestratorState {
  return runFamilyOrchestratorBuilder(params);
}

export const runMomentFamilyOrchestrator = runFamilyOrchestrator;