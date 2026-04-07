"use client";

import { fmtTime } from "./projectDetailsUtils";

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

  const progressValue =
    durationSec > 0 ? Math.round((elapsedSec / durationSec) * 1000) : 0;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 space-y-2">
      <div className="rounded-2xl border bg-white p-3 shadow-lg space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              className="min-w-0 text-left"
              onClick={() => {
                nowPlayingCardRef?.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              title="Jump to Now Playing"
            >
              <div className="truncate text-sm font-medium">
                ▶ {nowPlayingTrack?.title ?? "Untitled"}
              </div>
            </button>

            <div className="truncate text-xs text-zinc-500">
              {nowPlayingTrack?.artist ?? "Supabase"}
              {playbackIndex >= 0 ? (
                <>
                  {" "}
                  • Track {playbackIndex + 1} / {playbackCount}
                </>
              ) : null}
            </div>
          </div>

          <div className="truncate text-xs text-zinc-500">
            Up next: {upNextTrack?.title ?? "—"}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={onShowKeys}
            title="Show keyboard shortcuts"
          >
            Keys
          </button>

          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={onTogglePinned}
            title={miniPlayerPinned ? "Unpin mini player" : "Pin mini player"}
          >
            {miniPlayerPinned ? "Unpin" : "Pin"}
          </button>

          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={onToggleShuffle}
            title="Shuffle"
          >
            {shuffleOn ? "Shuffle: On" : "Shuffle: Off"}
          </button>

          <button
            className="rounded border px-2 py-1 text-xs disabled:opacity-60"
            onClick={onPrev}
            disabled={playbackCount === 0 || playbackIndex <= 0}
            title="Previous"
          >
            Prev
          </button>

          <button
            className="rounded border px-2 py-1 text-xs disabled:opacity-60"
            onClick={onNext}
            disabled={playbackCount === 0 || playbackIndex === -1}
            title="Next"
          >
            Next
          </button>

          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={onTogglePlayPause}
            title="Play / Pause"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>

          <button
            className="rounded border px-2 py-1 text-xs"
            onClick={onStop}
            title="Stop"
          >
            Stop
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-3 shadow-lg space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-600">
          <div>
            {fmtTime(elapsedSec)} / {fmtTime(durationSec)}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded border px-2 py-1 text-xs"
              onClick={onToggleMuted}
              title="Mute"
            >
              {muted ? "Muted" : "Mute"}
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume01 * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                onVolumeChange(v / 100);
              }}
              className="w-24"
              title="Volume"
            />

            <button
              className="rounded border px-2 py-1 text-xs"
              onClick={onToggleLoop}
              title="Loop mode"
            >
              Loop: {loopMode === "off" ? "Off" : loopMode === "track" ? "Track" : "Setlist"}
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