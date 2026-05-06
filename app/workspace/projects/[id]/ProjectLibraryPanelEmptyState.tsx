"use client";

type Props = {
  loadingLibrary: boolean;
  visibleCount: number;
  showingCount: number;
  modeLabel: string;
};

export default function ProjectLibraryPanelEmptyState({
  loadingLibrary,
  visibleCount,
  showingCount,
  modeLabel,
}: Props) {
  if (loadingLibrary && visibleCount === 0) {
    return <div className="text-sm text-white">Loading…</div>;
  }

  if (visibleCount === 0) {
    return <div className="text-sm text-white">No tracks found in Library.</div>;
  }

  if (showingCount === 0) {
    return (
      <div className="text-sm text-white">
        No matches{modeLabel !== "all" ? ` for ${modeLabel}` : ""}. Try a
        different search.
      </div>
    );
  }

  return null;
}