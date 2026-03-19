"use client";

type MomentInspectorWorkspaceHeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function MomentInspectorWorkspaceHeader(
  props: MomentInspectorWorkspaceHeaderProps
) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-sm font-semibold text-zinc-900">
        {props.title ?? "Inspector Repair / Watchlist Workspace"}
      </div>
      <div className="mt-1 text-xs text-zinc-500">
        {props.subtitle ??
          "Review family queues that need monitoring, repair, or blocking."}
      </div>
    </div>
  );
}