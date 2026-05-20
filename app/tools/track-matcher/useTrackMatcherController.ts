"use client";

import { useMemo, useState } from "react";

import {
  createTrackMatcherProPitchDspPlan,
  getTrackBrowserPlaybackRate,
  getTrackMatcherAudioEngineState,
  type TrackMatcherAudioEngineMode,
  type TrackMatcherAudioTrackInput,
} from "./trackMatcherAudioEngine";
import {
  createTrackMatcherAudioFileInfo,
  createTrackMatcherFileError,
  revokeTrackMatcherObjectUrl,
  type TrackMatcherAudioFileInfo,
} from "./trackMatcherFileUtils";
import {
  closeTrackMatcherAudioContext,
  createEmptyTrackMatcherProPitchRuntimeState,
  prepareTrackMatcherProPitchRuntime,
  refreshTrackMatcherProPitchPlan,
  type TrackMatcherProPitchRuntimeState,
  type TrackMatcherProPitchRuntimeStatus,
} from "./trackMatcherProPitchDspRuntime";

export type TrackMatcherDeckId = "A" | "B";

export type TrackMatcherTrackState = TrackMatcherAudioTrackInput & {
  id: TrackMatcherDeckId;
  name: string;
  fileName: string;
  fileUrl: string;
  isLoaded: boolean;
  fileInfo: TrackMatcherAudioFileInfo | null;
  fileError: string;
};

export type TrackMatcherDeckRuntimeMap = Record<
  TrackMatcherDeckId,
  TrackMatcherProPitchRuntimeState
>;

export type TrackMatcherControllerState = {
  trackA: TrackMatcherTrackState;
  trackB: TrackMatcherTrackState;
  runtimeA: TrackMatcherProPitchRuntimeState;
  runtimeB: TrackMatcherProPitchRuntimeState;
  activeDeckId: TrackMatcherDeckId;
  audioMode: TrackMatcherAudioEngineMode;
  activeTrack: TrackMatcherTrackState;
  inactiveTrack: TrackMatcherTrackState;
  activeRuntime: TrackMatcherProPitchRuntimeState;
  inactiveRuntime: TrackMatcherProPitchRuntimeState;
  activeEngineState: ReturnType<typeof getTrackMatcherAudioEngineState>;
  activeDspPlan: ReturnType<typeof createTrackMatcherProPitchDspPlan>;
  activeBrowserPlaybackRate: number;
  activeRuntimeStatus: TrackMatcherProPitchRuntimeStatus;
  isPreparingProPitch: boolean;
  canUseProPitch: boolean;
  setActiveDeckId: (deckId: TrackMatcherDeckId) => void;
  setAudioMode: (mode: TrackMatcherAudioEngineMode) => void;
  updateTrackBpm: (deckId: TrackMatcherDeckId, bpm: number) => void;
  updateTrackKeyShift: (deckId: TrackMatcherDeckId, semitones: number) => void;
  loadTrackFile: (deckId: TrackMatcherDeckId, file: File) => void;
  clearTrackFile: (deckId: TrackMatcherDeckId) => void;
  prepareProPitchForDeck: (deckId: TrackMatcherDeckId, file: File) => Promise<void>;
};

function createEmptyTrack(id: TrackMatcherDeckId): TrackMatcherTrackState {
  return {
    id,
    name: `Track ${id}`,
    fileName: "",
    fileUrl: "",
    isLoaded: false,
    fileInfo: null,
    fileError: "",
    bpm: 100,
    keyShiftSemitones: 0,
  };
}

function createEmptyRuntimeMap(): TrackMatcherDeckRuntimeMap {
  return {
    A: createEmptyTrackMatcherProPitchRuntimeState(),
    B: createEmptyTrackMatcherProPitchRuntimeState(),
  };
}

function getTrackSetter(
  deckId: TrackMatcherDeckId,
  setTrackA: React.Dispatch<React.SetStateAction<TrackMatcherTrackState>>,
  setTrackB: React.Dispatch<React.SetStateAction<TrackMatcherTrackState>>,
) {
  return deckId === "A" ? setTrackA : setTrackB;
}

function revokeTrackUrl(track: TrackMatcherTrackState) {
  if (track.fileInfo?.objectUrl) {
    revokeTrackMatcherObjectUrl(track.fileInfo.objectUrl);
    return;
  }

  if (!track.fileUrl) {
    return;
  }

  revokeTrackMatcherObjectUrl(track.fileUrl);
}

function closeRuntime(runtime: TrackMatcherProPitchRuntimeState) {
  closeTrackMatcherAudioContext(runtime.audioContext);
}

