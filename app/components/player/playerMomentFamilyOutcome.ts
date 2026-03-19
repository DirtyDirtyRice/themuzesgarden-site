import { buildFamilyOutcome } from "./playerMomentFamilyOutcome.builders";

import type {
  BuildFamilyOutcomeParams,
  FamilyOutcomeExecution,
  FamilyOutcomeResult,
  FamilyOutcomeSignal,
  FamilyOutcomeTrustChange,
} from "./playerMomentFamilyOutcome.types";

export type {
  BuildFamilyOutcomeParams,
  FamilyOutcomeExecution,
  FamilyOutcomeResult,
  FamilyOutcomeSignal,
  FamilyOutcomeTrustChange,
} from "./playerMomentFamilyOutcome.types";

export { buildFamilyOutcome };

export function buildMomentFamilyOutcome(
  params: BuildFamilyOutcomeParams
): FamilyOutcomeResult {
  return buildFamilyOutcome(params);
}