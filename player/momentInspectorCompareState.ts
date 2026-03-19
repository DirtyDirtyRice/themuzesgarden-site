import type {
  MomentInspectorCompareFamilyOption,
  MomentInspectorCompareState,
} from "./momentInspectorCompare.types";
import {
  getCompareFamilyIdFromOption,
  getCompareFamilyOptions,
  normalizeCompareFamilyId,
} from "./momentInspectorCompare.utils";

export function createMomentInspectorCompareState(
  primaryFamilyId?: unknown,
  secondaryFamilyId?: unknown
): MomentInspectorCompareState {
  return {
    primaryFamilyId: normalizeCompareFamilyId(primaryFamilyId),
    secondaryFamilyId: normalizeCompareFamilyId(secondaryFamilyId),
  };
}

export function setMomentInspectorComparePrimaryFamily(
  state: MomentInspectorCompareState,
  familyId: unknown
): MomentInspectorCompareState {
  return {
    ...state,
    primaryFamilyId: normalizeCompareFamilyId(familyId),
  };
}

export function setMomentInspectorCompareSecondaryFamily(
  state: MomentInspectorCompareState,
  familyId: unknown
): MomentInspectorCompareState {
  return {
    ...state,
    secondaryFamilyId: normalizeCompareFamilyId(familyId),
  };
}

export function syncMomentInspectorCompareState(params: {
  state: MomentInspectorCompareState;
  familyOptions: MomentInspectorCompareFamilyOption[];
}): MomentInspectorCompareState {
  const options = getCompareFamilyOptions(params.familyOptions);
  const ids = options.map((option) => getCompareFamilyIdFromOption(option));

  let primaryFamilyId = normalizeCompareFamilyId(params.state.primaryFamilyId);
  let secondaryFamilyId = normalizeCompareFamilyId(params.state.secondaryFamilyId);

  if (!ids.includes(primaryFamilyId)) {
    primaryFamilyId = ids[0] ?? "";
  }

  if (!ids.includes(secondaryFamilyId) || secondaryFamilyId === primaryFamilyId) {
    secondaryFamilyId = ids.find((id) => id && id !== primaryFamilyId) ?? "";
  }

  return {
    primaryFamilyId,
    secondaryFamilyId,
  };
}