"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { refreshTrackMatcherProPitchPlan } from "../trackMatcherProPitchDspRuntime";
import type { TrackMatcherAudioEngineMode } from "../trackMatcherAudioEngine";
import type { TrackMatcherProPitchRuntimeState } from "../trackMatcherProPitchDspRuntime";
import {
  getAudioTrackInput,
  getEffectivePlaybackRate,
} from "./trackMatcherControllerMath";
import {
  getControllerDeckSnapshot,
  getControllerEngineHealth,
  shouldForceBrowserFallback,
} from "./trackMatcherControllerSnapshots";
import type {
  TrackMatcherDeckId,
  TrackMatcherTrackState,
} from "./trackMatcherControllerTypes";

export function useTrackMatcherRuntimeRefs({
  runtimeA,
  runtimeB,
  fileUrlA,
  fileUrlB,
}: {
  runtimeA: TrackMatcherProPitchRuntimeState;
  runtimeB: TrackMatcherProPitchRuntimeState;
  fileUrlA: string | null;
  fileUrlB: string | null;
}) {
  const runtimeARef = useRef(runtimeA);
  const runtimeBRef = useRef(runtimeB);
  const fileUrlARef = useRef(fileUrlA);
  const fileUrlBRef = useRef(fileUrlB);

  useEffect(() => {
    runtimeARef.current = runtimeA;
  }, [runtimeA]);

  useEffect(() => {
    runtimeBRef.current = runtimeB;
  }, [runtimeB]);

  useEffect(() => {
    fileUrlARef.current = fileUrlA;
  }, [fileUrlA]);

  useEffect(() => {
    fileUrlBRef.current = fileUrlB;
  }, [fileUrlB]);

  return {
    runtimeARef,
    runtimeBRef,
    fileUrlARef,
    fileUrlBRef,
  };
}

export function useTrackMatcherDerivedState({
  activeDeckId,
  audioMode,
  runtimeA,
  runtimeB,
  trackA,
  trackB,
}: {
  activeDeckId: TrackMatcherDeckId;
  audioMode: TrackMatcherAudioEngineMode;
  runtimeA: TrackMatcherProPitchRuntimeState;
  runtimeB: TrackMatcherProPitchRuntimeState;
  trackA: TrackMatcherTrackState;
  trackB: TrackMatcherTrackState;
}) {
  const planA = useMemo(
    () =>
      runtimeA.plan ??
      refreshTrackMatcherProPitchPlan(runtimeA, getAudioTrackInput(trackA))
        .plan,
    [runtimeA, trackA],
  );

  const planB = useMemo(
    () =>
      runtimeB.plan ??
      refreshTrackMatcherProPitchPlan(runtimeB, getAudioTrackInput(trackB))
        .plan,
    [runtimeB, trackB],
  );

  const activeRuntime = activeDeckId === "A" ? runtimeA : runtimeB;
  const activePlan = activeDeckId === "A" ? planA : planB;
  const canUseProPitchA =
    runtimeA.status === "ready" && !planA?.shouldUseBrowserFallback;
  const canUseProPitchB =
    runtimeB.status === "ready" && !planB?.shouldUseBrowserFallback;
  const canUseProPitch =
    activeDeckId === "A" ? canUseProPitchA : canUseProPitchB;

  const deckSnapshotA = useMemo(
    () =>
      getControllerDeckSnapshot({
        deckId: "A",
        track: trackA,
        runtime: runtimeA,
        canUseProPitch: canUseProPitchA,
        audioMode,
        warning: planA?.warning ?? runtimeA.error,
      }),
    [audioMode, canUseProPitchA, planA?.warning, runtimeA, trackA],
  );

  const deckSnapshotB = useMemo(
    () =>
      getControllerDeckSnapshot({
        deckId: "B",
        track: trackB,
        runtime: runtimeB,
        canUseProPitch: canUseProPitchB,
        audioMode,
        warning: planB?.warning ?? runtimeB.error,
      }),
    [audioMode, canUseProPitchB, planB?.warning, runtimeB, trackB],
  );

  const activeDeckSnapshot =
    activeDeckId === "A" ? deckSnapshotA : deckSnapshotB;

  const engineHealth = useMemo(
    () =>
      getControllerEngineHealth({
        audioMode,
        deckA: deckSnapshotA,
        deckB: deckSnapshotB,
      }),
    [audioMode, deckSnapshotA, deckSnapshotB],
  );

  return {
    activeDeckSnapshot,
    activePlan,
    activeRuntime,
    canUseProPitch,
    canUseProPitchA,
    canUseProPitchB,
    deckSnapshotA,
    deckSnapshotB,
    engineHealth,
    planA,
    planB,
  };
}

export function useTrackMatcherRuntimeEffects({
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
}: {
  audioMode: TrackMatcherAudioEngineMode;
  autoSyncBToA: boolean;
  canUseProPitchA: boolean;
  canUseProPitchB: boolean;
  trackA: TrackMatcherTrackState;
  trackB: TrackMatcherTrackState;
  runtimeA: TrackMatcherProPitchRuntimeState;
  runtimeB: TrackMatcherProPitchRuntimeState;
  audioRefA: RefObject<HTMLAudioElement | null>;
  audioRefB: RefObject<HTMLAudioElement | null>;
  setAudioMode: Dispatch<SetStateAction<TrackMatcherAudioEngineMode>>;
  setRuntimeA: Dispatch<SetStateAction<TrackMatcherProPitchRuntimeState>>;
  setRuntimeB: Dispatch<SetStateAction<TrackMatcherProPitchRuntimeState>>;
}) {
  useEffect(() => {
    if (
      shouldForceBrowserFallback({
        audioMode,
        runtimeA,
        runtimeB,
      })
    ) {
      setAudioMode("browser-speed-pitch");
    }
  }, [audioMode, runtimeA, runtimeB, setAudioMode]);

  useEffect(() => {
    if (audioRefA.current) {
      audioRefA.current.playbackRate = getEffectivePlaybackRate(
        trackA,
        audioMode,
        canUseProPitchA,
      );
    }
  }, [audioMode, audioRefA, canUseProPitchA, trackA]);

  useEffect(() => {
    if (audioRefB.current && !autoSyncBToA) {
      audioRefB.current.playbackRate = getEffectivePlaybackRate(
        trackB,
        audioMode,
        canUseProPitchB,
      );
    }
  }, [audioMode, audioRefB, autoSyncBToA, canUseProPitchB, trackB]);

  useEffect(() => {
    setRuntimeA((currentRuntime) =>
      refreshTrackMatcherProPitchPlan(
        currentRuntime,
        getAudioTrackInput(trackA),
      ),
    );
  }, [setRuntimeA, trackA.bpm, trackA.keyIndex]);

  useEffect(() => {
    setRuntimeB((currentRuntime) =>
      refreshTrackMatcherProPitchPlan(
        currentRuntime,
        getAudioTrackInput(trackB),
      ),
    );
  }, [setRuntimeB, trackB.bpm, trackB.keyIndex]);
}
