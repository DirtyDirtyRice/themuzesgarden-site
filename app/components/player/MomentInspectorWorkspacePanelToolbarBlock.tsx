"use client";

import MomentInspectorWorkspaceBar from "./MomentInspectorWorkspaceBar";
import MomentInspectorWorkspaceToolbar from "./MomentInspectorWorkspaceToolbar";
import type { MomentInspectorWorkspaceFilterState } from "./momentInspectorWorkspaceFilters";
import type {
  MomentInspectorWorkspaceLaneSummary,
  MomentInspectorWorkspaceSortMode,
  MomentInspectorWorkspaceLane,
} from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspaceGroupMode } from "./momentInspectorWorkspaceViewOptions";

type MomentInspectorWorkspacePanelToolbarBlockProps = {
  laneSummaries: MomentInspectorWorkspaceLaneSummary[];
  activeLane: MomentInspectorWorkspaceLane;
  onLaneChange: (lane: MomentInspectorWorkspaceLane) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  totalCount: number;

  filters: MomentInspectorWorkspaceFilterState;
  onFiltersChange: (filters: MomentInspectorWorkspaceFilterState) => void;

  sortMode: MomentInspectorWorkspaceSortMode;
  groupMode: MomentInspectorWorkspaceGroupMode;
  onSortModeChange: (value: MomentInspectorWorkspaceSortMode) => void;
  onGroupModeChange: (value: MomentInspectorWorkspaceGroupMode) => void;

  visibleCount: number;
  selectedCount: number;
};

export default function MomentInspectorWorkspacePanelToolbarBlock(
  props: MomentInspectorWorkspacePanelToolbarBlockProps
) {
  return (
    <div className="space-y-3">
      <MomentInspectorWorkspaceBar
        laneSummaries={props.laneSummaries}
        activeLane={props.activeLane}
        onLaneChange={props.onLaneChange}
        searchQuery={props.searchQuery}
        onSearchQueryChange={props.onSearchQueryChange}
        totalCount={props.totalCount}
      />

      <MomentInspectorWorkspaceToolbar
        filters={props.filters}
        onFiltersChange={props.onFiltersChange}
        sortMode={props.sortMode}
        groupMode={props.groupMode}
        onSortModeChange={props.onSortModeChange}
        onGroupModeChange={props.onGroupModeChange}
        visibleCount={props.visibleCount}
        totalCount={props.totalCount}
        selectedCount={props.selectedCount}
      />
    </div>
  );
}