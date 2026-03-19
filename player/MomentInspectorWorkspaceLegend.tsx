"use client";

import { getMomentInspectorWorkspaceLaneMeta } from "./momentInspectorWorkspaceLaneMeta";
import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";

const LANES: MomentInspectorWorkspaceLane[] = ["watch", "repair", "blocked"];

export default function MomentInspectorWorkspaceLegend() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="text-sm font-semibold text-zinc-900">Workspace Legend</div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        {LANES.map((lane) => {
          const meta = getMomentInspectorWorkspaceLaneMeta(lane);

          return (
            <div
              key={lane}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
            >
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "rounded-full border px-2 py-1 text-[11px] font-medium",
                    meta.badgeClassName,
                  ].join(" ")}
                >
                  {meta.label}
                </span>
              </div>

              <div className="mt-2 text-xs text-zinc-600">
                {meta.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}