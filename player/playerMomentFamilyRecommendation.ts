import { buildFamilyRecommendation } from "./playerMomentFamilyRecommendation.builders";

import type {
  BuildFamilyRecommendationParams,
  FamilyRecommendationAction,
  FamilyRecommendationPriority,
  FamilyRecommendationReason,
  FamilyRecommendationResult,
} from "./playerMomentFamilyRecommendation.types";

/*
Family Recommendation Engine — Public API

This file exposes the stable entry point for the Family Recommendation Engine
while keeping internal builder logic private.
*/

export type {
  BuildFamilyRecommendationParams,
  FamilyRecommendationAction,
  FamilyRecommendationPriority,
  FamilyRecommendationReason,
  FamilyRecommendationResult,
} from "./playerMomentFamilyRecommendation.types";

export function buildMomentFamilyRecommendation(
  params: BuildFamilyRecommendationParams
): FamilyRecommendationResult {
  return buildFamilyRecommendation(params);
}