"use client";

import MomentInspectorWorkspaceBatchActionBar from "./MomentInspectorWorkspaceBatchActionBar";
import MomentInspectorWorkspaceContent from "./MomentInspectorWorkspaceContent";
import MomentInspectorWorkspaceNoteSummaryBar from "./MomentInspectorWorkspaceNoteSummaryBar";
import MomentInspectorWorkspaceQueueHeader from "./MomentInspectorWorkspaceQueueHeader";
import MomentInspectorWorkspaceQueueStatsBar from "./MomentInspectorWorkspaceQueueStatsBar";
import type { MomentInspectorWorkspacePanelViewModel } from "./momentInspectorWorkspacePanelViewModel";
import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";

type MomentInspectorWorkspaceQueueBodyProps = {
  lane: MomentInspectorWorkspaceLane;
  searchQuery: string;
  viewModel: MomentInspectorWorkspacePanelViewModel;
  selectedFamilyIds: string[];
  onToggleSelected: (familyId: string) => void;
};

export default function MomentInspectorWorkspaceQueueBody(
  props: MomentInspectorWorkspaceQueueBodyProps
) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <MomentInspectorWorkspaceQueueHeader
        lane={props.lane}
        visibleCount={props.viewModel.visibleStats.queueStats.visibleCount}
      />

      <div className="mt-3 space-y-3">
        <MomentInspectorWorkspaceQueueStatsBar
          stats={props.viewModel.visibleStats.queueStats}
        />

        <MomentInspectorWorkspaceNoteSummaryBar
          summary={props.viewModel.visibleStats.noteSummary}
        />

        <MomentInspectorWorkspaceBatchActionBar
          activeLane={props.lane}
          selectedCount={props.viewModel.selectionSummary.selectedCount}
        />

        <MomentInspectorWorkspaceContent
          lane={props.lane}
          searchQuery={props.searchQuery}
          derivedView={props.viewModel.derivedView}
          selectedFamilyIds={props.selectedFamilyIds}
          onToggleSelected={props.onToggleSelected}
        />
      </div>
    </div>
  );
}