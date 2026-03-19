import type {
  MomentInspectorPinnedFamiliesResult,
  MomentInspectorPinnedFamiliesState,
  MomentInspectorPinnedFamiliesSummary,
} from "./momentInspectorPinnedFamilies.types";
import {
  buildMomentInspectorPinnedFamiliesResult,
  buildMomentInspectorPinnedFamiliesSummary,
  normalizePinnedFamilyIds,
  togglePinnedFamilyId,
} from "./momentInspectorPinnedFamilies.utils";

export function createMomentInspectorPinnedFamiliesState(
  pinnedFamilyIds?: unknown[],
  pinnedOnly?: unknown
): MomentInspectorPinnedFamiliesState {
  return {
    pinnedFamilyIds: normalizePinnedFamilyIds(
      Array.isArray(pinnedFamilyIds) ? pinnedFamilyIds : []
    ),
    pinnedOnly: Boolean(pinnedOnly),
  };
}

export function toggleMomentInspectorPinnedFamily(
  currentState: MomentInspectorPinnedFamiliesState,
  familyId: unknown
): MomentInspectorPinnedFamiliesState {
  return {
    ...currentState,
    pinnedFamilyIds: togglePinnedFamilyId(currentState.pinnedFamilyIds, familyId),
  };
}

export function setMomentInspectorPinnedOnly(
  currentState: MomentInspectorPinnedFamiliesState,
  pinnedOnly: unknown
): MomentInspectorPinnedFamiliesState {
  return {
    ...currentState,
    pinnedOnly: Boolean(pinnedOnly),
  };
}

export function resetMomentInspectorPinnedFamiliesState(): MomentInspectorPinnedFamiliesState {
  return createMomentInspectorPinnedFamiliesState([], false);
}

export function buildMomentInspectorPinnedFamiliesStateResult<
  TFamily extends {
    familyId: string;
  }
>(
  families: TFamily[],
  state: MomentInspectorPinnedFamiliesState
): MomentInspectorPinnedFamiliesResult<TFamily> {
  return buildMomentInspectorPinnedFamiliesResult(
    families,
    state.pinnedFamilyIds,
    state.pinnedOnly
  );
}

export function buildMomentInspectorPinnedFamiliesStateSummary<
  TFamily extends {
    familyId: string;
  }
>(
  families: TFamily[],
  state: MomentInspectorPinnedFamiliesState
): MomentInspectorPinnedFamiliesSummary {
  return buildMomentInspectorPinnedFamiliesSummary(
    families,
    state.pinnedFamilyIds,
    state.pinnedOnly
  );
}