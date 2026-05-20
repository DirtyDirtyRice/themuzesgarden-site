import {
  createTrackMatcherProPitchDspPlan,
  type TrackMatcherAudioTrackInput,
} from "./trackMatcherAudioEngine";

import {
  shouldUseTrackMatcherGranularPitchEngine,
} from "./trackMatcherGranularPitchEngine";

import {
  createEmptyGranularLayerState,
  createEmptyPlaybackState,
  createEmptyTrackMatcherProPitchRuntimeState,
  type TrackMatcherProPitchPlaybackResult,
  type TrackMatcherProPitchRuntimeState,
  type TrackMatcherProPitchRuntimeStatus,
} from "./runtime/trackMatcherRuntimeState";

import {
  prepareTrackMatcherProPitchRuntime,
  decodeTrackMatcherAudioBuffer,
} from "./runtime/trackMatcherAudioBufferLoader";

import {
  createTrackMatcherProPitchDspNodeLayer,
} from "./runtime/trackMatcherDspNodeLayer";

import {
  startGranularPlayback,
} from "./runtime/trackMatcherGranularPlayback";

import {
  startNativePlayback,
} from "./runtime/trackMatcherNativePlayback";

import {
  createTrackMatcherProPitchLayerState,
  getSafeRuntimePitchRatio,
  getSafeRuntimeTempoRatio,
} from "./runtime/trackMatcherPitchLayer";

import {
  cleanupTrackMatcherProPitchPlayback,
} from "./runtime/trackMatcherPlaybackCleanup";

import {
  clampNumber,
  MAX_PRO_PITCH_PLAYBACK_RATE,
  MIN_PRO_PITCH_PLAYBACK_RATE,
} from "./runtime/trackMatcherRuntimeUtils";

import {
  closeTrackMatcherAudioContext,
  getTrackMatcherProPitchCurrentBufferTime,
  resumeTrackMatcherAudioContext,
} from "./runtime/trackMatcherRuntimeClock";

import {
  getTrackMatcherProPitchLayerDetail,
  getTrackMatcherProPitchLayerLabel,
  getTrackMatcherProPitchRuntimeDetail,
  getTrackMatcherProPitchRuntimeLabel,
} from "./runtime/trackMatcherRuntimeLabels";

import {
  updateTrackMatcherProPitchPlayback,
} from "./runtime/trackMatcherRealtimeControl";

export {
  createEmptyTrackMatcherProPitchRuntimeState,
  decodeTrackMatcherAudioBuffer,
  prepareTrackMatcherProPitchRuntime,
  closeTrackMatcherAudioContext,
  getTrackMatcherProPitchCurrentBufferTime,
  resumeTrackMatcherAudioContext,
  getTrackMatcherProPitchLayerDetail,
  getTrackMatcherProPitchLayerLabel,
  getTrackMatcherProPitchRuntimeDetail,
  getTrackMatcherProPitchRuntimeLabel,
  updateTrackMatcherProPitchPlayback,
};

export type {
  TrackMatcherDecodedAudioResult,
  TrackMatcherProPitchDspNodeLayerMode,
  TrackMatcherProPitchDspNodeLayerState,
  TrackMatcherProPitchGranularLayerState,
  TrackMatcherProPitchLayerMode,
  TrackMatcherProPitchLayerState,
  TrackMatcherProPitchPlaybackResult,
  TrackMatcherProPitchPlaybackState,
  TrackMatcherProPitchRuntimeState,
  TrackMatcherProPitchRuntimeStatus,
} from "./runtime/trackMatcherRuntimeState";

export function refreshTrackMatcherProPitchPlan(
  runtimeState: TrackMatcherProPitchRuntimeState,
  track: TrackMatcherAudioTrackInput,
): TrackMatcherProPitchRuntimeState {
  return {
    ...runtimeState,
    plan: createTrackMatcherProPitchDspPlan(
      track,
      runtimeState.status !== "idle" &&
        runtimeState.status !== "unsupported" &&
        runtimeState.status !== "failed",
      runtimeState.audioBuffer,
    ),
  };
}

