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
        <div className="rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-[11px] text-white/70">
          Project mode becomes available when you open a project workspace page.
        </div>
      )}

      {canUseProject && hasProjectTracks && (
        <div className="rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-[11px] text-white/70">
          Rehearsal keys: <span className="font-medium text-white">↑ ↓</span> select row •{" "}
          <span className="font-medium text-white">Enter</span> play •{" "}
          <span className="font-medium text-white">Space</span> toggle play
        </div>
      )}
    </>
  );
}