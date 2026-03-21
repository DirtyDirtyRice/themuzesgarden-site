"use client";

import MomentInspectorWorkspaceFamilyCard from "./MomentInspectorWorkspaceFamilyCard";
import type { MomentInspectorWorkspaceFamilyItem } from "./momentInspectorWorkspace.types";

type MomentInspectorWorkspaceSelectableFamilyCardProps = {
  item: MomentInspectorWorkspaceFamilyItem;
  selected: boolean;
  onToggleSelected: (familyId: string) => void;
};

export default function MomentInspectorWorkspaceSelectableFamilyCard(
  props: MomentInspectorWorkspaceSelectableFamilyCardProps
) {
  const FamilyCardAny = MomentInspectorWorkspaceFamilyCard as any;

  return (
    <div
      className={[
        "rounded-2xl p-1",
        props.selected ? "bg-zinc-900/5 ring-1 ring-zinc-900/20" : "",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between px-2 pt-2">
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          <input
            type="checkbox"
            checked={props.selected}
            onChange={() => props.onToggleSelected(props.item.familyId)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          <span>Select family</span>
        </label>

        <div className="text-[11px] text-zinc-500">
          {props.selected ? "Selected" : "Not selected"}
        </div>
      </div>

      <FamilyCardAny item={props.item} />
    </div>
  );
}
