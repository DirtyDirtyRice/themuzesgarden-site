"use client";

export default function PlayerProjectHelpPanels(props: {
  compact: boolean;
  tab: "project" | "search";
  onProjectPage: boolean;
  canUseProject: boolean;
  hasProjectTracks: boolean;
}) {
  const { compact, tab, onProjectPage, canUseProject, hasProjectTracks } = props;

  if (compact) return null;

  return (
    <>
      {!onProjectPage && tab === "project" && (
        <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700">
          Project mode becomes available when you open a project workspace page.
        </div>
      )}

      {canUseProject && hasProjectTracks && (
        <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700">
          Rehearsal keys: <span className="font-medium">↑ ↓</span> select row •{" "}
          <span className="font-medium">Enter</span> play from selected •{" "}
          <span className="font-medium">Space</span> play selected
        </div>
      )}
    </>
  );
}