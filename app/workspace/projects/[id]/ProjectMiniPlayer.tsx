"use client";

import { clamp01, fmtTime } from "./projectDetailsUtils";

type TrackLike = {
  id: string;
  title?: string | null;
  artist?: string | null;
};

type Props = {
  visible: boolean;
  nowPlayingTrack: TrackLike | null;
  upNextTrack: TrackLike | null;
  playbackIndex: number;
  playbackCount: number;
  elapsedSec: number;
  durationSec: number;
  volume01: number;
  muted: boolean;
  loopMode: "off" | "track" | "setlist";
  shuffleOn: boolean;
  isPaused: boolean;
  nowPlayingCardRef?: React.RefObject<HTMLDivElement | null>;
  onShowKeys: () => void;
  onTogglePinned: () => void;
  onToggleShuffle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlayPause: () => void;
  onStop: () => void;
  onToggleMuted: () => void;
  onVolumeChange: (value01: number) => void;
  onToggleLoop: () => void;
  onSeekStart: () => void;
  onSeekEnd: () => void;
  onSeekChange: (percent01: number) => void;
  miniPlayerPinned: boolean;
};

const panelClass = "rounded-2xl border border-white/25 bg-black p-3 shadow-lg";
const buttonClass =
  "rounded-xl border border-white/25 bg-black px-2 py-1 text-xs font-bold text-white transition-transform duration-150 hover:scale-[1.03] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const textSoftClass = "text-xs text-white/70";

export default function ProjectMiniPlayer(props: Props) {
  const {
    visible,
    nowPlayingTrack,
    upNextTrack,
    playbackIndex,
    playbackCount,
    elapsedSec,
    durationSec,
    volume01,
    muted,
    loopMode,
    shuffleOn,
    isPaused,
    nowPlayingCardRef,
    onShowKeys,
    onTogglePinned,
    onToggleShuffle,
    onPrev,
    onNext,
    onTogglePlayPause,
    onStop,
    onToggleMuted,
    onVolumeChange,
    onToggleLoop,
    onSeekStart,
    onSeekEnd,
    onSeekChange,
    miniPlayerPinned,
  } = props;

  if (!visible) return null;

  const safeDuration = Number.isFinite(durationSec) ? durationSec : 0;
  const safeElapsed = Number.isFinite(elapsedSec) ? elapsedSec : 0;

  const progressValue =
    safeDuration > 0 ? Math.round((safeElapsed / safeDuration) * 1000) : 0;

  const canPrev =
    playbackCount > 0 && (playbackIndex > 0 || loopMode === "setlist");

  const canNext =
    playbackCount > 0 &&
    (playbackIndex < playbackCount - 1 || loopMode === "setlist");

  const hasTrack = !!nowPlayingTrack;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 space-y-2 text-white">
      <div className={`${panelClass} space-y-2`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              className="min-w-0 text-left"
              onClick={() => {
                nowPlayingCardRef?.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              title="Jump to Now Playing"
            >
              <div className="truncate text-sm font-bold text-white">
                {hasTrack ? "▶ " : ""}
                {nowPlayingTrack?.title ?? "No track playing"}
              </div>
            </button>

            <div className={`truncate ${textSoftClass}`}>
              {nowPlayingTrack?.artist ?? "—"}
              {playbackIndex >= 0 && playbackCount > 0 ? (
                <>
                  {" "}
                  • Track {playbackIndex + 1} / {playbackCount}
                </>
              ) : null}
            </div>
          </div>

          <div className={`truncate ${textSoftClass}`}>
            Up next: {upNextTrack?.title ?? "—"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={buttonClass} onClick={onShowKeys}>
            Keys
          </button>

          <button type="button" className={buttonClass} onClick={onTogglePinned}>
            {miniPlayerPinned ? "Unpin" : "Pin"}
          </button>

          <button type="button" className={buttonClass} onClick={onToggleShuffle}>
            {shuffleOn ? "Shuffle: On" : "Shuffle: Off"}
          </button>

          <button
            type="button"
            className={buttonClass}
            onClick={onPrev}
            disabled={!canPrev}
          >
            Prev
          </button>

          <button
            type="button"
            className={buttonClass}
            onClick={onNext}
            disabled={!canNext}
          >
            Next
          </button>

          <button
            type="button"
            className={buttonClass}
            onClick={onTogglePlayPause}
          >
            {!hasTrack ? "Play" : isPaused ? "Resume" : "Pause"}
          </button>

          <button
            type="button"
            className={buttonClass}
            onClick={onStop}
            disabled={!hasTrack}
          >
            Stop
          </button>
        </div>
      </div>

      <div className={`${panelClass} space-y-2`}>
        <div className="flex items-center justify-between gap-2 text-xs text-white/70">
          <div>
            {fmtTime(safeElapsed)} / {fmtTime(safeDuration)}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" className={buttonClass} onClick={onToggleMuted}>
              {muted ? "Muted" : "Mute"}
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(clamp01(volume01) * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                onVolumeChange(v / 100);
              }}
              className="w-24"
              title="Volume"
            />

            <button type="button" className={buttonClass} onClick={onToggleLoop}>
              Loop:{" "}
              {loopMode === "off"
                ? "Off"
                : loopMode === "track"
                  ? "Track"
                  : "Setlist"}
            </button>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={1000}
          value={progressValue}
          onMouseDown={onSeekStart}
          onMouseUp={onSeekEnd}
          onTouchStart={onSeekStart}
          onTouchEnd={onSeekEnd}
          onChange={(e) => {
            const v = Number(e.target.value) || 0;
            onSeekChange(v / 1000);
          }}
          className="w-full"
        />
      </div>
    </div>
  );
}