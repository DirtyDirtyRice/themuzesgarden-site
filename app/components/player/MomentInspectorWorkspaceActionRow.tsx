"use client";

import { buildMomentInspectorWorkspaceActions } from "./momentInspectorWorkspaceActions";
import type { MomentInspectorWorkspaceFamilyItem } from "./momentInspectorWorkspace.types";

type MomentInspectorWorkspaceActionRowProps = {
  item: MomentInspectorWorkspaceFamilyItem;
};

export default function MomentInspectorWorkspaceActionRow(
  props: MomentInspectorWorkspaceActionRowProps
) {
  const actions = buildMomentInspectorWorkspaceActions(props.item);

  return (
    <div className="mt-3 flex flex-wrap gap-2">
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
  );
}