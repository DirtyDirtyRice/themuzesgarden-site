"use client";

import { useEffect, useRef, useState } from "react";

import {
  type TrackMatcherAudioEngineMode,
} from "./trackMatcherAudioEngine";
import TrackMatcherControls from "./TrackMatcherControls";
import TrackMatcherDetailsLink from "./TrackMatcherDetailsLink";
import TrackMatcherDeckControls from "./controller/TrackMatcherDeckControls";
import TrackMatcherLaneOverviewPanel from "./controller/TrackMatcherLaneOverviewPanel";
import {
  createEmptyTrackMatcherProPitchRuntimeState,
  type TrackMatcherProPitchRuntimeState,
} from "./trackMatcherProPitchDspRuntime";
import TrackMatcherUploadPanel from "./TrackMatcherUploadPanel";
import {
  DEFAULT_SYNC_SNAPSHOT,
  DEFAULT_TRACK_A,
  DEFAULT_TRACK_B,
} from "./controller/trackMatcherControllerConstants";
import {
  revokeFileUrl,
} from "./controller/trackMatcherControllerMath";
import {
  useTrackMatcherDeckActions,
} from "./controller/useTrackMatcherDeckActions";
import {
  useTrackMatcherProPitchPreparation,
} from "./controller/useTrackMatcherProPitchPreparation";
import {
  useTrackMatcherDerivedState,
  useTrackMatcherRuntimeEffects,
  useTrackMatcherRuntimeRefs,
} from "./controller/useTrackMatcherRuntimeRefs";
import {
  useTrackMatcherSyncController,
} from "./controller/useTrackMatcherSyncController";
import type {
  TrackMatcherDeckId,
  SyncSnapshot,
} from "./controller/trackMatcherControllerTypes";

export { TRACK_MATCHER_KEYS } from "./controller/trackMatcherControllerConstants";
export type { TrackMode } from "./controller/trackMatcherControllerTypes";

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

  const {
    runtimeARef,
    runtimeBRef,
    fileUrlARef,
    fileUrlBRef,
  } = useTrackMatcherRuntimeRefs({
    runtimeA,
    runtimeB,
    fileUrlA: trackA.fileUrl,
    fileUrlB: trackB.fileUrl,
  });

  const {
    closeRuntime,
    prepareProPitchForTrack,
  } = useTrackMatcherProPitchPreparation({
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
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-2xl font-bold">Track Matcher</div>

            <p className="mt-2 text-sm text-white/60">
              Load Track A and Track B. Use Details for how syncing, BPM, key
              controls, and nudge timing work.
            </p>
          </div>

          <div className="w-full max-w-sm">
            <TrackMatcherDetailsLink />
          </div>
        </div>

        <TrackMatcherDeckControls
          activeDeckSnapshot={activeDeckSnapshot}
          deckSnapshotA={deckSnapshotA}
          deckSnapshotB={deckSnapshotB}
          engineHealth={engineHealth}
          syncSnapshot={syncSnapshot}
        />

        <TrackMatcherLaneOverviewPanel />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <TrackMatcherUploadPanel
            audioModeLabel={
              audioMode === "pro-pitch-dsp"
                ? "Pro Pitch DSP"
                : "Browser Mode"
            }
            audioRef={audioRefA}
            bpm={trackA.bpm}
            fileUrl={trackA.fileUrl}
            isActiveDeck={activeDeckId === "A"}
            runtimeStatus={runtimeA.status}
            keyIndex={trackA.keyIndex}
            mode={trackA.mode}
            onBpmChange={setTrackABpm}
            onFileSelect={setTrackAFile}
            onKeyIndexChange={setTrackAKeyIndex}
            onModeChange={setTrackAMode}
            title="Track A"
            trackName={trackA.trackName}
          />

          <TrackMatcherUploadPanel
            audioModeLabel={
              audioMode === "pro-pitch-dsp"
                ? "Pro Pitch DSP"
                : "Browser Mode"
            }
            audioRef={audioRefB}
            bpm={trackB.bpm}
            fileUrl={trackB.fileUrl}
            isActiveDeck={activeDeckId === "B"}
            runtimeStatus={runtimeB.status}
            keyIndex={trackB.keyIndex}
            mode={trackB.mode}
            onBpmChange={setTrackBBpm}
            onFileSelect={setTrackBFile}
            onKeyIndexChange={setTrackBKeyIndex}
            onModeChange={setTrackBMode}
            title="Track B"
            trackName={trackB.trackName}
          />
        </div>

        <TrackMatcherControls
          activeRuntimeStatus={activeRuntime.status}
          audioMode={audioMode}
          autoSyncBToA={autoSyncBToA}
          canUseProPitch={canUseProPitch}
          dspWarning={activePlan?.warning ?? activeRuntime.error}
          isPreparingProPitch={activeRuntime.status === "loading"}
          onMatchAToB={matchAToB}
          onMatchBToA={matchBToA}
          onNudgeBBackward={nudgeBBackward}
          onNudgeBForward={nudgeBForward}
          onPauseBoth={pauseBoth}
          onPlayBoth={playBoth}
          onResetBToStart={resetBToStart}
          onSetAudioMode={setAudioMode}
          onStopBoth={stopBoth}
          onToggleAutoSync={() => setAutoSyncBToA((current) => !current)}
        />
      </div>
    </main>
  );
}