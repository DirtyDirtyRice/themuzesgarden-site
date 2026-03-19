import type {
  FamilyOrchestratorState,
  RunFamilyOrchestratorParams,
} from "./playerMomentFamilyOrchestrator.types";

import {
  normalizeNumber,
  normalizeText,
} from "./playerMomentFamilyOrchestrator.shared";

export function runFamilyOrchestrator(
  params: RunFamilyOrchestratorParams
): FamilyOrchestratorState {

  const familyId = normalizeText(params.familyId) || "unknown-family";

  const outcomeScore = normalizeNumber(params.outcomeScore);
  const learningScore = normalizeNumber(params.learningScore);
  const optimizationScore = normalizeNumber(params.optimizationScore);
  const repairScore = normalizeNumber(params.repairScore);

  const outcomeLabel = normalizeText(params.outcomeLabel);
  const learningLabel = normalizeText(params.learningLabel);
  const optimizationLabel = normalizeText(params.optimizationLabel);
  const repairLabel = normalizeText(params.repairLabel);

  return {
    familyId,

    outcomeScore,
    learningScore,
    optimizationScore,
    repairScore,

    outcomeLabel,
    learningLabel,
    optimizationLabel,
    repairLabel,
  };
}