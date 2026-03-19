import type {
  MomentInspectorPinnedFamiliesState,
  MomentInspectorPinnedFamiliesStoragePayload,
} from "./momentInspectorPinnedFamilies.types";
import { createMomentInspectorPinnedFamiliesState } from "./momentInspectorPinnedFamiliesState";

export const MOMENT_INSPECTOR_PINNED_FAMILIES_STORAGE_KEY =
  "moment-inspector-pinned-families";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function serializeMomentInspectorPinnedFamiliesState(
  state: MomentInspectorPinnedFamiliesState
): MomentInspectorPinnedFamiliesStoragePayload {
  return {
    pinnedFamilyIds: state.pinnedFamilyIds,
    pinnedOnly: state.pinnedOnly,
  };
}

export function saveMomentInspectorPinnedFamiliesState(
  state: MomentInspectorPinnedFamiliesState
): void {
  if (!canUseStorage()) return;

  try {
    const payload = serializeMomentInspectorPinnedFamiliesState(state);
    window.localStorage.setItem(
      MOMENT_INSPECTOR_PINNED_FAMILIES_STORAGE_KEY,
      JSON.stringify(payload)
    );
  } catch {
    // ignore storage write failures
  }
}

export function loadMomentInspectorPinnedFamiliesState(): MomentInspectorPinnedFamiliesState {
  if (!canUseStorage()) {
    return createMomentInspectorPinnedFamiliesState([], false);
  }

  try {
    const raw = window.localStorage.getItem(
      MOMENT_INSPECTOR_PINNED_FAMILIES_STORAGE_KEY
    );

    if (!raw) {
      return createMomentInspectorPinnedFamiliesState([], false);
    }

    const parsed = JSON.parse(raw) as Partial<MomentInspectorPinnedFamiliesStoragePayload>;

    return createMomentInspectorPinnedFamiliesState(
      Array.isArray(parsed.pinnedFamilyIds) ? parsed.pinnedFamilyIds : [],
      parsed.pinnedOnly
    );
  } catch {
    return createMomentInspectorPinnedFamiliesState([], false);
  }
}