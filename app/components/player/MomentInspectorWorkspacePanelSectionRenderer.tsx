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
      {/* HEADER */}
      <MomentInspectorWorkspacePanelHeaderBlock
        title={context.panelProps?.title}
        subtitle={context.panelProps?.subtitle}
        summary={composer.summary}
      />

      {/* TOOLBAR */}
      <MomentInspectorWorkspacePanelToolbarBlock
        sortMode={viewModel.sortMode}
        groupMode={viewModel.groupMode}
        onSortModeChange={actions.onSortModeChange}
        onGroupModeChange={actions.onGroupModeChange}

        {/* ✅ FIX: safe fallback instead of queueStats */}
        visibleCount={
          (visibleStats as any)?.queueStats?.visibleCount ??
          (visibleStats as any)?.visibleCount ??
          0
        }

        selectedCount={selectionSummary?.selectedCount ?? 0}
      />

      {/* QUEUE */}
      <MomentInspectorWorkspacePanelQueueBlock context={context} />

      {/* SELECTION */}
      <MomentInspectorWorkspacePanelSelectionBlock context={context} />
    </>
  );
}
