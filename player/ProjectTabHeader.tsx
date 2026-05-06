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

  const baseButton =
    "rounded border border-white bg-black px-2 py-1 text-xs text-white";
  const activeButton =
    "rounded border border-white bg-black px-2 py-1 text-xs text-white shadow-[inset_0_0_0_1px_white]";
  const pillClass =
    "rounded-full border border-white bg-black px-2 py-0.5 text-[10px] text-white";

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-white">
            Project Setlist ({projectTrackCount})
          </div>
          <div className="text-[11px] text-white">
            Playback follows this order. Reordering persists automatically per
            project.
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            className={shuffle ? activeButton : baseButton}
            onClick={() => setShuffle((v) => !v)}
            title="Shuffle (Hotkey: S)"
            type="button"
          >
            Shuffle
          </button>

          <button
            className={loop ? activeButton : baseButton}
            onClick={() => setLoop((v) => !v)}
            title="Loop (Hotkey: L)"
            type="button"
          >
            Loop
          </button>

          <button
            className={baseButton}
            onClick={onJumpToNow}
            disabled={!nowId}
            title="Jump to Now (Hotkey: J)"
            type="button"
          >
            Jump (J)
          </button>

          <button
            className={baseButton}
            onClick={handleResetOrder}
            disabled={loadingProject}
            title="Reset setlist order to linked-track truth"
            type="button"
          >
            Reset Order
          </button>

          <button
            className={baseButton}
            onClick={onRefresh}
            disabled={loadingProject}
            title="Manual refresh (usually not needed)"
            type="button"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={pillClass}>Setlist {projectTrackCount}</span>
        <span className={pillClass}>Indexed moments {totalIndexedMoments}</span>
        <span className={pillClass}>Visible tracks {visibleTrackCount}</span>
        <span className={pillClass}>Visible moments {visibleIndexedMoments}</span>
        <span className={pillClass}>Dense tracks {denseTrackCount}</span>
        {highDensityTrackCount > 0 ? (
          <span className={pillClass}>High density {highDensityTrackCount}</span>
        ) : null}
      </div>

      <div className="space-y-2 rounded-xl border border-white bg-black px-3 py-2 text-[11px] text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="text-white">
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
              className={baseButton}
              onClick={onJumpToNow}
              disabled={!nowId}
              title="Scroll to NOW"
              type="button"
            >
              Back to Now
            </button>

            <button
              className={baseButton}
              onClick={scrollToUpNext}
              disabled={upNextIdx < 0 || upNextIdx >= projectTrackCount}
              title="Scroll to UP NEXT"
              type="button"
            >
              Go Up Next
            </button>

            <button
              className={hidePlayed ? activeButton : baseButton}
              onClick={() => setHidePlayed((v) => !v)}
              title="Hide tracks above NOW"
              type="button"
            >
              {hidePlayed ? "Show Played" : "Hide Played"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-white">
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

      <div className="rounded-xl border border-white bg-black px-3 py-2 text-[11px] text-white">
        Project keys: <span className="font-medium">↑ ↓</span> select row •{" "}
        <span className="font-medium">Enter</span> play from here •{" "}
        <span className="font-medium">Space</span> play track •{" "}
        <span className="font-medium">M</span> play first moment • drag handle
        to reorder
      </div>
    </>
  );
}