export function useTrackMatcherController(): TrackMatcherControllerState {
  const [trackA, setTrackA] = useState<TrackMatcherTrackState>(() =>
    createEmptyTrack("A"),
  );
  const [trackB, setTrackB] = useState<TrackMatcherTrackState>(() =>
    createEmptyTrack("B"),
  );
  const [runtimeMap, setRuntimeMap] = useState<TrackMatcherDeckRuntimeMap>(() =>
    createEmptyRuntimeMap(),
  );
  const [activeDeckId, setActiveDeckId] = useState<TrackMatcherDeckId>("A");
  const [audioMode, setAudioMode] =
    useState<TrackMatcherAudioEngineMode>("browser-speed-pitch");

  const runtimeA = runtimeMap.A;
  const runtimeB = runtimeMap.B;
  const activeTrack = activeDeckId === "A" ? trackA : trackB;
  const inactiveTrack = activeDeckId === "A" ? trackB : trackA;
  const activeRuntime = activeDeckId === "A" ? runtimeA : runtimeB;
  const inactiveRuntime = activeDeckId === "A" ? runtimeB : runtimeA;

  const activeEngineState = useMemo(
    () => getTrackMatcherAudioEngineState(activeTrack, audioMode),
    [activeTrack, audioMode],
  );

  const activeDspPlan = useMemo(() => {
    if (activeRuntime.plan) {
      return activeRuntime.plan;
    }

    return createTrackMatcherProPitchDspPlan(
      activeTrack,
      activeTrack.isLoaded,
      activeRuntime.audioBuffer,
    );
  }, [activeRuntime, activeTrack]);

  const activeBrowserPlaybackRate = useMemo(
    () => getTrackBrowserPlaybackRate(activeTrack),
    [activeTrack],
  );

  const activeRuntimeStatus = activeRuntime.status;
  const isPreparingProPitch = activeRuntimeStatus === "loading";
  const canUseProPitch = activeRuntimeStatus === "ready" && !activeDspPlan.shouldUseBrowserFallback;

  function updateRuntime(
    deckId: TrackMatcherDeckId,
    updater: (
      runtime: TrackMatcherProPitchRuntimeState,
    ) => TrackMatcherProPitchRuntimeState,
  ) {
    setRuntimeMap((current) => ({
      ...current,
      [deckId]: updater(current[deckId]),
    }));
  }

  function replaceRuntime(
    deckId: TrackMatcherDeckId,
    nextRuntime: TrackMatcherProPitchRuntimeState,
  ) {
    setRuntimeMap((current) => {
      closeRuntime(current[deckId]);

      return {
        ...current,
        [deckId]: nextRuntime,
      };
    });
  }

  function resetRuntime(deckId: TrackMatcherDeckId) {
    replaceRuntime(deckId, createEmptyTrackMatcherProPitchRuntimeState());
  }

  function updateTrack(
    deckId: TrackMatcherDeckId,
    updater: (track: TrackMatcherTrackState) => TrackMatcherTrackState,
  ) {
    const setter = getTrackSetter(deckId, setTrackA, setTrackB);
    setter((current) => updater(current));
  }

  function updateTrackBpm(deckId: TrackMatcherDeckId, bpm: number) {
    updateTrack(deckId, (track) => {
      const nextTrack = {
        ...track,
        bpm,
      };

      updateRuntime(deckId, (runtime) =>
        refreshTrackMatcherProPitchPlan(runtime, nextTrack),
      );

      return nextTrack;
    });
  }

  function updateTrackKeyShift(deckId: TrackMatcherDeckId, semitones: number) {
    updateTrack(deckId, (track) => {
      const nextTrack = {
        ...track,
        keyShiftSemitones: semitones,
      };

      updateRuntime(deckId, (runtime) =>
        refreshTrackMatcherProPitchPlan(runtime, nextTrack),
      );

      return nextTrack;
    });
  }

  async function prepareProPitchForDeck(deckId: TrackMatcherDeckId, file: File) {
    const track = deckId === "A" ? trackA : trackB;

    updateRuntime(deckId, (runtime) => {
      closeRuntime(runtime);

      return {
        ...createEmptyTrackMatcherProPitchRuntimeState(),
        status: "loading",
      };
    });

    const preparedRuntime = await prepareTrackMatcherProPitchRuntime(track, file);
    replaceRuntime(deckId, preparedRuntime);
  }

  function loadTrackFile(deckId: TrackMatcherDeckId, file: File) {
    const fileError = createTrackMatcherFileError(file);

    updateTrack(deckId, (track) => {
      revokeTrackUrl(track);
      resetRuntime(deckId);

      if (fileError) {
        return {
          ...createEmptyTrack(deckId),
          fileError,
        };
      }

      const fileInfo = createTrackMatcherAudioFileInfo(file);

      return {
        ...track,
        name: fileInfo.displayName || `Track ${deckId}`,
        fileName: fileInfo.fileName,
        fileUrl: fileInfo.objectUrl,
        isLoaded: true,
        fileInfo,
        fileError: "",
      };
    });

    setActiveDeckId(deckId);

    if (!fileError) {
      void prepareProPitchForDeck(deckId, file);
    }
  }

  function clearTrackFile(deckId: TrackMatcherDeckId) {
    updateTrack(deckId, (track) => {
      revokeTrackUrl(track);
      resetRuntime(deckId);
      return createEmptyTrack(deckId);
    });
  }

  return {
    trackA,
    trackB,
    runtimeA,
    runtimeB,
    activeDeckId,
    audioMode,
    activeTrack,
    inactiveTrack,
    activeRuntime,
    inactiveRuntime,
    activeEngineState,
    activeDspPlan,
    activeBrowserPlaybackRate,
    activeRuntimeStatus,
    isPreparingProPitch,
    canUseProPitch,
    setActiveDeckId,
    setAudioMode,
    updateTrackBpm,
    updateTrackKeyShift,
    loadTrackFile,
    clearTrackFile,
    prepareProPitchForDeck,
  };
}