export async function startTrackMatcherProPitchPlayback(
  runtimeState: TrackMatcherProPitchRuntimeState,
  playbackRate = 1,
  startAtSeconds?: number,
): Promise<TrackMatcherProPitchPlaybackResult> {
  const { audioBuffer, audioContext } = runtimeState;

  if (!audioContext || !audioBuffer) {
    return {
      ok: false,
      runtime: runtimeState,
      error: "No decoded audio buffer available.",
    };
  }

  try {
    await resumeTrackMatcherAudioContext(audioContext);

    cleanupTrackMatcherProPitchPlayback(runtimeState.playback);

    const gainNode = audioContext.createGain();
    const dspNodeLayer = createTrackMatcherProPitchDspNodeLayer(
      audioContext,
      runtimeState.plan,
    );

    const safeTempoRatio = getSafeRuntimeTempoRatio(runtimeState, playbackRate);
    const safePitchRatio = getSafeRuntimePitchRatio(runtimeState);

    const shouldUseGranular = shouldUseTrackMatcherGranularPitchEngine({
      pitchRatio: safePitchRatio,
      audioBuffer,
    });

    const safeSourcePlaybackRate = shouldUseGranular
      ? safeTempoRatio
      : clampNumber(
          safeTempoRatio * safePitchRatio,
          MIN_PRO_PITCH_PLAYBACK_RATE,
          MAX_PRO_PITCH_PLAYBACK_RATE,
        );

    const pitchLayer = createTrackMatcherProPitchLayerState({
      requestedPlaybackRate: playbackRate,
      tempoRatio: safeTempoRatio,
      pitchRatio: safePitchRatio,
      sourcePlaybackRate: safeSourcePlaybackRate,
      dspReady: true,
    });

    const safeStartAt = Math.min(
      audioBuffer.duration,
      Math.max(0, startAtSeconds ?? runtimeState.playback.pausedAtBufferTime),
    );

    gainNode.connect(audioContext.destination);

    let sourceNode: AudioBufferSourceNode | null = null;
    let granularLayer = createEmptyGranularLayerState();
    let activeDspNodeLayer = dspNodeLayer;

    if (shouldUseGranular && dspNodeLayer.outputNode) {
      const granularPlayback = startGranularPlayback({
        audioContext,
        audioBuffer,
        outputNode: dspNodeLayer.outputNode,
        dspNodeLayer,
        plan: runtimeState.plan,
        safeTempoRatio,
        safePitchRatio,
        safeStartAt,
      });

      granularLayer = granularPlayback.granularLayer;
      activeDspNodeLayer = granularPlayback.dspNodeLayer;

      dspNodeLayer.outputNode.connect(gainNode);
    } else {
      sourceNode = startNativePlayback({
        audioContext,
        audioBuffer,
        gainNode,
        dspNodeLayer,
        safeSourcePlaybackRate,
        safeStartAt,
      });
    }

    const nextRuntime: TrackMatcherProPitchRuntimeState = {
      ...runtimeState,
      status: "playing",
      playback: {
        sourceNode,
        gainNode,
        dspNodeLayer: activeDspNodeLayer,
        granularLayer,
        startedAtContextTime: audioContext.currentTime,
        pausedAtBufferTime: safeStartAt,
        playbackRate: safeSourcePlaybackRate,
        tempoRatio: safeTempoRatio,
        pitchRatio: safePitchRatio,
        sourcePlaybackRate: safeSourcePlaybackRate,
        pitchLayer,
        isPlaying: true,
      },
      error: "",
    };

    if (sourceNode) {
      sourceNode.onended = () => {
        cleanupTrackMatcherProPitchPlayback(nextRuntime.playback);
      };
    }

    return {
      ok: true,
      runtime: nextRuntime,
      error: "",
    };
  } catch {
    cleanupTrackMatcherProPitchPlayback(runtimeState.playback);

    return {
      ok: false,
      runtime: {
        ...runtimeState,
        status: "failed",
        playback: createEmptyPlaybackState(),
        error: "Playback failed.",
      },
      error: "Playback failed.",
    };
  }
}

export function pauseTrackMatcherProPitchPlayback(
  runtimeState: TrackMatcherProPitchRuntimeState,
): TrackMatcherProPitchRuntimeState {
  const pausedAtBufferTime =
    getTrackMatcherProPitchCurrentBufferTime(runtimeState);

  cleanupTrackMatcherProPitchPlayback(runtimeState.playback);

  return {
    ...runtimeState,
    status: runtimeState.audioBuffer ? "paused" : runtimeState.status,
    playback: {
      ...createEmptyPlaybackState(),
      pausedAtBufferTime,
    },
  };
}

export function stopTrackMatcherProPitchPlayback(
  runtimeState: TrackMatcherProPitchRuntimeState,
): TrackMatcherProPitchRuntimeState {
  cleanupTrackMatcherProPitchPlayback(runtimeState.playback);

  return {
    ...runtimeState,
    status: runtimeState.audioBuffer ? "stopped" : runtimeState.status,
    playback: createEmptyPlaybackState(),
  };
}
