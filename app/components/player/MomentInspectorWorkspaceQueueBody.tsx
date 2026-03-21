"use client";

import MomentInspectorWorkspaceBatchActionBar from "./MomentInspectorWorkspaceBatchActionBar";
import MomentInspectorWorkspaceContent from "./MomentInspectorWorkspaceContent";
import MomentInspectorWorkspaceNoteSummaryBar from "./MomentInspectorWorkspaceNoteSummaryBar";
import MomentInspectorWorkspaceQueueHeader from "./MomentInspectorWorkspaceQueueHeader";
import MomentInspectorWorkspaceQueueStatsBar from "./MomentInspectorWorkspaceQueueStatsBar";
import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";

type MomentInspectorWorkspaceQueueBodyProps = {
  lane: MomentInspectorWorkspaceLane;
  searchQuery: string;
  viewModel: any;
  selectedFamilyIds: string[];
  onToggleSelected: (familyId: string) => void;
};

export default function MomentInspectorWorkspaceQueueBody(
  props: MomentInspectorWorkspaceQueueBodyProps
) {
  const viewModel = props.viewModel ?? {};
  const visibleStats = viewModel?.visibleStats ?? {};
  const queueStats = visibleStats?.queueStats ?? {};
  const noteSummary = visibleStats?.noteSummary ?? {};
  const selectionSummary = viewModel?.selectionSummary ?? {};
  const derivedView = viewModel?.derivedView ?? {};

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <MomentInspectorWorkspaceQueueHeader
        lane={props.lane}
        visibleCount={queueStats?.visibleCount ?? 0}
      />

      <div className="mt-3 space-y-3">
        <MomentInspectorWorkspaceQueueStatsBar stats={queueStats} />

        <MomentInspectorWorkspaceNoteSummaryBar summary={noteSummary} />

        <MomentInspectorWorkspaceBatchActionBar
          activeLane={props.lane}
          selectedCount={selectionSummary?.selectedCount ?? 0}
        />

        <MomentInspectorWorkspaceContent
          lane={props.lane}
          searchQuery={props.searchQuery}
          derivedView={derivedView}
          selectedFamilyIds={props.selectedFamilyIds ?? []}
          onToggleSelected={props.onToggleSelected ?? (() => {})}
        />
      </div>
    </div>
  );
}
