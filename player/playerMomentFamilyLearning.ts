import { buildFamilyLearning } from "./playerMomentFamilyLearning.builders";

import type {
  BuildFamilyLearningParams,
  FamilyLearningResult,
  FamilyLearningSignals,
  FamilyLearningTrustImpact,
} from "./playerMomentFamilyLearning.types";

export type {
  BuildFamilyLearningParams,
  FamilyLearningResult,
  FamilyLearningSignals,
  FamilyLearningTrustImpact,
} from "./playerMomentFamilyLearning.types";

export { buildFamilyLearning };

export function buildMomentFamilyLearning(
  params: BuildFamilyLearningParams
): FamilyLearningResult {
  return buildFamilyLearning(params);
}