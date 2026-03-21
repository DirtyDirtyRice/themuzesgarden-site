"use client";

import MomentInspectorWorkspacePanelHeaderBlock from "./momentInspectorWorkspacePanelHeaderBlock";
import MomentInspectorWorkspacePanelQueueBlock from "./MomentInspectorWorkspacePanelQueueBlock";
import MomentInspectorWorkspacePanelSelectionBlock from "./MomentInspectorWorkspacePanelSelectionBlock";
import MomentInspectorWorkspacePanelToolbarBlock from "./MomentInspectorWorkspacePanelToolbarBlock";

export default function MomentInspectorWorkspacePanelSectionRenderer(
  context: any
) {
  const actions = context.actions ?? {};
  const composer = context.composer ?? {};
  const viewModel = composer.viewModel ?? {};

  const visibleStats = viewModel.visibleStats ?? {};
  const selectionSummary = viewModel.selectionSummary ?? {};

  return (
    <>
      <MomentInspectorWorkspacePanelHeaderBlock
        title={context.panelProps?.title}
        subtitle={context.panelProps?.subtitle}
        summary={composer.summary}
      />

      <MomentInspectorWorkspacePanelToolbarBlock
        sortMode={viewModel.sortMode}
        groupMode={viewModel.groupMode}
        onSortModeChange={actions.onSortModeChange}
        onGroupModeChange={actions.onGroupModeChange}

        visibleCount={
          (visibleStats as any)?.queueStats?.visibleCount ??
          (visibleStats as any)?.visibleCount ??
          0
        }

        selectedCount={selectionSummary?.selectedCount ?? 0}

        {/* ✅ REQUIRED PROPS (safe fallbacks) */}
        laneSummaries={(viewModel as any)?.laneSummaries ?? []}
        activeLane={(viewModel as any)?.activeLane ?? null}
        onLaneChange={actions?.onLaneChange ?? (() => {})}
        searchQuery={(viewModel as any)?.searchQuery ?? ""}
        onSearchQueryChange={actions?.onSearchQueryChange ?? (() => {})}
        filterMode={(viewModel as any)?.filterMode ?? "all"}
        onFilterModeChange={actions?.onFilterModeChange ?? (() => {})}
        groupBy={(viewModel as any)?.groupBy ?? "none"}
        onGroupByChange={actions?.onGroupByChange ?? (() => {})}
      />

      <MomentInspectorWorkspacePanelQueueBlock context={context} />

      <MomentInspectorWorkspacePanelSelectionBlock context={context} />
    </>
  );
}
