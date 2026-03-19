"use client";

type MomentInspectorWorkspaceEmptyStateProps = {
  title?: string;
  message?: string;
  className?: string;
};

export default function MomentInspectorWorkspaceEmptyState({
  title = "No families available",
  message = "Select a family or adjust the workspace filters to see results here.",
  className = "",
}: MomentInspectorWorkspaceEmptyStateProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-600",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="font-medium text-zinc-800">{title}</div>
      <p className="mt-1 leading-6">{message}</p>
    </div>
  );
}