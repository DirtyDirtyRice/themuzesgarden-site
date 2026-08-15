"use client";

import type { FilterMode } from "./projectLibraryPanelTypes";

type Props = {
  linkedCount: number;
  showingCount: number;
  privateCount: number;
  publicCount: number;
  isSunoProject: boolean;
  bulkVisibilityBusy: boolean;
  projectVisibility?: "private" | "public" | "shared";
  mode: FilterMode;
  setMode: (mode: FilterMode) => void;
  q: string;
  setQ: (value: string) => void;
  filteredLength: number;
  selectedIdx: number;
  onPrimaryAction: () => void;
  onPlaySelected: () => void;
  onMakeAllPrivate: () => void;
};

const chipClass =
  "inline-flex min-h-8 min-w-[76px] items-center justify-center rounded-xl border border-white/25 bg-black px-3 py-1 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98]";

function getChipClass(active: boolean) {
  return [chipClass, active ? "ring-1 ring-white/40" : ""].join(" ");
}

export default function ProjectLibraryPanelHeader({
  linkedCount,
  showingCount,
  privateCount,
  publicCount,
  isSunoProject,
  bulkVisibilityBusy,
  projectVisibility = "private",
  mode,
  setMode,
  q,
  setQ,
  filteredLength,
  selectedIdx,
  onPrimaryAction,
  onPlaySelected,
  onMakeAllPrivate,
}: Props) {
  return (
    <div className="sticky top-0 z-10 space-y-2 bg-black pb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="text-sm font-bold text-white">Library</div>
          <div className="text-xs text-white/70">
            Linked: {linkedCount} • Showing: {showingCount}
          </div>
          <div className="text-xs font-bold text-white">
            Public songs: {publicCount} • Private songs: {privateCount}
          </div>
          {isSunoProject ? <div className="text-xs text-cyan-200">Suno publication review</div> : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className={getChipClass(mode === "all")}
            onClick={() => setMode("all")}
          >
            All
          </button>

          <button
            type="button"
            className={getChipClass(mode === "linked")}
            onClick={() => setMode("linked")}
          >
            Linked
          </button>

          <button
            type="button"
            className={getChipClass(mode === "unlinked")}
            onClick={() => setMode("unlinked")}
          >
            Unlinked
          </button>

          <button
            type="button"
            className={getChipClass(mode === "privacy")}
            onClick={() => setMode("privacy")}
          >
            Privacy review
          </button>

          <span
            className={[
              "inline-flex min-h-8 items-center justify-center rounded-xl border px-3 py-1 text-xs font-black",
              projectVisibility === "public"
                ? "border-emerald-300/60 bg-emerald-950 text-emerald-100"
                : "border-amber-300/60 bg-amber-950 text-amber-100",
            ].join(" ")}
            title={
              projectVisibility === "public"
                ? "This folder is public. Only songs marked Public in folder are exposed."
                : "This project and every linked song are private. Access requires owner permission."
            }
          >
            {projectVisibility === "public" ? "Public" : "Private"}
          </span>
        </div>
      </div>

      {linkedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/25 p-2">
          <span className="text-xs text-white/70">Publish songs one at a time below. Folder-wide privacy is immediate and reversible.</span>
          <button type="button" className={chipClass} onClick={onMakeAllPrivate} disabled={bulkVisibilityBusy || publicCount === 0}>
            {bulkVisibilityBusy ? "Saving..." : "Make all songs private"}
          </button>
        </div>
      ) : null}

      <input
        className="w-full rounded-xl border border-white/25 bg-black px-3 py-2 text-sm text-white outline-none placeholder:text-white/70 focus:ring-1 focus:ring-white/40"
        placeholder="Search project library, artist, or tag…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (!filteredLength) {
            if (e.key === "Escape" && q.trim()) {
              e.preventDefault();
              setQ("");
            }
            return;
          }

          if (e.key === "Enter") {
            e.preventDefault();
            onPrimaryAction();
            return;
          }

          if (e.key.toLowerCase() === "p") {
            e.preventDefault();
            onPlaySelected();
            return;
          }

          if (e.key === "Escape" && q.trim()) {
            e.preventDefault();
            setQ("");
          }
        }}
      />

      <div className="text-[11px] text-white/70">
        Keys: ↑ ↓ select • Enter link/unlink • P play selected • Esc clear
        search • Selected: {filteredLength ? selectedIdx + 1 : 0}
      </div>
    </div>
  );
}
