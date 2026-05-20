"use client";

import type { TrackMatcherAudioEngineMode } from "./trackMatcherAudioEngine";
import {
  getTrackMatcherProPitchRuntimeDetail,
  getTrackMatcherProPitchRuntimeLabel,
  type TrackMatcherProPitchRuntimeStatus,
} from "./trackMatcherProPitchDspRuntime";

type TrackMatcherControlsProps = {
  autoSyncBToA: boolean;
  audioMode?: TrackMatcherAudioEngineMode;
  activeRuntimeStatus?: TrackMatcherProPitchRuntimeStatus;
  canUseProPitch?: boolean;
  isPreparingProPitch?: boolean;
  dspWarning?: string;
  onMatchAToB: () => void;
  onMatchBToA: () => void;
  onNudgeBBackward: () => void;
  onNudgeBForward: () => void;
  onPauseBoth: () => void;
  onPlayBoth: () => void;
  onResetBToStart: () => void;
  onStopBoth: () => void;
  onToggleAutoSync: () => void;
  onSetAudioMode?: (mode: TrackMatcherAudioEngineMode) => void;
};

function buttonClass(extraClassName = "") {
  return `rounded border border-white/20 bg-white px-4 py-2 text-black transition hover:bg-white/85 ${extraClassName}`.trim();
}

function modeButtonClass(isActive: boolean) {
  if (isActive) {
    return "rounded-2xl border border-emerald-300/40 bg-emerald-300/15 px-4 py-3 text-left text-sm font-bold text-emerald-100 transition hover:bg-emerald-300/20";
  }

  return "rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm font-bold text-white/70 transition hover:bg-white/[0.08] hover:text-white";
}

function getModeSummary(mode: TrackMatcherAudioEngineMode) {
  if (mode === "pro-pitch-dsp") {
    return "Tempo stays cleaner while pitch moves through the DSP path.";
  }

  return "Stable browser fallback where speed and pitch move together.";
}

function getStatusClass(status: TrackMatcherProPitchRuntimeStatus) {
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

export default function TrackMatcherControls({
  autoSyncBToA,
  audioMode = "browser-speed-pitch",
  activeRuntimeStatus = "idle",
  canUseProPitch = false,
  isPreparingProPitch = false,
  dspWarning = "",
  onMatchAToB,
  onMatchBToA,
  onNudgeBBackward,
  onNudgeBForward,
  onPauseBoth,
  onPlayBoth,
  onResetBToStart,
  onStopBoth,
  onToggleAutoSync,
  onSetAudioMode,
}: TrackMatcherControlsProps) {
  const runtimeLabel = getTrackMatcherProPitchRuntimeLabel(activeRuntimeStatus);
  const runtimeDetail = getTrackMatcherProPitchRuntimeDetail(activeRuntimeStatus);
  const proPitchSelected = audioMode === "pro-pitch-dsp";

  return (
    <section className="flex flex-col gap-5">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
              Audio Engine
            </p>

            <h2 className="mt-2 text-xl font-black text-white">
              Pro Pitch DSP
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">
              Real-time DSP engine with separated tempo and pitch layers.
            </p>
          </div>

          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${getStatusClass(
              activeRuntimeStatus,
            )}`}
          >
            {isPreparingProPitch ? "Preparing DSP..." : runtimeLabel}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => onSetAudioMode?.("browser-speed-pitch")}
            className={modeButtonClass(audioMode === "browser-speed-pitch")}
          >
            Browser Mode
            <span className="mt-1 block text-xs text-white/50">
              {getModeSummary("browser-speed-pitch")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSetAudioMode?.("pro-pitch-dsp")}
            className={modeButtonClass(proPitchSelected)}
          >
            Pro Pitch DSP
            <span className="mt-1 block text-xs text-white/50">
              {getModeSummary("pro-pitch-dsp")}
            </span>
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
          <p className="text-sm font-bold text-white">
            {proPitchSelected && canUseProPitch
              ? "DSP ready for playback."
              : runtimeDetail}
          </p>

          <p className="mt-2 text-xs text-white/50">
            {dspWarning ||
              "System falls back to Browser Mode if DSP is unavailable."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onPlayBoth} className={buttonClass()}>
          ▶ Play
        </button>
        <button onClick={onPauseBoth} className={buttonClass()}>
          ⏸ Pause
        </button>
        <button onClick={onStopBoth} className={buttonClass()}>
          ⏹ Stop
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onMatchBToA} className={buttonClass()}>
          B → A
        </button>
        <button onClick={onMatchAToB} className={buttonClass()}>
          A → B
        </button>
        <button onClick={onToggleAutoSync} className={buttonClass()}>
          Auto Sync: {autoSyncBToA ? "ON" : "OFF"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onNudgeBBackward} className={buttonClass()}>
          ← Nudge
        </button>
        <button onClick={onNudgeBForward} className={buttonClass()}>
          Nudge →
        </button>
        <button onClick={onResetBToStart} className={buttonClass()}>
          Reset B
        </button>
      </div>
    </section>
  );
}
