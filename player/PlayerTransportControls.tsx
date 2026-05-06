"use client";

export default function PlayerTransportControls(props: {
  tab: "project" | "search";
  hasNow: boolean;
  atProjectStart: boolean;
  atProjectEnd: boolean;
  compact: boolean;
  projectTracksLength: number;
  nowId: string | null;
  onPrevWrapped: () => void;
  onToggle: () => void;
  onStop: () => void;
  onNextWrapped: () => void;
  onResume: () => void;
  onPlayAll: () => void;
  onJumpToNow: () => void;
  onClearNow: () => void;
}) {
  const {
    tab,
    hasNow,
    atProjectStart,
    atProjectEnd,
    compact,
    projectTracksLength,
    nowId,
    onPrevWrapped,
    onToggle,
    onStop,
    onNextWrapped,
    onResume,
    onPlayAll,
    onJumpToNow,
    onClearNow,
  } = props;

  const isProjectTab = tab === "project";

  const buttonClassName =
    "!rounded-xl !border !border-white/20 !bg-black !px-3 !py-2 !text-sm !font-medium !text-[color:var(--text-normal)] disabled:!opacity-50";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={buttonClassName}
        onClick={onPrevWrapped}
        disabled={(isProjectTab && !hasNow) || atProjectStart}
        title={
          atProjectStart
            ? "Already at start of setlist"
            : isProjectTab && !hasNow
            ? "Start playback first"
            : "Previous track"
        }
      >
        Prev
      </button>

      <button
        className={[buttonClassName, "!border-white"].join(" ")}
        onClick={onToggle}
        title="Play / Pause (Space)"
      >
        Play/Pause
      </button>

      <button
        className={buttonClassName}
        onClick={onStop}
        title="Stop playback"
      >
        Stop
      </button>

      <button
        className={buttonClassName}
        onClick={onNextWrapped}
        disabled={(isProjectTab && !hasNow) || atProjectEnd}
        title={
          atProjectEnd
            ? "Already at end of setlist"
            : isProjectTab && !hasNow
            ? "Start playback first"
            : "Next track"
        }
      >
        Next
      </button>

      {!compact ? (
        <button
          className={buttonClassName}
          onClick={onResume}
          title="Resume last session (R)"
        >
          Resume
        </button>
      ) : null}

      {!compact ? (
        <button
          className={buttonClassName}
          onClick={onPlayAll}
          disabled={tab !== "project" || projectTracksLength === 0}
          title="Start setlist playback"
        >
          Play All
        </button>
      ) : null}

      <button
        className={buttonClassName}
        onClick={onJumpToNow}
        disabled={tab !== "project" || !nowId}
        title="Jump to Now (J)"
      >
        Jump (J)
      </button>

      {!compact ? (
        <button
          className={buttonClassName}
          onClick={onClearNow}
          title="Stop and clear NOW"
        >
          Clear Now
        </button>
      ) : null}
    </div>
  );
}