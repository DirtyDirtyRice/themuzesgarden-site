"use client";

import type { PlayerTab } from "./playerTypes";

export default function PlayerHeaderBar(props: {
  compact: boolean;
  toggleCompact: () => void;
  tab: PlayerTab;
  setTab: (t: PlayerTab) => void;
  onProjectPage: boolean;
  setOpen: (v: boolean) => void;
}) {
  const { compact, toggleCompact, tab, setTab, onProjectPage, setOpen } = props;

  const baseButtonClassName =
    "!rounded-lg !border !border-white/20 !bg-black !px-2.5 !py-1.5 !text-xs !text-[color:var(--text-normal)]";
  const activeButtonClassName =
    "!border-white !bg-black !text-[color:var(--text-strong)]";

  return (
    <div className="flex items-center justify-between border-b border-white/10 bg-black px-4 py-3">
      <div className="text-2xl font-semibold text-[color:var(--text-strong)]">
        Global Player
      </div>

      <div className="flex items-center gap-2">
        <button
          className={baseButtonClassName}
          onClick={toggleCompact}
          title={compact ? "Expand player" : "Minimize player"}
        >
          {compact ? "Full" : "Mini"}
        </button>

        {!compact ? (
          <>
            <button
              className={[
                baseButtonClassName,
                tab === "project" ? activeButtonClassName : "",
              ].join(" ")}
              onClick={() => setTab("project")}
              disabled={!onProjectPage}
              title={
                onProjectPage
                  ? "Switch to project mode"
                  : "Project mode works on project pages"
              }
            >
              Project
            </button>

            <button
              className={[
                baseButtonClassName,
                tab === "search" ? activeButtonClassName : "",
              ].join(" ")}
              onClick={() => setTab("search")}
              title="Switch to search mode"
            >
              Search
            </button>
          </>
        ) : null}

        <button
          onClick={() => setOpen(false)}
          className={baseButtonClassName}
          title="Close player"
        >
          Close
        </button>
      </div>
    </div>
  );
}