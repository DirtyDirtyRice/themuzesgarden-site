import { buildFamilyTrustState } from "./playerMomentFamilyTrustState.builders";

import type {
  BuildFamilyTrustStateParams,
  FamilyTrustLevel,
  FamilyTrustReason,
  FamilyTrustStateResult,
  FamilyTrustSummaryRow,
} from "./playerMomentFamilyTrustState.types";

/*
Family Trust Engine — Public API

This file acts as the stable entry point for the Family Trust Engine.
Internal scoring logic lives in the builders module.

Keeping this wrapper thin allows the engine to evolve internally
without breaking other systems that consume trust state results.
*/

export type {
  BuildFamilyTrustStateParams,
  FamilyTrustLevel,
  FamilyTrustReason,
  FamilyTrustStateResult,
  FamilyTrustSummaryRow,
} from "./playerMomentFamilyTrustState.types";

export function buildMomentFamilyTrustState(
  params: BuildFamilyTrustStateParams
): FamilyTrustStateResult {
  return buildFamilyTrustState(params);
}