import {
  buildFamilyLineage,
  buildFamilyLineageSnapshot,
} from "./playerMomentFamilyLineage.builders";

import type {
  BuildFamilyLineageParams,
  BuildFamilyLineageSnapshotParams,
  FamilyLineageDirection,
  FamilyLineageResult,
  FamilyLineageSnapshot,
  FamilyLineageTransition,
} from "./playerMomentFamilyLineage.types";

/*
Family Lineage Engine — Public API

This file exposes the stable entry points for lineage snapshot creation
and lineage aggregation while keeping builder internals private.
*/

export type {
  BuildFamilyLineageParams,
  BuildFamilyLineageSnapshotParams,
  FamilyLineageDirection,
  FamilyLineageResult,
  FamilyLineageSnapshot,
  FamilyLineageTransition,
} from "./playerMomentFamilyLineage.types";

export function buildMomentFamilyLineageSnapshot(
  params: BuildFamilyLineageSnapshotParams
): FamilyLineageSnapshot {
  return buildFamilyLineageSnapshot(params);
}

export function buildMomentFamilyLineage(
  params: BuildFamilyLineageParams
): FamilyLineageResult {
  return buildFamilyLineage(params);
}