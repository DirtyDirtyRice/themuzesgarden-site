"use client";

import { getModeChipClass } from "./projectLibraryPanelUtils";
import type { FilterMode } from "./projectLibraryPanelTypes";

type Props = {
  linkedCount: number;
  showingCount: number;
  mode: FilterMode;
  setMode: (mode: FilterMode) => void;
  q: string;
  setQ: (value: string) => void;
  filteredLength: number;
  selectedIdx: number;
  onPrimaryAction: () => void;
  onPlaySelected: () => void;
};

export default function ProjectLibraryPanelHeader({
  linkedCount,
  showingCount,
  mode,
  setMode,
  q,
  setQ,
  filteredLength,
  selectedIdx,
  onPrimaryAction,
  onPlaySelected,
}: Props) {
  return (
    <div className="sticky top-0 z-10 space-y-2 bg-black pb-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="text-sm font-medium text-white">Library</div>
          <div className="text-xs text-white">
            Linked: {linkedCount} • Showing: {showingCount}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            className={getModeChipClass(mode === "all")}
            onClick={() => setMode("all")}
          >
            All
          </button>
          <button
            type="button"
            className={getModeChipClass(mode === "linked")}
            onClick={() => setMode("linked")}
          >
            Linked
          </button>
          <button
            type="button"
            className={getModeChipClass(mode === "unlinked")}
            onClick={() => setMode("unlinked")}
          >
            Unlinked
          </button>
        </div>
      </div>

      <input
        className="w-full rounded border border-white bg-black px-3 py-2 text-sm text-white outline-none"
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

      <div className="text-[11px] text-white">
        Keys: ↑ ↓ select • Enter link/unlink • P play selected • Esc clear
        search • Selected: {filteredLength ? selectedIdx + 1 : 0}
      </div>
    </div>
  );
}