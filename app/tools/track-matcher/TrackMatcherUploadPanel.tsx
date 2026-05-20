import Link from "next/link";
import { useState } from "react";

import { TRACK_MATCHER_KEYS, type TrackMode } from "./TrackMatcherController";
import {
  getTrackMatcherProPitchRuntimeDetail,
  getTrackMatcherProPitchRuntimeLabel,
  type TrackMatcherProPitchRuntimeStatus,
} from "./trackMatcherProPitchDspRuntime";

type TrackMatcherUploadPanelProps = {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  bpm: number;
  fileUrl: string | null;
  keyIndex: number;
  mode: TrackMode;
  audioModeLabel?: string;
  fileError?: string;
  fileSizeLabel?: string;
  isActiveDeck?: boolean;
  runtimeStatus?: TrackMatcherProPitchRuntimeStatus;
  onBpmChange: (value: number) => void;
  onFileSelect: (file: File) => void;
  onKeyIndexChange: (value: number) => void;
  onModeChange: (value: TrackMode) => void;
  title: string;
  trackName: string;
};

function smallButtonClass(isActive = false) {
  return isActive
    ? "rounded border border-white bg-white px-3 py-1 text-black transition hover:bg-white/85"
    : "rounded border border-white/40 bg-black px-3 py-1 text-white transition hover:border-white hover:bg-white/10";
}

function getRuntimeStatusClass(status: TrackMatcherProPitchRuntimeStatus) {
  if (status === "ready") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  if (status === "loading") {
    return "border-sky-300/30 bg-sky-300/10 text-sky-100";
  }

  if (status === "failed" || status === "unsupported") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  return "border-white/10 bg-white/[0.03] text-white/60";
}

function getBpmHint(bpm: number) {
  if (bpm < 85) {
    return "Slow zone";
  }

  if (bpm > 145) {
    return "Fast zone";
  }

  return "Working zone";
}

function getKeyControlHelp(mode: TrackMode) {
  if (mode === "minor") {
    return "Minor mode selected for darker harmonic matching.";
  }

  return "Major mode selected for brighter harmonic matching.";
}

export default function TrackMatcherUploadPanel({
  audioRef,
  bpm,
  fileUrl,
  keyIndex,
  mode,
  audioModeLabel = "Browser Mode fallback",
  fileError = "",
  fileSizeLabel = "",
  isActiveDeck = false,
  runtimeStatus = "idle",
  onBpmChange,
  onFileSelect,
  onKeyIndexChange,
  onModeChange,
  title,
  trackName,
}: TrackMatcherUploadPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const runtimeLabel = getTrackMatcherProPitchRuntimeLabel(runtimeStatus);
  const runtimeDetail = getTrackMatcherProPitchRuntimeDetail(runtimeStatus);
  const keyName = TRACK_MATCHER_KEYS[keyIndex] ?? TRACK_MATCHER_KEYS[0];

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
    <section
      className={`flex flex-col gap-4 rounded-2xl border bg-black p-5 ${
        isActiveDeck ? "border-emerald-300/50" : "border-white/15"
      }`}
      aria-label={title}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-white">{title}</div>

          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">
            {isActiveDeck ? "Active deck" : "Standby deck"}
          </p>
        </div>

        <div
          className={`rounded-full border px-3 py-1 text-xs font-bold ${getRuntimeStatusClass(
            runtimeStatus,
          )}`}
        >
          {runtimeLabel}
        </div>
      </div>

      {/* TRACK */}
      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-bold text-white">Track</div>

          <div className="text-xs text-white/45">{audioModeLabel}</div>
        </div>

        <input
          type="file"
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
          className="text-sm text-white file:mr-3 file:rounded file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-bold file:text-black"
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (file) {
              onFileSelect(file);
              setIsPlaying(false);
            }
          }}
        />

        <div className="rounded-xl border border-white/10 bg-black p-3">
          <div className="text-sm font-bold text-white">
            {trackName || "No track loaded"}
          </div>

          <div className="mt-1 text-xs leading-5 text-white/55">
            {fileSizeLabel || runtimeDetail}
          </div>

          {fileError && (
            <div className="mt-2 rounded-lg border border-rose-300/30 bg-rose-300/10 px-3 py-2 text-xs font-bold text-rose-100">
              {fileError}
            </div>
          )}
        </div>

        {fileUrl && (
          <>
            <audio
              ref={audioRef}
              src={fileUrl}
              onEnded={() => setIsPlaying(false)}
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
            />

            <button
              type="button"
              onClick={togglePlay}
              className="mt-1 w-fit rounded border border-white bg-black px-3 py-1 text-white transition hover:bg-white hover:text-black"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
          </>
        )}
      </div>

      {/* BPM */}
      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3 text-sm text-white">
          <span>BPM: {bpm}</span>
          <span className="text-xs text-white/55">{getBpmHint(bpm)}</span>
        </div>

        <input
          type="range"
          min={60}
          max={180}
          value={bpm}
          onChange={(event) => onBpmChange(Number(event.target.value))}
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onBpmChange(bpm - 1)}
            className={smallButtonClass()}
          >
            -
          </button>

          <button
            type="button"
            onClick={() => onBpmChange(bpm + 1)}
            className={smallButtonClass()}
          >
            +
          </button>
        </div>

        <div className="text-xs leading-5 text-white/55">
          BPM changes playback speed now. Pro Pitch will use this as the tempo
          target for the DSP path.
        </div>
      </div>

      {/* KEY */}
      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3 text-sm text-white">
          <span>
            Key: {keyName} {mode}
          </span>

          <Link
            href="/tools/track-matcher/key"
            className="rounded border border-white bg-black px-3 py-1 text-xs font-bold text-white transition hover:bg-white hover:text-black"
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
          <button
            type="button"
            onClick={() => onKeyIndexChange((keyIndex + 11) % 12)}
            className={smallButtonClass()}
          >
            -
          </button>

          <button
            type="button"
            onClick={() => onKeyIndexChange((keyIndex + 1) % 12)}
            className={smallButtonClass()}
          >
            +
          </button>

          <button
            type="button"
            onClick={() => onModeChange("major")}
            className={smallButtonClass(mode === "major")}
          >
            Major
          </button>

          <button
            type="button"
            onClick={() => onModeChange("minor")}
            className={smallButtonClass(mode === "minor")}
          >
            Minor
          </button>
        </div>

        <div className="text-xs leading-5 text-white/55">
          {getKeyControlHelp(mode)} Key movement is now prepared for the Pro
          Pitch DSP layer.
        </div>
      </div>
    </section>
  );
}