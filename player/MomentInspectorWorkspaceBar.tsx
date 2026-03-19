"use client";

import type { MomentInspectorWorkspaceBarProps } from "./momentInspectorWorkspace.types";

export default function MomentInspectorWorkspaceBar(
  props: MomentInspectorWorkspaceBarProps
) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            Repair / Watchlist Workspace
          </div>
          <div className="text-xs text-zinc-500">
            {props.totalCount} actionable{" "}
            {props.totalCount === 1 ? "family" : "families"}
          </div>
        </div>

        <div className="w-full md:max-w-xs">
          <input
            value={props.searchQuery}
            onChange={(event) => props.onSearchQueryChange(event.target.value)}
            placeholder="Search families, flags, notes..."
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-0"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {props.laneSummaries.map((summary) => {
          const active = summary.lane === props.activeLane;

          return (
            <button
              key={summary.lane}
              type="button"
              onClick={() => props.onLaneChange(summary.lane)}
              className={[
                "rounded-lg border px-3 py-2 text-sm transition",
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
              ].join(" ")}
            >
              <span className="font-medium">{summary.label}</span>
              <span className="ml-2 text-xs opacity-80">{summary.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}