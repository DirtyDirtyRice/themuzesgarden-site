"use client";

import type { MomentInspectorWorkspaceSortMode } from "./momentInspectorWorkspace.types";
import type { MomentInspectorWorkspaceGroupMode } from "./momentInspectorWorkspaceViewOptions";
import {
  getMomentInspectorWorkspaceGroupOptions,
  getMomentInspectorWorkspaceSortOptions,
} from "./momentInspectorWorkspaceViewOptions";

type Props = {
  sortMode: MomentInspectorWorkspaceSortMode;
  groupMode: MomentInspectorWorkspaceGroupMode;
  onSortModeChange: (value: MomentInspectorWorkspaceSortMode) => void;
  onGroupModeChange: (value: MomentInspectorWorkspaceGroupMode) => void;
};

export default function MomentInspectorWorkspaceViewBar(props: Props) {
  const sortOptions = getMomentInspectorWorkspaceSortOptions();
  const groupOptions = getMomentInspectorWorkspaceGroupOptions();

  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-zinc-200 bg-white p-3">
      <label className="flex items-center gap-2 text-xs text-zinc-600">
        <span>Sort</span>
        <select
          value={props.sortMode}
          onChange={(event) =>
            props.onSortModeChange(event.target.value as MomentInspectorWorkspaceSortMode)
          }
          className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs text-zinc-700"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs text-zinc-600">
        <span>Group</span>
        <select
          value={props.groupMode}
          onChange={(event) =>
            props.onGroupModeChange(event.target.value as MomentInspectorWorkspaceGroupMode)
          }
          className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-xs text-zinc-700"
        >
          {groupOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}