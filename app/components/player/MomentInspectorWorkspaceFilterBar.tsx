"use client";

import type { MomentInspectorWorkspaceFilterState } from "./momentInspectorWorkspaceFilters";

type Props = {
  filters: MomentInspectorWorkspaceFilterState;
  onChange: (next: MomentInspectorWorkspaceFilterState) => void;
};

export default function MomentInspectorWorkspaceFilterBar(props: Props) {
  function toggle(key: keyof MomentInspectorWorkspaceFilterState) {
    props.onChange({
      ...props.filters,
      [key]: !props.filters[key],
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => toggle("onlyPinned")}
        className={[
          "rounded-lg border px-3 py-2 text-xs",
          props.filters.onlyPinned
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white border-zinc-300 text-zinc-700",
        ].join(" ")}
      >
        Pinned Only
      </button>

      <button
        onClick={() => toggle("onlyHighPriority")}
        className={[
          "rounded-lg border px-3 py-2 text-xs",
          props.filters.onlyHighPriority
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-white border-zinc-300 text-zinc-700",
        ].join(" ")}
      >
        High Priority
      </button>
    </div>
  );
}