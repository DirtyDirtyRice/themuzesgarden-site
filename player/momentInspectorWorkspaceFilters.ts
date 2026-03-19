import type { MomentInspectorWorkspaceFamilyItem } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceFilterState = {
  onlyPinned: boolean;
  onlyHighPriority: boolean;
};

export function createDefaultWorkspaceFilters(): MomentInspectorWorkspaceFilterState {
  return {
    onlyPinned: false,
    onlyHighPriority: false,
  };
}

export function applyWorkspaceFilters(
  items: MomentInspectorWorkspaceFamilyItem[],
  filters: MomentInspectorWorkspaceFilterState
): MomentInspectorWorkspaceFamilyItem[] {
  return items.filter((item) => {
    if (filters.onlyPinned && !item.pinned) return false;

    if (
      filters.onlyHighPriority &&
      (item.repairPriorityScore ?? 0) < 70
    )
      return false;

    return true;
  });
}