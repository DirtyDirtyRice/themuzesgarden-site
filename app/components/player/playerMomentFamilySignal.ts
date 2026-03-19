import { buildFamilySignal } from "./playerMomentFamilySignal.builders";

import type {
  BuildFamilySignalParams,
  FamilyReuseReadiness,
  FamilySignalReason,
  FamilySignalResult,
  FamilySignalStrength,
} from "./playerMomentFamilySignal.types";

/*
Family Signal Engine — Public API

This file exposes the stable entry point for the Family Signal Engine
while keeping internal builder logic private.
*/

export type {
  BuildFamilySignalParams,
  FamilyReuseReadiness,
  FamilySignalReason,
  FamilySignalResult,
  FamilySignalStrength,
} from "./playerMomentFamilySignal.types";

export function buildMomentFamilySignal(
  params: BuildFamilySignalParams
): FamilySignalResult {
  return buildFamilySignal(params);
}