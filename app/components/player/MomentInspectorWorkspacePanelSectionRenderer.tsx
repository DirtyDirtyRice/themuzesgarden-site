"use client";

import MomentInspectorWorkspacePanelHeaderBlock from "./momentInspectorWorkspacePanelHeaderBlock";
import MomentInspectorWorkspacePanelQueueBlock from "./MomentInspectorWorkspacePanelQueueBlock";
import MomentInspectorWorkspacePanelSelectionBlock from "./MomentInspectorWorkspacePanelSelectionBlock";
import MomentInspectorWorkspacePanelToolbarBlock from "./MomentInspectorWorkspacePanelToolbarBlock";
import type { MomentInspectorWorkspacePanelContext } from "./momentInspectorWorkspacePanelContext";
import type { MomentInspectorWorkspacePanelActions } from "./momentInspectorWorkspacePanel.types";
import type { MomentInspectorWorkspacePanelLayoutSection } from "./momentInspectorWorkspacePanelLayout";

type MomentInspectorWorkspacePanelSectionRendererProps = {
  context: MomentInspectorWorkspacePanelContext;
  actions: MomentInspectorWorkspacePanelActions;
  section: MomentInspectorWorkspacePanelLayoutSection;
};

export default function MomentInspectorWorkspacePanelSectionRenderer(
  props: MomentInspectorWorkspacePanelSectionRendererProps
) {
  const { context, actions, section } = props;

  if (section === "header") {
    return (
      <MomentInspectorWorkspacePanelHeaderBlock
        title={context.panelProps.title}
        subtitle={context.panelProps.subtitle}
        summary={context.composer.summary}
      />
    );
  }

  if (section === "toolbar") {
    return (
      <MomentInspectorWorkspacePanelToolbarBlock
        laneSummaries={context.derivedState.laneSummaries}
        activeLane={context.runtime.activeLane}
        onLaneChange={actions.onLaneChange}
        searchQuery={context.runtime.searchQuery}
        onSearchQueryChange={actions.onSearchQueryChange}
        totalCount={context.derivedState.totalCount}
        filters={context.runtime.filters}
        onFiltersChange={actions.onFiltersChange}
        sortMode={context.runtime.sortMode}
        groupMode={context.runtime.groupMode}
        onSortModeChange={actions.onSortModeChange}
        onGroupModeChange={actions.onGroupModeChange}
        visibleCount={context.composer.viewModel.visibleStats.queueStats.visibleCount}
        selectedCount={context.composer.viewModel.selectionSummary.selectedCount}
      />
    );
  }

  if (section === "selection") {
    return (
      <MomentInspectorWorkspacePanelSelectionBlock
        label={context.composer.viewModel.selectionSummary.label}
        hasSelection={context.composer.viewModel.selectionSummary.hasSelection}
        onClearSelection={actions.onClearSelection}
      />
    );
  }

  return (
    <MomentInspectorWorkspacePanelQueueBlock
      lane={context.runtime.activeLane}
      searchQuery={context.runtime.searchQuery}
      viewModel={context.composer.viewModel}
      selectedFamilyIds={context.runtime.selection.selectedFamilyIds}
      onToggleSelected={actions.onToggleSelected}
    />
  );
}