"use client";

import type { MomentInspectorWorkspaceQueueStats } from "./momentInspectorWorkspaceQueueStats";

type MomentInspectorWorkspaceQueueStatsBarProps = {
  stats: MomentInspectorWorkspaceQueueStats;
};

function StatChip(props: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-600">
      {props.label}: {props.value}
    </span>
  );
}

export default function MomentInspectorWorkspaceQueueStatsBar(
  props: MomentInspectorWorkspaceQueueStatsBarProps
) {
  return (
    <div className="flex flex-wrap gap-2">
      <StatChip label="Visible" value={props.stats.visibleCount} />
      <StatChip label="Pinned" value={props.stats.pinnedCount} />
      <StatChip label="Bookmarked" value={props.stats.bookmarkedCount} />
      <StatChip label="Compared" value={props.stats.comparedCount} />
      <StatChip label="High Priority" value={props.stats.highPriorityCount} />
    </div>
  );
}