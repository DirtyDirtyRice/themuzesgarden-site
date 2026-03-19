import type { ReactNode } from "react";

export default function ProjectTabHeader(props: {
  projectTrackCount: number;
  shuffle: boolean;
  setShuffle: (v: (prev: boolean) => boolean) => void;
  loop: boolean;
  setLoop: (v: (prev: boolean) => boolean) => void;
  onJumpToNow: () => void;
  nowId: string | null;
  handleResetOrder: () => void;
  onRefresh: () => void;
  loadingProject: boolean;

  totalIndexedMoments: number;
  visibleTrackCount: number;
  visibleIndexedMoments: number;
  denseTrackCount: number;
  highDensityTrackCount: number;

  nowIdx: number;
  upNextIdx: number;
  remainingCount: number;
  showingLabel: string;
  selectedVisibleIdx: number;

  scrollToUpNext: () => void;
  hidePlayed: boolean;
  setHidePlayed: (v: (prev: boolean) => boolean) => void;
}) {
  const {
    projectTrackCount,
    shuffle,
    setShuffle,
    loop,
    setLoop,
    onJumpToNow,
    nowId,
    handleResetOrder,
    onRefresh,
    loadingProject,

    totalIndexedMoments,
    visibleTrackCount,
    visibleIndexedMoments,
    denseTrackCount,
    highDensityTrackCount,

    nowIdx,
    upNextIdx,
    remainingCount,
    showingLabel,
    selectedVisibleIdx,

    scrollToUpNext,
    hidePlayed,
    setHidePlayed,
  } = props;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">
            Project Setlist ({projectTrackCount})
          </div>
          <div className="text-[11px] text-zinc-500">
            Playback follows this order. Reordering persists automatically per project.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className={[
              "rounded border px-2 py-1 text-xs",
              shuffle ? "bg-black text-white" : "bg-white",
            ].join(" ")}
            onClick={() => setShuffle((v) => !v)}
            title="Shuffle (Hotkey: S)"
          >
            Shuffle
          </button>

          <button
            className={[
              "rounded border px-2 py-1 text-xs",
              loop ? "bg-black text-white" : "bg-white",
            ].join(" ")}
            onClick={() => setLoop((v) => !v)}
            title="Loop (Hotkey: L)"
          >
            Loop
          </button>

          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={onJumpToNow}
            disabled={!nowId}
            title="Jump to Now (Hotkey: J)"
          >
            Jump (J)
          </button>

          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={handleResetOrder}
            disabled={loadingProject}
            title="Reset setlist order to linked-track truth"
          >
            Reset Order
          </button>

          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={onRefresh}
            disabled={loadingProject}
            title="Manual refresh (usually not needed)"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
          Setlist {projectTrackCount}
        </span>
        <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[10px] text-yellow-800">
          Indexed moments {totalIndexedMoments}
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600">
          Visible tracks {visibleTrackCount}
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600">
          Visible moments {visibleIndexedMoments}
        </span>
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600">
          Dense tracks {denseTrackCount}
        </span>
        {highDensityTrackCount > 0 ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800">
            High density {highDensityTrackCount}
          </span>
        ) : null}
      </div>

      <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-zinc-700">
            <span className="font-medium">
              Playing: {nowIdx >= 0 ? String(nowIdx + 1).padStart(2, "0") : "--"}
            </span>
            {" • "}
            <span>
              Up Next:{" "}
              {upNextIdx >= 0 && upNextIdx < projectTrackCount
                ? String(upNextIdx + 1).padStart(2, "0")
                : "--"}
            </span>
            {" • "}
            <span>Remaining: {remainingCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded border px-2 py-1"
              onClick={onJumpToNow}
              disabled={!nowId}
              title="Scroll to NOW"
            >
              Back to Now
            </button>

            <button
              className="rounded border px-2 py-1"
              onClick={scrollToUpNext}
              disabled={upNextIdx < 0 || upNextIdx >= projectTrackCount}
              title="Scroll to UP NEXT"
            >
              Go Up Next
            </button>

            <button
              className={[
                "rounded border px-2 py-1",
                hidePlayed ? "bg-black text-white" : "bg-white",
              ].join(" ")}
              onClick={() => setHidePlayed((v) => !v)}
              title="Hide tracks above NOW"
            >
              {hidePlayed ? "Show Played" : "Hide Played"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-zinc-600">
          <div>{showingLabel}</div>
          <div>
            Selected:{" "}
            <span className="font-medium">
              {selectedVisibleIdx >= 0
                ? String(selectedVisibleIdx + 1).padStart(2, "0")
                : "--"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-zinc-50 px-3 py-2 text-[11px] text-zinc-700">
        Project keys: <span className="font-medium">↑ ↓</span> select row •{" "}
        <span className="font-medium">Enter</span> play from here •{" "}
        <span className="font-medium">Space</span> play track •{" "}
        <span className="font-medium">M</span> play first moment • drag handle to reorder
      </div>
    </>
  );
}