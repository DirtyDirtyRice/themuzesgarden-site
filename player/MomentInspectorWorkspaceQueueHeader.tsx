"use client";

import { getMomentInspectorWorkspaceLaneMeta } from "./momentInspectorWorkspaceLaneMeta";
import type { MomentInspectorWorkspaceLane } from "./momentInspectorWorkspace.types";

type MomentInspectorWorkspaceQueueHeaderProps = {
  lane: MomentInspectorWorkspaceLane;
  visibleCount: number;
};

export default function MomentInspectorWorkspaceQueueHeader(
  props: MomentInspectorWorkspaceQueueHeaderProps
) {
  const laneMeta = getMomentInspectorWorkspaceLaneMeta(props.lane);

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-zinc-900">
          {laneMeta.label} Queue
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          {laneMeta.description}
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        {props.visibleCount} item{props.visibleCount === 1 ? "" : "s"}
      </div>
    </div>
  );
}