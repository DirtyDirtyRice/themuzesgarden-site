"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { TrackMatcherAudioEngineMode } from "../trackMatcherAudioEngine";
import {
  BPM_SMOOTHING,
  HARD_DRIFT_SECONDS,
  HARD_PHASE_SECONDS,
  SOFT_DRIFT_SECONDS,
  SYNC_INTERVAL_MS,
} from "./trackMatcherControllerConstants";
import {
  clampBpm,
  getEffectivePlaybackRate,
  getLoopPhase,
  getPhaseLengthSeconds,
  getSafeCorrectionAmount,
  getSafeCorrectionRate,
  getShortestPhaseDrift,
  setSafeCurrentTime,
} from "./trackMatcherControllerMath";
import type {
  SyncSnapshot,
  TrackMatcherTrackState,
} from "./trackMatcherControllerTypes";

type AudioElementRef = {
  current: HTMLAudioElement | null;
};

type UseTrackMatcherSyncControllerArgs = {
  audioMode: TrackMatcherAudioEngineMode;
  autoSyncBToA: boolean;
  canUseProPitchB: boolean;
  trackA: TrackMatcherTrackState;
  trackB: TrackMatcherTrackState;
  audioRefA: AudioElementRef;
  audioRefB: AudioElementRef;
  setTrackB: Dispatch<SetStateAction<TrackMatcherTrackState>>;
  setSyncSnapshot: Dispatch<SetStateAction<SyncSnapshot>>;
};

export function useTrackMatcherSyncController({
  audioMode,
  autoSyncBToA,
  canUseProPitchB,
  trackA,
  trackB,
  audioRefA,
  audioRefB,
  setTrackB,
  setSyncSnapshot,
}: UseTrackMatcherSyncControllerArgs) {
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!autoSyncBToA) {
      if (audioRefB.current) {
        audioRefB.current.playbackRate = getEffectivePlaybackRate(
          trackB,
          audioMode,
          canUseProPitchB,
        );
      }

      setSyncSnapshot({
        status: "idle",
        driftSeconds: 0,
        phaseSeconds: 0,
        bpmDifference: trackA.bpm - trackB.bpm,
        rateCorrection: 0,
      });

      return;
    }

    const syncInterval = window.setInterval(() => {
      const a = audioRefA.current;
      const b = audioRefB.current;

      if (!a || !b) return;

      if (a.paused || b.paused) {
        setSyncSnapshot({
          status: "idle",
          driftSeconds: 0,
          phaseSeconds: 0,
          bpmDifference: trackA.bpm - trackB.bpm,
          rateCorrection: 0,
        });

        return;
      }

      setTrackB((currentTrackB) => {
        const difference = trackA.bpm - currentTrackB.bpm;

        if (Math.abs(difference) < 0.02) {
          return { ...currentTrackB, bpm: trackA.bpm };
        }

        return {
          ...currentTrackB,
          bpm: clampBpm(currentTrackB.bpm + difference * BPM_SMOOTHING),
        };
      });

      const baseRate = getEffectivePlaybackRate(
        trackB,
        audioMode,
        canUseProPitchB,
      );
      const timeA = a.currentTime;
      const timeB = b.currentTime;
      const absoluteDrift = timeA - timeB;
      const phaseLengthA = getPhaseLengthSeconds(trackA.bpm);
      const phaseLengthB = getPhaseLengthSeconds(trackB.bpm);
      const phaseA = getLoopPhase(timeA, phaseLengthA);
      const phaseB = getLoopPhase(timeB, phaseLengthB);
      const phaseDrift = getShortestPhaseDrift(phaseA, phaseB, phaseLengthA);
      const bpmDifference = trackA.bpm - trackB.bpm;

      if (Math.abs(absoluteDrift) > HARD_DRIFT_SECONDS) {
        setSafeCurrentTime(b, timeA);
        b.playbackRate = baseRate;

        setSyncSnapshot({
          status: "drifting",
          driftSeconds: absoluteDrift,
          phaseSeconds: phaseDrift,
          bpmDifference,
          rateCorrection: 0,
        });

        lastSyncRef.current = performance.now();
        return;
      }

      if (Math.abs(phaseDrift) > HARD_PHASE_SECONDS) {
        setSafeCurrentTime(b, timeB + phaseDrift * 0.5);
        b.playbackRate = baseRate;

        setSyncSnapshot({
          status: "adjusting",
          driftSeconds: absoluteDrift,
          phaseSeconds: phaseDrift,
          bpmDifference,
          rateCorrection: 0,
        });

        lastSyncRef.current = performance.now();
        return;
      }

      if (Math.abs(absoluteDrift) > SOFT_DRIFT_SECONDS) {
        const correctionAmount = getSafeCorrectionAmount(absoluteDrift);

        b.playbackRate = getSafeCorrectionRate(baseRate, absoluteDrift);

        setSyncSnapshot({
          status: "adjusting",
          driftSeconds: absoluteDrift,
          phaseSeconds: phaseDrift,
          bpmDifference,
          rateCorrection: correctionAmount,
        });

        lastSyncRef.current = performance.now();
        return;
      }

      if (Math.abs(phaseDrift) > SOFT_DRIFT_SECONDS) {
        const correctionAmount = getSafeCorrectionAmount(phaseDrift);

        b.playbackRate = getSafeCorrectionRate(baseRate, phaseDrift);

        setSyncSnapshot({
          status: "adjusting",
          driftSeconds: absoluteDrift,
          phaseSeconds: phaseDrift,
          bpmDifference,
          rateCorrection: correctionAmount,
        });

        lastSyncRef.current = performance.now();
        return;
      }

      b.playbackRate = baseRate;

      setSyncSnapshot({
        status: "locked",
        driftSeconds: absoluteDrift,
        phaseSeconds: phaseDrift,
        bpmDifference,
        rateCorrection: 0,
      });

      lastSyncRef.current = performance.now();
    }, SYNC_INTERVAL_MS);

    return () => window.clearInterval(syncInterval);
  }, [
    audioMode,
    autoSyncBToA,
    audioRefA,
    audioRefB,
    canUseProPitchB,
    setSyncSnapshot,
    setTrackB,
    trackA.bpm,
    trackB,
  ]);
}
