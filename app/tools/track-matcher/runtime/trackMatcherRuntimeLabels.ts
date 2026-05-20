import type {
  TrackMatcherProPitchLayerState,
  TrackMatcherProPitchRuntimeStatus,
} from "./trackMatcherRuntimeState";

export function getTrackMatcherProPitchRuntimeLabel(
  status: TrackMatcherProPitchRuntimeStatus,
) {
  if (status === "ready") {
    return "DSP ready";
  }

  if (status === "playing") {
    return "DSP playing";
  }

  if (status === "paused") {
    return "DSP paused";
  }

  if (status === "stopped") {
    return "DSP stopped";
  }

  if (status === "loading") {
    return "Preparing DSP";
  }

  if (status === "unsupported") {
    return "DSP unsupported";
  }

  if (status === "failed") {
    return "DSP failed";
  }

  return "DSP idle";
}

export function getTrackMatcherProPitchRuntimeDetail(
  status: TrackMatcherProPitchRuntimeStatus,
) {
  if (status === "ready") {
    return "Decoded audio is ready for the Pro Pitch processing path.";
  }

  if (status === "playing") {
    return "The active deck is playing through the Web Audio DSP pitch foundation.";
  }

  if (status === "paused") {
    return "DSP playback is paused and can resume from the saved buffer position.";
  }

  if (status === "stopped") {
    return "DSP playback is stopped and will restart from the beginning.";
  }

  if (status === "loading") {
    return "The browser is decoding the uploaded audio for Web Audio playback.";
  }

  if (status === "unsupported") {
    return "This browser cannot create the Web Audio graph, so Browser Mode remains the fallback.";
  }

  if (status === "failed") {
    return "The file could not be decoded for DSP playback, so Browser Mode remains the fallback.";
  }

  return "Upload an audio file to prepare the Pro Pitch DSP path.";
}

export function getTrackMatcherProPitchLayerLabel(
  pitchLayer: TrackMatcherProPitchLayerState,
) {
  if (pitchLayer.mode === "audible-rate-pitch") {
    return `${pitchLayer.label} (${pitchLayer.pitchShiftSemitones} st)`;
  }

  return pitchLayer.label;
}

export function getTrackMatcherProPitchLayerDetail(
  pitchLayer: TrackMatcherProPitchLayerState,
) {
  const tempoLabel = `${pitchLayer.tempoRatio}x tempo`;
  const pitchLabel = `${pitchLayer.pitchRatio}x pitch`;
  const sourceRateLabel = `${pitchLayer.sourcePlaybackRate}x source`;

  return `${pitchLayer.detail} ${tempoLabel}, ${pitchLabel}, ${sourceRateLabel}.`;
}
