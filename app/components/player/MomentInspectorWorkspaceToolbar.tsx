"use client";

import MomentInspectorWorkspaceFilterBar from "./MomentInspectorWorkspaceFilterBar";
import MomentInspectorWorkspaceStatusBar from "./MomentInspectorWorkspaceStatusBar";
import MomentInspectorWorkspaceViewBar from "./MomentInspectorWorkspaceViewBar";
import type { MomentInspectorWorkspaceFilterState } from "./momentInspectorWorkspaceFilters";
import type { MomentInspectorWorkspaceSortMode } from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspaceGroupMode } from "./momentInspectorWorkspaceViewOptions";

type MomentInspectorWorkspaceToolbarProps = {
  filters: MomentInspectorWorkspaceFilterState;
  onFiltersChange: (filters: MomentInspectorWorkspaceFilterState) => void;
  sortMode: MomentInspectorWorkspaceSortMode;
  groupMode: MomentInspectorWorkspaceGroupMode;
  onSortModeChange: (value: MomentInspectorWorkspaceSortMode) => void;
  onGroupModeChange: (value: MomentInspectorWorkspaceGroupMode) => void;
  visibleCount: number;
  totalCount: number;
  selectedCount: number;
};

export default function MomentInspectorWorkspaceToolbar(
  props: MomentInspectorWorkspaceToolbarProps
) {
  return (
    <div className="space-y-3">
      <MomentInspectorWorkspaceFilterBar
        filters={props.filters}
        onChange={props.onFiltersChange}
      />

      <MomentInspectorWorkspaceViewBar
        sortMode={props.sortMode}
        groupMode={props.groupMode}
        onSortModeChange={props.onSortModeChange}
        onGroupModeChange={props.onGroupModeChange}
      />

      <MomentInspectorWorkspaceStatusBar
        visibleCount={props.visibleCount}
        totalCount={props.totalCount}
        selectedCount={props.selectedCount}
      />
    </div>
  );
}