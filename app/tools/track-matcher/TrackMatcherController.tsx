"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode, RefObject } from "react";
import TrackMatcherFinderDropdown from "./TrackMatcherFinderDropdown";
import { type TrackMatcherAudioEngineMode } from "./trackMatcherAudioEngine";
import TrackMatcherDetailsLink from "./TrackMatcherDetailsLink";
import TrackMatcherDeckControls from "./controller/TrackMatcherDeckControls";
import TrackMatcherLaneOverviewPanel from "./controller/TrackMatcherLaneOverviewPanel";
import {
  createEmptyTrackMatcherProPitchRuntimeState,
  type TrackMatcherProPitchRuntimeState,
} from "./trackMatcherProPitchDspRuntime";
import {
  DEFAULT_SYNC_SNAPSHOT,
  DEFAULT_TRACK_A,
  DEFAULT_TRACK_B,
} from "./controller/trackMatcherControllerConstants";
import { revokeFileUrl } from "./controller/trackMatcherControllerMath";
import { useTrackMatcherDeckActions } from "./controller/useTrackMatcherDeckActions";
import { useTrackMatcherProPitchPreparation } from "./controller/useTrackMatcherProPitchPreparation";
import {
  useTrackMatcherDerivedState,
  useTrackMatcherRuntimeEffects,
  useTrackMatcherRuntimeRefs,
} from "./controller/useTrackMatcherRuntimeRefs";
import { useTrackMatcherSyncController } from "./controller/useTrackMatcherSyncController";
import type {
  TrackMatcherDeckId,
  SyncSnapshot,
} from "./controller/trackMatcherControllerTypes";

export { TRACK_MATCHER_KEYS } from "./controller/trackMatcherControllerConstants";
export type { TrackMode } from "./controller/trackMatcherControllerTypes";

type TrackMatcherAccent = "blue" | "purple" | "green" | "orange" | "violet";
type TrackMatcherMode = "major" | "minor";

const KEY_LABELS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const accentStyles: Record<
  TrackMatcherAccent,
  {
    button: string;
    glow: string;
    icon: string;
    panel: string;
    slider: string;
    text: string;
  }
> = {
  blue: {
    button: "border-blue-400/25 bg-blue-500/[0.07] text-blue-100",
    glow: "shadow-blue-950/20",
    icon: "from-blue-600 to-sky-400",
    panel: "border-blue-400/25 bg-blue-500/[0.035]",
    slider: "accent-blue-500",
    text: "text-blue-200",
  },
  purple: {
    button: "border-purple-400/25 bg-purple-500/[0.07] text-purple-100",
    glow: "shadow-purple-950/20",
    icon: "from-fuchsia-600 to-purple-500",
    panel: "border-purple-400/25 bg-purple-500/[0.035]",
    slider: "accent-purple-500",
    text: "text-purple-200",
  },
  green: {
    button: "border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-100",
    glow: "shadow-emerald-950/20",
    icon: "from-emerald-500 to-green-700",
    panel: "border-emerald-400/25 bg-emerald-500/[0.035]",
    slider: "accent-emerald-500",
    text: "text-emerald-200",
  },
  orange: {
    button: "border-orange-400/25 bg-orange-500/[0.07] text-orange-100",
    glow: "shadow-orange-950/20",
    icon: "from-yellow-500 to-orange-600",
    panel: "border-orange-400/25 bg-orange-500/[0.035]",
    slider: "accent-orange-500",
    text: "text-orange-200",
  },
  violet: {
    button: "border-violet-400/25 bg-violet-500/[0.07] text-violet-100",
    glow: "shadow-violet-950/20",
    icon: "from-violet-600 to-fuchsia-600",
    panel: "border-violet-400/25 bg-violet-500/[0.035]",
    slider: "accent-violet-500",
    text: "text-violet-200",
  },
};

const liftClass =
  "transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const softButtonClass =
  "inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-xl border border-white/12 bg-white/[0.07] px-3 py-2 text-xs font-black text-white/85 shadow-lg shadow-black/20 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

const tinyButtonClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-white/12 bg-white/[0.07] px-2 text-xs font-black text-white/85 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]";

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getKeyLabel(keyIndex: number) {
  return KEY_LABELS[clampNumber(Math.round(keyIndex), 0, KEY_LABELS.length - 1)] ?? "C";
}

function TrackMatcherHeaderRow() {
  return (
    <section className="flex min-h-12 items-center justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.025] px-4 py-2 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="flex items-end gap-1" aria-hidden="true">
          <span className="h-4 w-1 rounded-full bg-blue-500" />
          <span className="h-7 w-1 rounded-full bg-purple-500" />
          <span className="h-5 w-1 rounded-full bg-cyan-400" />
          <span className="h-8 w-1 rounded-full bg-fuchsia-500" />
        </div>

        <h1 className="text-xl font-black tracking-tight text-white md:text-2xl">
          TRACK-MATCHER
        </h1>
      </div>

      <span className="hidden rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/70 sm:inline-flex">
        two deck match lab
      </span>
    </section>
  );
}

function HoverHintButton({
  children,
  label = "Details",
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <span className="group relative inline-flex">
      <button className={tinyButtonClass} type="button">
        {label}
      </button>

      <span className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-72 rounded-2xl border border-white/15 bg-black p-3 text-left text-xs leading-5 text-white/75 shadow-2xl shadow-black group-hover:block">
        {children}
      </span>
    </span>
  );
}

function UtilityDetails({
  accent,
  children,
  hoverText,
  title,
}: {
  accent: TrackMatcherAccent;
  children: ReactNode;
  hoverText: string;
  title: string;
}) {
  const styles = accentStyles[accent];

  return (
    <details className={`group rounded-2xl border ${styles.panel} shadow-xl ${styles.glow}`}>
      <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 ${liftClass}`}>
        <span className="group/hint relative inline-flex min-w-0 items-center gap-3">
          <span className={`h-3 w-3 rounded-full bg-gradient-to-br ${styles.icon}`} />
          <span className="truncate text-sm font-black text-white/90">{title}</span>
          <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-80 rounded-2xl border border-white/15 bg-black p-3 text-xs leading-5 text-white/75 shadow-2xl shadow-black group-hover/hint:block">
            {hoverText}
          </span>
        </span>

        <span className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-black text-white/70 transition-transform duration-150 group-open:rotate-90">
          ›
        </span>
      </summary>

      <div className="border-t border-white/10 p-3">{children}</div>
    </details>
  );
}

function TrackMatcherTransportButton({
  accent,
  children,
  onClick,
}: {
  accent: TrackMatcherAccent;
  children: ReactNode;
  onClick: () => void;
}) {
  const styles = accentStyles[accent];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-black shadow-lg shadow-black/20 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98] ${styles.button}`}
    >
      {children}
    </button>
  );
}

