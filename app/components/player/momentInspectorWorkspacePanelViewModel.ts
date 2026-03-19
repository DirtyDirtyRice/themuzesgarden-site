import { buildMomentInspectorWorkspaceDerivedView } from "./momentInspectorWorkspaceDerivedView";
import { buildMomentInspectorWorkspaceSelectionSummary } from "./momentInspectorWorkspaceSelectionSummary";
import { buildMomentInspectorWorkspaceVisibleStats } from "./momentInspectorWorkspaceVisibleStats";

export function buildMomentInspectorWorkspacePanelViewModel(params: {
  state: any;
  filters: any;
  groupMode: any;
  selection: any;
}) {
  const derivedView = buildMomentInspectorWorkspaceDerivedView(params.state);

  const selectionSummary = buildMomentInspectorWorkspaceSelectionSummary(
    params.state,
    params.selection
  );

  const visibleStats = buildMomentInspectorWorkspaceVisibleStats(
    derivedView
  );

  return {
    derivedView,
    selectionSummary,
    visibleStats,
  };
}