"use client";

import type { ComponentProps } from "react";
import MomentInspectorWorkspaceBatchActionBar from "./MomentInspectorWorkspaceBatchActionBar";
import MomentInspectorWorkspaceContent from "./MomentInspectorWorkspaceContent";
import MomentInspectorWorkspaceNoteSummaryBar from "./MomentInspectorWorkspaceNoteSummaryBar";
import MomentInspectorWorkspaceQueueHeader from "./MomentInspectorWorkspaceQueueHeader";
import MomentInspectorWorkspaceQueueStatsBar from "./MomentInspectorWorkspaceQueueStatsBar";
import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";

type QueueStats = ComponentProps<
  typeof MomentInspectorWorkspaceQueueStatsBar
>["stats"];

type NoteSummary = ComponentProps<
  typeof MomentInspectorWorkspaceNoteSummaryBar
>["summary"];

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

function buildQueueStats(value: unknown): QueueStats {
  const record = getObject(value);
  const nestedQueueStats = getObject(record?.queueStats);
  const source = nestedQueueStats ?? record ?? {};

  return {
    visibleCount: getOptionalNumber(source.visibleCount) ?? 0,
    pinnedCount: getOptionalNumber(source.pinnedCount) ?? 0,
    bookmarkedCount: getOptionalNumber(source.bookmarkedCount) ?? 0,
    comparedCount: getOptionalNumber(source.comparedCount) ?? 0,
    highPriorityCount: getOptionalNumber(source.highPriorityCount) ?? 0,
  };
}

function buildNoteSummary(value: unknown): NoteSummary {
  const record = getObject(value);
  const source =
    getObject(record?.noteSummary) ??
    getObject(record?.summary) ??
    record ??
    {};

  return {
    totalNotes: getOptionalNumber(source.totalNotes) ?? 0,
    familiesWithNotes: getOptionalNumber(source.familiesWithNotes) ?? 0,
    pinnedNotes: getOptionalNumber(source.pinnedNotes) ?? 0,
    bookmarkedNotes: getOptionalNumber(source.bookmarkedNotes) ?? 0,
  };
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
  const queueStats = buildQueueStats(visibleStats);
  const noteSummary = buildNoteSummary(visibleStats);
  const selectedCount = getSelectedCount(props.viewModel?.selectionSummary);

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
      <MomentInspectorWorkspaceQueueHeader
        lane={props.lane}
        visibleCount={queueStats.visibleCount}
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