import { buildFamilyStrategy } from "./playerMomentFamilyStrategy.builders";

import type {
  BuildFamilyStrategyParams,
  FamilyStrategyAction,
  FamilyStrategyHorizon,
  FamilyStrategyItem,
  FamilyStrategyReason,
  FamilyStrategyResult,
} from "./playerMomentFamilyStrategy.types";

/*
Family Strategy Engine — Public API

This file exposes the stable entry point for the Family Strategy Engine
while keeping builder internals private.
*/

export type {
  BuildFamilyStrategyParams,
  FamilyStrategyAction,
  FamilyStrategyHorizon,
  FamilyStrategyItem,
  FamilyStrategyReason,
  FamilyStrategyResult,
} from "./playerMomentFamilyStrategy.types";

export function buildMomentFamilyStrategy(
  params: BuildFamilyStrategyParams
): FamilyStrategyResult {
  return buildFamilyStrategy(params);
}