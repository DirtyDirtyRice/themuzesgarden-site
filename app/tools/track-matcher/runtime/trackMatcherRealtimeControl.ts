import {
  cleanupTrackMatcherProPitchPlayback,
} from "./trackMatcherPlaybackCleanup";

import {
  getTrackMatcherProPitchCurrentBufferTime,
} from "./trackMatcherRuntimeClock";

import {
  startTrackMatcherProPitchPlayback,
} from "../trackMatcherProPitchDspRuntime";

import type {
  TrackMatcherProPitchRuntimeState,
} from "./trackMatcherRuntimeState";

export async function updateTrackMatcherProPitchPlayback(
  runtimeState: TrackMatcherProPitchRuntimeState,
  nextPlaybackRate: number,
) {
  const { audioContext, audioBuffer, playback } = runtimeState;

  if (!audioContext || !audioBuffer || !playback.isPlaying) {
    return runtimeState;
  }

  // Get current playback position BEFORE change
  const currentTime = getTrackMatcherProPitchCurrentBufferTime(runtimeState);

  // If native playback → update live (no restart)
  if (!playback.granularLayer.engine && playback.sourceNode) {
    playback.sourceNode.playbackRate.value = nextPlaybackRate;

    return {
      ...runtimeState,
      playback: {
        ...playback,
        playbackRate: nextPlaybackRate,
        sourcePlaybackRate: nextPlaybackRate,
      },
    };
  }

  // If granular → restart (engine limitation)
  cleanupTrackMatcherProPitchPlayback(runtimeState.playback);

  const result = await startTrackMatcherProPitchPlayback(
    runtimeState,
    nextPlaybackRate,
    currentTime,
  );

  return result.ok ? result.runtime : runtimeState;
}