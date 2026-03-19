"use client";

import { buildMomentInspectorWorkspaceBatchActions } from "./momentInspectorWorkspaceBatchActions";
import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";

type MomentInspectorWorkspaceBatchActionBarProps = {
  activeLane: MomentInspectorWorkspaceLane;
  selectedCount: number;
};

export default function MomentInspectorWorkspaceBatchActionBar(
  props: MomentInspectorWorkspaceBatchActionBarProps
) {
  const actions = buildMomentInspectorWorkspaceBatchActions({
    activeLane: props.activeLane,
    selectedCount: props.selectedCount,
  });

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            Batch Actions
          </div>
          <div className="text-xs text-zinc-500">
            {props.selectedCount} selected
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={!action.enabled}
              className={[
                "rounded-lg border px-3 py-2 text-xs font-medium transition",
                action.emphasis === "primary"
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50",
                !action.enabled ? "cursor-not-allowed opacity-50" : "",
              ].join(" ")}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}