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

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="font-semibold">Global Player</div>
      <div className="flex items-center gap-2">
        <button
          className="rounded border px-2 py-1 text-xs"
          onClick={toggleCompact}
          title={compact ? "Switch to full mode" : "Switch to mini mode"}
        >
          {compact ? "Full" : "Mini"}
        </button>

        {!compact && (
          <>
            <button
              className={[
                "rounded border px-2 py-1 text-xs",
                tab === "project" ? "bg-black text-white" : "bg-white",
                !onProjectPage ? "opacity-50" : "",
              ].join(" ")}
              onClick={() => {
                if (!onProjectPage) return;
                setTab("project");
              }}
              disabled={!onProjectPage}
              title={onProjectPage ? "Project setlist" : "Open a project page to enable Project tab"}
            >
              Project
            </button>

            <button
              className={[
                "rounded border px-2 py-1 text-xs",
                tab === "search" ? "bg-black text-white" : "bg-white",
              ].join(" ")}
              onClick={() => setTab("search")}
              title="Search library"
            >
              Search
            </button>
          </>
        )}

        <button
          onClick={() => setOpen(false)}
          className="rounded border px-2 py-1 text-xs"
          title="Close Global Player"
        >
          Close
        </button>
      </div>
    </div>
  );
}