"use client";

import MomentInspectorWorkspacePanelHeaderBlock from "./momentInspectorWorkspacePanelHeaderBlock";
import MomentInspectorWorkspacePanelQueueBlock from "./MomentInspectorWorkspacePanelQueueBlock";
import MomentInspectorWorkspacePanelSelectionBlock from "./MomentInspectorWorkspacePanelSelectionBlock";
import MomentInspectorWorkspacePanelToolbarBlock from "./MomentInspectorWorkspacePanelToolbarBlock";

export default function MomentInspectorWorkspacePanelSectionRenderer(
  context: any
) {
  const actions = context?.actions ?? {};
  const composer = context?.composer ?? {};
  const viewModel = composer?.viewModel ?? {};

  const visibleStats = viewModel?.visibleStats ?? {};
  const selectionSummary = viewModel?.selectionSummary ?? {};

  const selectedCount = (selectionSummary as any)?.selectedCount ?? 0;
  const hasSelection =
    (selectionSummary as any)?.hasSelection ?? selectedCount > 0;

  return (
    <>
      <MomentInspectorWorkspacePanelHeaderBlock
        title={context?.panelProps?.title}
        subtitle={context?.panelProps?.subtitle}
        summary={composer?.summary}
      />

      <MomentInspectorWorkspacePanelToolbarBlock
        sortMode={(viewModel as any)?.sortMode}
        groupMode={(viewModel as any)?.groupMode}
        onSortModeChange={actions?.onSortModeChange ?? (() => {})}
        onGroupModeChange={actions?.onGroupModeChange ?? (() => {})}
        visibleCount={
          (visibleStats as any)?.queueStats?.visibleCount ??
          (visibleStats as any)?.visibleCount ??
          0
        }
        selectedCount={selectedCount}
        totalCount={
          (visibleStats as any)?.queueStats?.totalCount ??
          (visibleStats as any)?.totalCount ??
          (visibleStats as any)?.visibleCount ??
          0
        }
        laneSummaries={(viewModel as any)?.laneSummaries ?? []}
        activeLane={(viewModel as any)?.activeLane ?? null}
        onLaneChange={actions?.onLaneChange ?? (() => {})}
        searchQuery={(viewModel as any)?.searchQuery ?? ""}
        onSearchQueryChange={actions?.onSearchQueryChange ?? (() => {})}
        filters={(viewModel as any)?.filters ?? {}}
        onFiltersChange={actions?.onFiltersChange ?? (() => {})}
      />

      <MomentInspectorWorkspacePanelQueueBlock />

      <MomentInspectorWorkspacePanelSelectionBlock
        label={(selectionSummary as any)?.label ?? "Selection"}
        hasSelection={Boolean(hasSelection)}
        onClearSelection={actions?.onClearSelection ?? (() => {})}
      />
    </>
  );
}
