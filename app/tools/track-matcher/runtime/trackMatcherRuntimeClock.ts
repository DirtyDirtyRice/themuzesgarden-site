import type { TrackMatcherProPitchRuntimeState } from "./trackMatcherRuntimeState";

export function closeTrackMatcherAudioContext(
  audioContext: AudioContext | null,
) {
  if (!audioContext) {
    return;
  }

  if (audioContext.state === "closed") {
    return;
  }

  void audioContext.close();
}

export function getTrackMatcherProPitchCurrentBufferTime(
  runtimeState: TrackMatcherProPitchRuntimeState,
) {
  const { audioBuffer, audioContext, playback } = runtimeState;

  if (!audioBuffer || !audioContext || !playback.isPlaying) {
    return playback.pausedAtBufferTime;
  }

  if (playback.granularLayer.engine) {
    return playback.granularLayer.engine.getCurrentBufferTime();
  }

  const elapsedContextTime =
    audioContext.currentTime - playback.startedAtContextTime;
  const elapsedBufferTime = elapsedContextTime * playback.sourcePlaybackRate;
  const currentTime = playback.pausedAtBufferTime + elapsedBufferTime;

  if (!Number.isFinite(currentTime)) {
    return 0;
  }

  return Math.min(audioBuffer.duration, Math.max(0, currentTime));
}

export async function resumeTrackMatcherAudioContext(
  audioContext: AudioContext,
) {
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
}
