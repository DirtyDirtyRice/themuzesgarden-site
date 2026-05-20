import {
  createAudioContextSafe,
  createTrackMatcherProPitchDspPlan,
  type TrackMatcherAudioTrackInput,
} from "../trackMatcherAudioEngine";
import {
  createEmptyPlaybackState,
  type TrackMatcherDecodedAudioResult,
  type TrackMatcherProPitchRuntimeState,
} from "./trackMatcherRuntimeState";

function closePreparedTrackMatcherAudioContext(
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

export async function decodeTrackMatcherAudioBuffer(
  audioContext: AudioContext,
  arrayBuffer: ArrayBuffer,
): Promise<TrackMatcherDecodedAudioResult> {
  try {
    const copiedBuffer = arrayBuffer.slice(0);
    const audioBuffer = await audioContext.decodeAudioData(copiedBuffer);

    return {
      ok: true,
      audioBuffer,
      error: "",
    };
  } catch {
    return {
      ok: false,
      audioBuffer: null,
      error: "The browser could not decode this audio file for DSP playback.",
    };
  }
}

export async function prepareTrackMatcherProPitchRuntime(
  track: TrackMatcherAudioTrackInput,
  file: File,
): Promise<TrackMatcherProPitchRuntimeState> {
  const audioContext = createAudioContextSafe();

  if (!audioContext) {
    return {
      status: "unsupported",
      audioContext: null,
      audioBuffer: null,
      plan: createTrackMatcherProPitchDspPlan(track, false, null),
      playback: createEmptyPlaybackState(),
      error: "Web Audio is not available in this browser.",
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await decodeTrackMatcherAudioBuffer(
      audioContext,
      arrayBuffer,
    );

    if (!decoded.ok || !decoded.audioBuffer) {
      closePreparedTrackMatcherAudioContext(audioContext);

      return {
        status: "failed",
        audioContext: null,
        audioBuffer: null,
        plan: createTrackMatcherProPitchDspPlan(track, false, null),
        playback: createEmptyPlaybackState(),
        error: decoded.error,
      };
    }

    return {
      status: "ready",
      audioContext,
      audioBuffer: decoded.audioBuffer,
      plan: createTrackMatcherProPitchDspPlan(track, true, decoded.audioBuffer),
      playback: createEmptyPlaybackState(),
      error: "",
    };
  } catch {
    closePreparedTrackMatcherAudioContext(audioContext);

    return {
      status: "failed",
      audioContext: null,
      audioBuffer: null,
      plan: createTrackMatcherProPitchDspPlan(track, false, null),
      playback: createEmptyPlaybackState(),
      error: "The file could not be prepared for Pro Pitch DSP.",
    };
  }
}
