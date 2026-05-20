import {
  clampNumber,
  getPitchShiftSemitonesFromRatio,
  getSafePitchRatio,
  getSafeTempoRatio,
  MAX_PRO_PITCH_PLAYBACK_RATE,
  MIN_PRO_PITCH_PLAYBACK_RATE,
  PITCH_RATIO_EPSILON,
  roundTo,
  TEMPO_RATIO_EPSILON,
} from "./trackMatcherRuntimeUtils";
import type {
  TrackMatcherProPitchLayerState,
  TrackMatcherProPitchRuntimeState,
} from "./trackMatcherRuntimeState";

export function getSafeRuntimeTempoRatio(
  runtimeState: TrackMatcherProPitchRuntimeState,
  requestedPlaybackRate: number,
) {
  return getSafeTempoRatio(runtimeState.plan?.tempoRatio, requestedPlaybackRate);
}

export function getSafeRuntimePitchRatio(
  runtimeState: TrackMatcherProPitchRuntimeState,
) {
  return getSafePitchRatio(runtimeState.plan?.pitchRatio);
}

export function createTrackMatcherProPitchLayerState({
  requestedPlaybackRate,
  tempoRatio,
  pitchRatio,
  sourcePlaybackRate,
  dspReady,
}: {
  requestedPlaybackRate: number;
  tempoRatio: number;
  pitchRatio: number;
  sourcePlaybackRate: number;
  dspReady: boolean;
}): TrackMatcherProPitchLayerState {
  const safeTempoRatio = clampNumber(
    tempoRatio,
    MIN_PRO_PITCH_PLAYBACK_RATE,
    MAX_PRO_PITCH_PLAYBACK_RATE,
  );
  const safePitchRatio = clampNumber(
    pitchRatio,
    MIN_PRO_PITCH_PLAYBACK_RATE,
    MAX_PRO_PITCH_PLAYBACK_RATE,
  );
  const safeSourcePlaybackRate = clampNumber(
    sourcePlaybackRate,
    MIN_PRO_PITCH_PLAYBACK_RATE,
    MAX_PRO_PITCH_PLAYBACK_RATE,
  );

  const isPitchShifted = Math.abs(safePitchRatio - 1) > PITCH_RATIO_EPSILON;
  const isTempoShifted = Math.abs(safeTempoRatio - 1) > TEMPO_RATIO_EPSILON;
  const pitchShiftSemitones = getPitchShiftSemitonesFromRatio(safePitchRatio);

  if (!dspReady) {
    return {
      mode: "none",
      tempoRatio: roundTo(safeTempoRatio, 5),
      pitchRatio: roundTo(safePitchRatio, 5),
      requestedPlaybackRate: roundTo(requestedPlaybackRate, 5),
      sourcePlaybackRate: roundTo(safeSourcePlaybackRate, 5),
      pitchShiftSemitones,
      isPitchShifted,
      isTempoShifted,
      label: "Pitch layer unavailable",
      detail: "No decoded Web Audio source is ready for Pro Pitch processing.",
      warning:
        "Browser Mode remains the fallback until the DSP runtime is ready.",
    };
  }

  if (!isPitchShifted && !isTempoShifted) {
    return {
      mode: "tempo-only",
      tempoRatio: roundTo(safeTempoRatio, 5),
      pitchRatio: roundTo(safePitchRatio, 5),
      requestedPlaybackRate: roundTo(requestedPlaybackRate, 5),
      sourcePlaybackRate: roundTo(safeSourcePlaybackRate, 5),
      pitchShiftSemitones,
      isPitchShifted,
      isTempoShifted,
      label: "Neutral DSP playback",
      detail: "Tempo and pitch are both at the source value.",
      warning: "",
    };
  }

  if (!isPitchShifted) {
    return {
      mode: "tempo-only",
      tempoRatio: roundTo(safeTempoRatio, 5),
      pitchRatio: roundTo(safePitchRatio, 5),
      requestedPlaybackRate: roundTo(requestedPlaybackRate, 5),
      sourcePlaybackRate: roundTo(safeSourcePlaybackRate, 5),
      pitchShiftSemitones,
      isPitchShifted,
      isTempoShifted,
      label: "Tempo DSP playback",
      detail:
        "Tempo is routed through the Web Audio source rate while pitch remains neutral.",
      warning: "",
    };
  }

  return {
    mode: "future-granular-pitch",
    tempoRatio: roundTo(safeTempoRatio, 5),
    pitchRatio: roundTo(safePitchRatio, 5),
    requestedPlaybackRate: roundTo(requestedPlaybackRate, 5),
    sourcePlaybackRate: roundTo(safeSourcePlaybackRate, 5),
    pitchShiftSemitones,
    isPitchShifted,
    isTempoShifted,
    label: "Granular pitch layer",
    detail:
      "Pitch is routed through the granular DSP engine when available, with the source-rate pitch fallback preserved for safety.",
    warning:
      "Granular pitch is a foundation engine. Full studio-quality time-stretch refinement still comes later.",
  };
}
