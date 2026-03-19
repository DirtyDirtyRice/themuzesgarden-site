import { buildFamilyDiscovery } from "./playerMomentFamilyDiscovery.builders";

import type {
  BuildFamilyDiscoveryParams,
  FamilyDiscoveryRank,
  FamilyDiscoveryReason,
  FamilyDiscoveryResult,
  FamilyKeeperStatus,
  FamilySurfaceStatus,
} from "./playerMomentFamilyDiscovery.types";

/*
Family Discovery Engine — Public API

This file exposes the stable entry point for the Family Discovery Engine
while keeping internal builder logic private.
*/

export type {
  BuildFamilyDiscoveryParams,
  FamilyDiscoveryRank,
  FamilyDiscoveryReason,
  FamilyDiscoveryResult,
  FamilyKeeperStatus,
  FamilySurfaceStatus,
} from "./playerMomentFamilyDiscovery.types";

export function buildMomentFamilyDiscovery(
  params: BuildFamilyDiscoveryParams
): FamilyDiscoveryResult {
  return buildFamilyDiscovery(params);
}