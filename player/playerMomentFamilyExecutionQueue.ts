import { buildFamilyExecutionQueue } from "./playerMomentFamilyExecutionQueue.builders";

import type {
  BuildFamilyExecutionQueueParams,
  FamilyExecutionBlockReason,
  FamilyExecutionQueueItem,
  FamilyExecutionQueueResult,
  FamilyExecutionReason,
  FamilyExecutionState,
} from "./playerMomentFamilyExecutionQueue.types";

/*
Family Execution Queue Engine — Public API

This file exposes the stable entry point for the Family Execution Queue Engine
while keeping builder internals private.
*/

export type {
  BuildFamilyExecutionQueueParams,
  FamilyExecutionBlockReason,
  FamilyExecutionQueueItem,
  FamilyExecutionQueueResult,
  FamilyExecutionReason,
  FamilyExecutionState,
} from "./playerMomentFamilyExecutionQueue.types";

export function buildMomentFamilyExecutionQueue(
  params: BuildFamilyExecutionQueueParams
): FamilyExecutionQueueResult {
  return buildFamilyExecutionQueue(params);
}