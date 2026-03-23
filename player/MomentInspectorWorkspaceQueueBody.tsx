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
  viewModel: {
    visibleStats?: unknown;
    selectionSummary?: unknown;
    derivedView?: unknown;
  };
  selectedFamilyIds: string[];
  onToggleSelected: (familyId: string) => void;
};

function getOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getQueueStats(value: unknown): Record<string, unknown> {
  const record = getObject(value);
  if (!record) return {};

  const nestedQueueStats = getObject(record.queueStats);
  if (nestedQueueStats) return nestedQueueStats;

  return record;
}

function getVisibleCount(value: unknown): number {
  const queueStats = getQueueStats(value);

  const visibleCount = getOptionalNumber(queueStats.visibleCount);
  if (visibleCount !== null) return visibleCount;

  const totalCount = getOptionalNumber(queueStats.totalCount);
  if (totalCount !== null) return totalCount;

  return 0;
}

function getNoteSummary(value: unknown): unknown {
  const record = getObject(value);
  if (!record) return null;

  if ("noteSummary" in record) return record.noteSummary;
  if ("summary" in record) return record.summary;

  return null;
}

function getSelectedCount(value: unknown): number {
  const record = getObject(value);
  if (!record) return 0;

  const directSelectedCount = getOptionalNumber(record.selectedCount);
  if (directSelectedCount !== null) return directSelectedCount;

  const count = getOptionalNumber(record.count);
  if (count !== null) return count;

  const totalSelected = getOptionalNumber(record.totalSelected);
  if (totalSelected !== null) return totalSelected;

  if (Array.isArray(record.selectedFamilyIds)) {
    return record.selectedFamilyIds.length;
  }

  if (Array.isArray(record.selectedIds)) {
    return record.selectedIds.length;
  }

  return 0;
}

export default function MomentInspectorWorkspaceQueueBody(
  props: MomentInspectorWorkspaceQueueBodyProps
) {
  const visibleStats = props.viewModel?.visibleStats;
  const queueStats = getQueueStats(visibleStats);
  const visibleCount = getVisibleCount(visibleStats);
  const noteSummary = getNoteSummary(visibleStats);
  const selectedCount = getSelectedCount(props.viewModel?.selectionSummary);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <MomentInspectorWorkspaceQueueHeader
        lane={props.lane}
        visibleCount={visibleCount}
      />

      <div className="mt-3 space-y-3">
        <MomentInspectorWorkspaceQueueStatsBar stats={queueStats} />

        <MomentInspectorWorkspaceNoteSummaryBar summary={noteSummary} />

        <MomentInspectorWorkspaceBatchActionBar
          activeLane={props.lane}
          selectedCount={selectedCount}
        />

        <MomentInspectorWorkspaceContent
          lane={props.lane}
          searchQuery={props.searchQuery}
          derivedView={props.viewModel?.derivedView}
          selectedFamilyIds={props.selectedFamilyIds}
          onToggleSelected={props.onToggleSelected}
        />
      </div>
    </div>
  );
}