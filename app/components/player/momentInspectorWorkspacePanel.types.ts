import type { MomentInspectorWorkspaceFilterState } from "./momentInspectorWorkspaceFilters";
import type { MomentInspectorWorkspaceSelectionState } from "./momentInspectorWorkspaceSelection";
import type {
  MomentInspectorWorkspaceLane,
  MomentInspectorWorkspacePanelProps,
  MomentInspectorWorkspaceSortMode,
} from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspaceGroupMode } from "./momentInspectorWorkspaceViewOptions";

export type MomentInspectorWorkspacePanelRuntime = {
  activeLane: MomentInspectorWorkspaceLane;
  searchQuery: string;
  sortMode: MomentInspectorWorkspaceSortMode;
  groupMode: MomentInspectorWorkspaceGroupMode;
  filters: MomentInspectorWorkspaceFilterState;
  selection: MomentInspectorWorkspaceSelectionState;
};

export type MomentInspectorWorkspacePanelActions = {
  onLaneChange: (lane: MomentInspectorWorkspaceLane) => void;
  onSearchQueryChange: (value: string) => void;
  onSortModeChange: (value: MomentInspectorWorkspaceSortMode) => void;
  onGroupModeChange: (value: MomentInspectorWorkspaceGroupMode) => void;
  onFiltersChange: (filters: MomentInspectorWorkspaceFilterState) => void;
  onToggleSelected: (familyId: string) => void;
  onClearSelection: () => void;
};

export type MomentInspectorWorkspacePanelSectionProps = {
  panelProps: MomentInspectorWorkspacePanelProps;
  runtime: MomentInspectorWorkspacePanelRuntime;
  actions: MomentInspectorWorkspacePanelActions;
};