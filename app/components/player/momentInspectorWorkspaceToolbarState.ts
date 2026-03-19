import {
  createDefaultWorkspaceFilters,
  type MomentInspectorWorkspaceFilterState,
} from "./momentInspectorWorkspaceFilters";
import {
  createDefaultMomentInspectorWorkspaceViewOptions,
  type MomentInspectorWorkspaceViewOptions,
} from "./momentInspectorWorkspaceViewOptions";

export type MomentInspectorWorkspaceToolbarState = {
  filters: MomentInspectorWorkspaceFilterState;
  viewOptions: MomentInspectorWorkspaceViewOptions;
};

export function createMomentInspectorWorkspaceToolbarState(): MomentInspectorWorkspaceToolbarState {
  return {
    filters: createDefaultWorkspaceFilters(),
    viewOptions: createDefaultMomentInspectorWorkspaceViewOptions(),
  };
}

export function updateMomentInspectorWorkspaceToolbarFilters(
  state: MomentInspectorWorkspaceToolbarState,
  filters: MomentInspectorWorkspaceFilterState
): MomentInspectorWorkspaceToolbarState {
  return {
    ...state,
    filters,
  };
}

export function updateMomentInspectorWorkspaceToolbarViewOptions(
  state: MomentInspectorWorkspaceToolbarState,
  viewOptions: MomentInspectorWorkspaceViewOptions
): MomentInspectorWorkspaceToolbarState {
  return {
    ...state,
    viewOptions,
  };
}