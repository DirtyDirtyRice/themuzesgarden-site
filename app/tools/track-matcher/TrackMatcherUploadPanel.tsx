import Link from "next/link";
import { useState } from "react";

import { TRACK_MATCHER_KEYS, type TrackMode } from "./TrackMatcherController";

type TrackMatcherUploadPanelProps = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  bpm: number;
  fileUrl: string | null;
  keyIndex: number;
  mode: TrackMode;
  onBpmChange: (value: number) => void;
  onFileSelect: (file: File) => void;
  onKeyIndexChange: (value: number) => void;
  onModeChange: (value: TrackMode) => void;
  title: string;
  trackName: string;
};

function smallButtonClass(isActive = false) {
  return isActive
    ? "rounded border border-white bg-black px-3 py-1 text-white"
    : "rounded border border-white/40 bg-black px-3 py-1 text-white";
}

export default function TrackMatcherUploadPanel({
  audioRef,
  bpm,
  fileUrl,
  keyIndex,
  mode,
  onBpmChange,
  onFileSelect,
  onKeyIndexChange,
  onModeChange,
  title,
  trackName,
}: TrackMatcherUploadPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    void audioRef.current.play();
    setIsPlaying(true);
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white bg-black p-5" aria-label={title}>
      <div className="text-2xl font-semibold text-white">{title}</div>

      {/* TRACK */}
      <div className="flex flex-col gap-1">
        <div className="text-sm text-white">Track</div>

        <input
          type="file"
          accept="audio/*"
          className="text-white"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              onFileSelect(file);
              setIsPlaying(false);
            }
          }}
        />

        <div className="text-xs text-white">{trackName || "No track loaded"}</div>

        {fileUrl && (
          <>
            <audio ref={audioRef} src={fileUrl} />

            <button
              onClick={togglePlay}
              className="mt-1 w-fit rounded border border-white bg-black px-3 py-1 text-white"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
          </>
        )}
      </div>

      {/* BPM */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-sm text-white">
          <span>BPM: {bpm}</span>
          <span className="text-xs text-white">Active speed control</span>
        </div>

        <input
          type="range"
          min={60}
          max={180}
          value={bpm}
          onChange={(event) => onBpmChange(Number(event.target.value))}
        />

        <div className="flex gap-2">
          <button onClick={() => onBpmChange(bpm - 1)} className={smallButtonClass()}>
            -
          </button>

          <button onClick={() => onBpmChange(bpm + 1)} className={smallButtonClass()}>
            +
          </button>
        </div>

        <div className="text-xs text-white">BPM changes playback speed.</div>
      </div>

      {/* KEY */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-sm text-white">
          <span>
            Key: {TRACK_MATCHER_KEYS[keyIndex]} {mode}
          </span>

          {/* FIXED BUTTON */}
          <Link
            href="/tools/track-matcher/key"
            className="rounded border border-white bg-black px-3 py-1 text-xs font-bold text-white"
          >
            Choose Key
          </Link>
        </div>

        <input
          type="range"
          min={0}
          max={11}
          value={keyIndex}
          onChange={(event) => onKeyIndexChange(Number(event.target.value))}
        />

        <div className="flex flex-wrap gap-2">
          <button onClick={() => onKeyIndexChange((keyIndex + 11) % 12)} className={smallButtonClass()}>
            -
          </button>

          <button onClick={() => onKeyIndexChange((keyIndex + 1) % 12)} className={smallButtonClass()}>
            +
          </button>

          <button onClick={() => onModeChange("major")} className={smallButtonClass(mode === "major")}>
            Major
          </button>

          <button onClick={() => onModeChange("minor")} className={smallButtonClass(mode === "minor")}>
            Minor
          </button>
        </div>

        <div className="text-xs text-white">
          Key selection is visual only until real pitch shifting is added.
        </div>
      </div>
    </section>
  );
}