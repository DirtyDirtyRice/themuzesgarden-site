"use client";

type MomentInspectorWorkspaceSelectionBarProps = {
  label: string;
  hasSelection: boolean;
  onClearSelection: () => void;
};

export default function MomentInspectorWorkspaceSelectionBar(
  props: MomentInspectorWorkspaceSelectionBarProps
) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-zinc-900">
            Selection
          </div>
          <div className="text-xs text-zinc-500">{props.label}</div>
        </div>

        <button
          type="button"
          onClick={props.onClearSelection}
          disabled={!props.hasSelection}
          className={[
            "rounded-lg border px-3 py-2 text-xs font-medium transition",
            props.hasSelection
              ? "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400",
          ].join(" ")}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}