import { buildMomentInspectorWorkspacePanelSummary } from "./momentInspectorWorkspacePanelSummary";
import { buildMomentInspectorWorkspacePanelViewModel } from "./momentInspectorWorkspacePanelViewModel";
import type { MomentInspectorWorkspaceDerivedState } from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspaceFilterState } from "./momentInspectorWorkspaceFilters";
import type { MomentInspectorWorkspaceSelectionState } from "./momentInspectorWorkspaceSelection";
import type { MomentInspectorWorkspaceGroupMode } from "./momentInspectorWorkspaceViewOptions";

export type MomentInspectorWorkspacePanelComposerResult = {
  summary: ReturnType<typeof buildMomentInspectorWorkspacePanelSummary>;
  viewModel: ReturnType<typeof buildMomentInspectorWorkspacePanelViewModel>;
};

export function buildMomentInspectorWorkspacePanelComposer(params: {
  state: MomentInspectorWorkspaceDerivedState;
  filters: MomentInspectorWorkspaceFilterState;
  groupMode: MomentInspectorWorkspaceGroupMode;
  selection: MomentInspectorWorkspaceSelectionState;
  workspaceController?: any; // 🔥 new
}): MomentInspectorWorkspacePanelComposerResult {
  const sourceState =
    params.workspaceController ?? params.state;

  return {
    summary: buildMomentInspectorWorkspacePanelSummary(sourceState),

    viewModel: buildMomentInspectorWorkspacePanelViewModel({
      state: sourceState,
      filters: params.filters,
      groupMode: params.groupMode,
      selection: params.selection,
    }),
  };
}