function TrackMatcherDeckCard({
  accent,
  audioRef,
  bpm,
  deckLabel,
  fileUrl,
  isActiveDeck,
  keyIndex,
  mode,
  onActivateDeck,
  onBpmChange,
  onFileSelect,
  onKeyIndexChange,
  onModeChange,
}: {
  accent: TrackMatcherAccent;
  audioRef: RefObject<HTMLAudioElement | null>;
  bpm: number;
  deckLabel: string;
  fileUrl: string | null;
  isActiveDeck: boolean;
  keyIndex: number;
  mode: TrackMatcherMode;
  onActivateDeck: () => void;
  onBpmChange: (value: number) => void;
  onFileSelect: (file: File) => void;
  onKeyIndexChange: (value: number) => void;
  onModeChange: (value: TrackMatcherMode) => void;
}) {
  const styles = accentStyles[accent];
  const keyLabel = getKeyLabel(keyIndex);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
  }

  function playDeck() {
    onActivateDeck();
    void audioRef.current?.play();
  }

  function pauseDeck() {
    audioRef.current?.pause();
  }

  function stopDeck() {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }

  return (
    <section className={`rounded-[1.6rem] border ${styles.panel} p-3 shadow-2xl ${styles.glow}`}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${styles.icon} text-lg font-black text-white shadow-xl shadow-black/30`}>
            {deckLabel}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-xl font-black text-white">Track {deckLabel}</h2>
            <p className={`text-xs font-black uppercase tracking-[0.14em] ${isActiveDeck ? styles.text : "text-white/45"}`}>
              {isActiveDeck ? "active" : "standby"}
            </p>
          </div>
        </div>

        <HoverHintButton>
          Track {deckLabel} is the main comparison deck. Load audio, play it, then tune BPM and key without exposing extra explanation on the page.
        </HoverHintButton>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <label className={`${softButtonClass} cursor-pointer`}>
            Choose File
            <input className="hidden" type="file" accept="audio/*" onChange={handleFileChange} />
          </label>

          <span className="min-w-0 truncate rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white/60">
            {fileUrl ? "File loaded" : "No file chosen"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <TrackMatcherTransportButton accent={accent} onClick={playDeck}>
            Play
          </TrackMatcherTransportButton>
          <TrackMatcherTransportButton accent={accent} onClick={pauseDeck}>
            Pause
          </TrackMatcherTransportButton>
          <TrackMatcherTransportButton accent={accent} onClick={stopDeck}>
            Stop
          </TrackMatcherTransportButton>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-black text-white">BPM</p>
            <p className={`font-mono text-lg font-black ${styles.text}`}>{bpm}</p>
          </div>

          <input
            className={`w-full ${styles.slider}`}
            min={60}
            max={200}
            step={1}
            type="range"
            value={bpm}
            onChange={(event) => onBpmChange(Number(event.target.value))}
          />

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              className={tinyButtonClass}
              type="button"
              onClick={() => onBpmChange(clampNumber(bpm - 1, 60, 200))}
            >
              -
            </button>

            <button
              className={tinyButtonClass}
              type="button"
              onClick={() => onBpmChange(clampNumber(bpm + 1, 60, 200))}
            >
              +
            </button>

            <HoverHintButton>
              BPM changes playback speed now. Pro Pitch will use this as the tempo target for the deeper DSP path.
            </HoverHintButton>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-black text-white">Key</p>
            <p className={`font-mono text-lg font-black ${styles.text}`}>
              {keyLabel} {mode}
            </p>
          </div>

          <input
            className={`w-full ${styles.slider}`}
            min={0}
            max={11}
            step={1}
            type="range"
            value={keyIndex}
            onChange={(event) => onKeyIndexChange(Number(event.target.value))}
          />

          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <button
              className={tinyButtonClass}
              type="button"
              onClick={() => onKeyIndexChange(clampNumber(keyIndex - 1, 0, 11))}
            >
              -
            </button>

            <button
              className={tinyButtonClass}
              type="button"
              onClick={() => onKeyIndexChange(clampNumber(keyIndex + 1, 0, 11))}
            >
              +
            </button>

            <button
              className={`${softButtonClass} min-h-8 px-2 py-1`}
              type="button"
              onClick={() => onModeChange("major")}
            >
              Major
            </button>

            <button
              className={`${softButtonClass} min-h-8 px-2 py-1`}
              type="button"
              onClick={() => onModeChange("minor")}
            >
              Minor
            </button>

            <HoverHintButton>
              Major is brighter. Minor is darker. Key movement is prepared for the deeper Pro Pitch DSP layer.
            </HoverHintButton>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={fileUrl ?? undefined} preload="metadata" />
    </section>
  );
}

export default function TrackMatcherController() {
  const [trackA, setTrackA] = useState(DEFAULT_TRACK_A);
  const [trackB, setTrackB] = useState(DEFAULT_TRACK_B);
  const [runtimeA, setRuntimeA] = useState<TrackMatcherProPitchRuntimeState>(
    () => createEmptyTrackMatcherProPitchRuntimeState(),
  );
  const [runtimeB, setRuntimeB] = useState<TrackMatcherProPitchRuntimeState>(
    () => createEmptyTrackMatcherProPitchRuntimeState(),
  );
  const [activeDeckId, setActiveDeckId] = useState<TrackMatcherDeckId>("A");
  const [audioMode, setAudioMode] = useState<TrackMatcherAudioEngineMode>(
    "browser-speed-pitch",
  );
  const [autoSyncBToA, setAutoSyncBToA] = useState(false);
  const [nudgeAmount] = useState(0.05);
  const [syncSnapshot, setSyncSnapshot] = useState<SyncSnapshot>(
    DEFAULT_SYNC_SNAPSHOT,
  );

  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);

  const { runtimeARef, runtimeBRef, fileUrlARef, fileUrlBRef } =
    useTrackMatcherRuntimeRefs({
      runtimeA,
      runtimeB,
      fileUrlA: trackA.fileUrl,
      fileUrlB: trackB.fileUrl,
    });

  const { closeRuntime, prepareProPitchForTrack } =
    useTrackMatcherProPitchPreparation({
      setRuntimeA,
      setRuntimeB,
    });

  const {
    activeDeckSnapshot,
    activePlan,
    activeRuntime,
    canUseProPitch,
    canUseProPitchA,
    canUseProPitchB,
    deckSnapshotA,
    deckSnapshotB,
    engineHealth,
  } = useTrackMatcherDerivedState({
    activeDeckId,
    audioMode,
    runtimeA,
    runtimeB,
    trackA,
    trackB,
  });

  const {
    setTrackAFile,
    setTrackBFile,
    setTrackABpm,
    setTrackBBpm,
    setTrackAKeyIndex,
    setTrackBKeyIndex,
    setTrackAMode,
    setTrackBMode,
    playBoth,
    pauseBoth,
    stopBoth,
    nudgeBBackward,
    nudgeBForward,
    resetBToStart,
    matchAToB,
    matchBToA,
  } = useTrackMatcherDeckActions({
    trackA,
    trackB,
    setTrackA,
    setTrackB,
    setActiveDeckId,
    audioRefA,
    audioRefB,
    audioMode,
    canUseProPitchA,
    canUseProPitchB,
    setSyncSnapshot,
    nudgeAmount,
    prepareProPitchForTrack,
  });

  useTrackMatcherRuntimeEffects({
    audioMode,
    autoSyncBToA,
    canUseProPitchA,
    canUseProPitchB,
    trackA,
    trackB,
    runtimeA,
    runtimeB,
    audioRefA,
    audioRefB,
    setAudioMode,
    setRuntimeA,
    setRuntimeB,
  });

  useTrackMatcherSyncController({
    audioMode,
    autoSyncBToA,
    canUseProPitchB,
    trackA,
    trackB,
    audioRefA,
    audioRefB,
    setTrackB,
    setSyncSnapshot,
  });

  useEffect(() => {
    return () => {
      revokeFileUrl(fileUrlARef.current);
      revokeFileUrl(fileUrlBRef.current);
      closeRuntime(runtimeARef.current);
      closeRuntime(runtimeBRef.current);
    };
  }, [closeRuntime, fileUrlARef, fileUrlBRef, runtimeARef, runtimeBRef]);

  return (
    <main className="min-h-screen bg-black p-3 text-white md:p-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
      <TrackMatcherHeaderRow />



<section className="rounded-[1.8rem] border border-white/10 bg-white/[0.025] p-3 shadow-2xl shadow-black/25">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <TrackMatcherDeckCard
              accent="blue"
              audioRef={audioRefA}
              bpm={trackA.bpm}
              deckLabel="A"
              fileUrl={trackA.fileUrl}
              isActiveDeck={activeDeckId === "A"}
              keyIndex={trackA.keyIndex}
              mode={trackA.mode}
              onActivateDeck={() => setActiveDeckId("A")}
              onBpmChange={setTrackABpm}
              onFileSelect={setTrackAFile}
              onKeyIndexChange={setTrackAKeyIndex}
              onModeChange={setTrackAMode}
            />

            <TrackMatcherDeckCard
              accent="purple"
              audioRef={audioRefB}
              bpm={trackB.bpm}
              deckLabel="B"
              fileUrl={trackB.fileUrl}
              isActiveDeck={activeDeckId === "B"}
              keyIndex={trackB.keyIndex}
              mode={trackB.mode}
              onActivateDeck={() => setActiveDeckId("B")}
              onBpmChange={setTrackBBpm}
              onFileSelect={setTrackBFile}
              onKeyIndexChange={setTrackBKeyIndex}
              onModeChange={setTrackBMode}
            />
          </div>

          <div className="mt-3 flex flex-nowrap gap-2 overflow-x-auto rounded-[1.35rem] border border-white/10 bg-black/50 p-2">
            <button className={softButtonClass} type="button" onClick={playBoth}>
              Play All
            </button>

            <button className={softButtonClass} type="button" onClick={pauseBoth}>
              Pause All
            </button>

            <button className={softButtonClass} type="button" onClick={stopBoth}>
              Stop All
            </button>

            <button className={softButtonClass} type="button" onClick={matchAToB}>
              B→A
            </button>

            <button className={softButtonClass} type="button" onClick={matchBToA}>
              A→B
            </button>

            <button
              className={softButtonClass}
              type="button"
              onClick={() => setAutoSyncBToA((current) => !current)}
            >
              Auto Sync {autoSyncBToA ? "ON" : "OFF"}
            </button>

            <button className={softButtonClass} type="button" onClick={nudgeBBackward}>
              ← Nudge
            </button>

            <button className={softButtonClass} type="button" onClick={nudgeBForward}>
              Nudge →
            </button>

            <button className={softButtonClass} type="button" onClick={resetBToStart}>
              Reset B
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <UtilityDetails
              accent="green"
              title="Details / More Info"
              hoverText="Opens the deeper Track Matcher information without letting deck status or lane architecture dominate the tool page."
            >
              <div className="grid gap-3">
                <TrackMatcherDetailsLink />

                <details className="rounded-2xl border border-white/10 bg-black/35 p-3">
                  <summary className="cursor-pointer list-none text-sm font-black text-white/85">
                    Deck Status + Sync Metrics
                  </summary>

                  <div className="mt-3 border-t border-white/10 pt-3">
                    <TrackMatcherDeckControls
                      activeDeckSnapshot={activeDeckSnapshot}
                      deckSnapshotA={deckSnapshotA}
                      deckSnapshotB={deckSnapshotB}
                      engineHealth={engineHealth}
                      syncSnapshot={syncSnapshot}
                    />
                  </div>
                </details>

                <details className="rounded-2xl border border-white/10 bg-black/35 p-3">
                  <summary className="cursor-pointer list-none text-sm font-black text-white/85">
                    Lane Architecture Dashboard
                  </summary>

                  <div className="mt-3 border-t border-white/10 pt-3">
                    <TrackMatcherLaneOverviewPanel />
                  </div>
                </details>
              </div>
            </UtilityDetails>

            <UtilityDetails
              accent="violet"
              title="Pro Pitch DSP"
              hoverText="Shows the deeper DSP path for separated tempo and pitch control while keeping the main page focused on Track A and Track B."
            >
              <div className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm leading-6 text-white/70">
                <p className="font-black text-white">{engineHealth.label}</p>
                <p className="mt-2">{engineHealth.detail}</p>
                <p className="mt-2">
                  Current mode: {audioMode === "pro-pitch-dsp" ? "Pro Pitch DSP" : "Browser speed/pitch"}
                </p>
              </div>
            </UtilityDetails>
          </div>
        </section>

        <div className="hidden">
          {activePlan?.warning}
          {activeRuntime.status}
          {String(canUseProPitch)}
          {String(canUseProPitchA)}
          {String(canUseProPitchB)}
          {engineHealth.label}
        </div>
      </div>
    </main>
  );
}
