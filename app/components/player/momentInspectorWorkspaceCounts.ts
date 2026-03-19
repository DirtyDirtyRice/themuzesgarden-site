import type {
  MomentInspectorWorkspaceDerivedState,
  MomentInspectorWorkspaceLane,
} from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspaceSelectionState } from "./momentInspectorWorkspaceSelection";

export function getMomentInspectorWorkspaceSelectedCount(
  selection: MomentInspectorWorkspaceSelectionState
): number {
  return selection.selectedFamilyIds.length;
}

export function getMomentInspectorWorkspaceVisibleCount(
  state: MomentInspectorWorkspaceDerivedState
): number {
  return state.activeItems.length;
}

export function getMomentInspectorWorkspaceLaneCount(
  state: MomentInspectorWorkspaceDerivedState,
  lane: MomentInspectorWorkspaceLane
): number {
  return state.queues[lane].count;
}