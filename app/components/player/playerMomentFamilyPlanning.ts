import { buildFamilyPlanning } from "./playerMomentFamilyPlanning.builders";

import type {
  BuildFamilyPlanningParams,
  FamilyPlanningAction,
  FamilyPlanningHorizon,
  FamilyPlanningItem,
  FamilyPlanningReason,
  FamilyPlanningResult,
} from "./playerMomentFamilyPlanning.types";

/*
Family Planning Engine — Public API

This file exposes the stable entry point for the Family Planning Engine
while keeping builder internals private.
*/

export type {
  BuildFamilyPlanningParams,
  FamilyPlanningAction,
  FamilyPlanningHorizon,
  FamilyPlanningItem,
  FamilyPlanningReason,
  FamilyPlanningResult,
} from "./playerMomentFamilyPlanning.types";

export function buildMomentFamilyPlanning(
  params: BuildFamilyPlanningParams
): FamilyPlanningResult {
  return buildFamilyPlanning(params);
}