"use client";

type MomentInspectorWorkspaceFamilyCardProps = {
  family?: {
    familyId?: string;
    title?: string;
    label?: string;
    summary?: string;
    status?: string;
    count?: number | null;
  } | null;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
};

function getDisplayTitle(
  family: MomentInspectorWorkspaceFamilyCardProps["family"]
): string {
  if (!family) return "Untitled family";
  if (family.title && family.title.trim()) return family.title.trim();
  if (family.label && family.label.trim()) return family.label.trim();
  if (family.familyId && family.familyId.trim()) return family.familyId.trim();
  return "Untitled family";
}

function getDisplaySummary(
  family: MomentInspectorWorkspaceFamilyCardProps["family"]
): string {
  if (!family?.summary) return "No family summary available yet.";
  const text = family.summary.trim();
  return text || "No family summary available yet.";
}

export default function MomentInspectorWorkspaceFamilyCard({
  family,
  onClick,
  isSelected = false,
  className = "",
}: MomentInspectorWorkspaceFamilyCardProps) {
  const title = getDisplayTitle(family);
  const summary = getDisplaySummary(family);
  const status = String(family?.status ?? "").trim();
  const count =
    typeof family?.count === "number" && Number.isFinite(family.count)
      ? family.count
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-2xl border px-4 py-3 text-left transition",
        isSelected
          ? "border-zinc-900 bg-zinc-100"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-medium text-zinc-900">{title}</div>
          {status ? (
            <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">
              {status}
            </div>
          ) : null}
        </div>

        {count !== null ? (
          <div className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
            {count}
          </div>
        ) : null}
      </div>

      <p className="mt-2 text-sm leading-6 text-zinc-600">{summary}</p>
    </button>
  );
}