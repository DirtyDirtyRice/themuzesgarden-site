"use client";

type Props = {
  visibleCount: number;
  totalCount: number;
  selectedCount: number;
};

export default function MomentInspectorWorkspaceStatusBar(props: Props) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
      <span className="rounded-full border border-zinc-300 bg-white px-2 py-1">
        Visible: {props.visibleCount}
      </span>
      <span className="rounded-full border border-zinc-300 bg-white px-2 py-1">
        Total: {props.totalCount}
      </span>
      <span className="rounded-full border border-zinc-300 bg-white px-2 py-1">
        Selected: {props.selectedCount}
      </span>
    </div>
  );
}