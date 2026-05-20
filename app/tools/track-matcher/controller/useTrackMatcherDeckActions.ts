"use client";

import type { RefObject } from "react";

import type { TrackMatcherAudioEngineMode } from "../trackMatcherAudioEngine";
import {
  DEFAULT_SYNC_SNAPSHOT,
} from "./trackMatcherControllerConstants";
import {
  clampBpm,
  getEffectivePlaybackRate,
  revokeFileUrl,
  setSafeCurrentTime,
} from "./trackMatcherControllerMath";
import type {
  SyncSnapshot,
  TrackMatcherDeckId,
  TrackMatcherTrackState,
  TrackMode,
} from "./trackMatcherControllerTypes";

export function useTrackMatcherDeckActions({
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
}: {
  trackA: TrackMatcherTrackState;
  trackB: TrackMatcherTrackState;
  setTrackA: React.Dispatch<React.SetStateAction<TrackMatcherTrackState>>;
  setTrackB: React.Dispatch<React.SetStateAction<TrackMatcherTrackState>>;
  setActiveDeckId: React.Dispatch<React.SetStateAction<TrackMatcherDeckId>>;
  audioRefA: RefObject<HTMLAudioElement | null>;
  audioRefB: RefObject<HTMLAudioElement | null>;
  audioMode: TrackMatcherAudioEngineMode;
  canUseProPitchA: boolean;
  canUseProPitchB: boolean;
  setSyncSnapshot: React.Dispatch<React.SetStateAction<SyncSnapshot>>;
  nudgeAmount: number;
  prepareProPitchForTrack: (
    deckId: TrackMatcherDeckId,
    file: File,
    track: TrackMatcherTrackState,
  ) => Promise<void>;
}) {
  const setTrackAFile = (file: File) => {
    const nextUrl = window.URL.createObjectURL(file);
    const nextTrack = {
      ...trackA,
      trackName: file.name,
      fileUrl: nextUrl,
    };

    setTrackA((current) => {
      revokeFileUrl(current.fileUrl);
      return nextTrack;
    });

    setActiveDeckId("A");
    void prepareProPitchForTrack("A", file, nextTrack);
  };

  const setTrackBFile = (file: File) => {
    const nextUrl = window.URL.createObjectURL(file);
    const nextTrack = {
      ...trackB,
      trackName: file.name,
      fileUrl: nextUrl,
    };

    setTrackB((current) => {
      revokeFileUrl(current.fileUrl);
      return nextTrack;
    });

    setActiveDeckId("B");
    void prepareProPitchForTrack("B", file, nextTrack);
  };

  const setTrackABpm = (bpm: number) => {
    setTrackA((t) => ({ ...t, bpm: clampBpm(bpm) }));
  };

  const setTrackBBpm = (bpm: number) => {
    setTrackB((t) => ({ ...t, bpm: clampBpm(bpm) }));
  };

  const setTrackAKeyIndex = (keyIndex: number) => {
    setTrackA((t) => ({ ...t, keyIndex }));
  };

  const setTrackBKeyIndex = (keyIndex: number) => {
    setTrackB((t) => ({ ...t, keyIndex }));
  };

  const setTrackAMode = (mode: TrackMode) => {
    setTrackA((t) => ({ ...t, mode }));
  };

  const setTrackBMode = (mode: TrackMode) => {
    setTrackB((t) => ({ ...t, mode }));
  };

  const playBoth = () => {
    if (!audioRefA.current || !audioRefB.current) return;

    audioRefA.current.currentTime = 0;
    audioRefB.current.currentTime = 0;
    audioRefA.current.playbackRate = getEffectivePlaybackRate(
      trackA,
      audioMode,
      canUseProPitchA,
    );
    audioRefB.current.playbackRate = getEffectivePlaybackRate(
      trackB,
      audioMode,
      canUseProPitchB,
    );

    void audioRefA.current.play();
    void audioRefB.current.play();
  };

  const pauseBoth = () => {
    audioRefA.current?.pause();
    audioRefB.current?.pause();

    if (audioRefB.current) {
      audioRefB.current.playbackRate = getEffectivePlaybackRate(
        trackB,
        audioMode,
        canUseProPitchB,
      );
    }

    setSyncSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      status: "idle",
      rateCorrection: 0,
    }));
  };

  const stopBoth = () => {
    if (audioRefA.current) {
      audioRefA.current.pause();
      audioRefA.current.currentTime = 0;
      audioRefA.current.playbackRate = getEffectivePlaybackRate(
        trackA,
        audioMode,
        canUseProPitchA,
      );
    }

    if (audioRefB.current) {
      audioRefB.current.pause();
      audioRefB.current.currentTime = 0;
      audioRefB.current.playbackRate = getEffectivePlaybackRate(
        trackB,
        audioMode,
        canUseProPitchB,
      );
    }

    setSyncSnapshot({
      ...DEFAULT_SYNC_SNAPSHOT,
      bpmDifference: trackA.bpm - trackB.bpm,
    });
  };

  const nudgeBBackward = () => {
    if (!audioRefB.current) return;

    setSafeCurrentTime(
      audioRefB.current,
      audioRefB.current.currentTime - nudgeAmount,
    );
  };

  const nudgeBForward = () => {
    if (!audioRefB.current) return;

    setSafeCurrentTime(
      audioRefB.current,
      audioRefB.current.currentTime + nudgeAmount,
    );
  };

  const resetBToStart = () => {
    if (!audioRefB.current) return;

    audioRefB.current.currentTime = 0;
    audioRefB.current.playbackRate = getEffectivePlaybackRate(
      trackB,
      audioMode,
      canUseProPitchB,
    );
  };

  const matchBToA = () => {
    setTrackB((t) => ({
      ...t,
      bpm: trackA.bpm,
      keyIndex: trackA.keyIndex,
      mode: trackA.mode,
    }));

    if (audioRefB.current) {
      audioRefB.current.playbackRate = getEffectivePlaybackRate(
        {
          ...trackB,
          bpm: trackA.bpm,
          keyIndex: trackA.keyIndex,
          mode: trackA.mode,
        },
        audioMode,
        canUseProPitchB,
      );
    }
  };

  const matchAToB = () => {
    setTrackA((t) => ({
      ...t,
      bpm: trackB.bpm,
      keyIndex: trackB.keyIndex,
      mode: trackB.mode,
    }));

    if (audioRefA.current) {
      audioRefA.current.playbackRate = getEffectivePlaybackRate(
        {
          ...trackA,
          bpm: trackB.bpm,
          keyIndex: trackB.keyIndex,
          mode: trackB.mode,
        },
        audioMode,
        canUseProPitchA,
      );
    }
  };

  return {
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
    matchBToA,
    matchAToB,
  };
}
