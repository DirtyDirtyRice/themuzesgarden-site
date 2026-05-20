export const MIN_PRO_PITCH_PLAYBACK_RATE = 0.25;
export const MAX_PRO_PITCH_PLAYBACK_RATE = 4;
export const PITCH_RATIO_EPSILON = 0.001;
export const TEMPO_RATIO_EPSILON = 0.001;

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, places: number) {
  const factor = 10 ** places;

  return Math.round(value * factor) / factor;
}

export function getPitchShiftSemitonesFromRatio(pitchRatio: number) {
  if (!Number.isFinite(pitchRatio) || pitchRatio <= 0) {
    return 0;
  }

  return roundTo(12 * Math.log2(pitchRatio), 2);
}

export function getSafeTempoRatio(
  planTempoRatio: number | undefined,
  requestedPlaybackRate: number,
) {
  if (Number.isFinite(planTempoRatio) && planTempoRatio && planTempoRatio > 0) {
    return clampNumber(
      planTempoRatio,
      MIN_PRO_PITCH_PLAYBACK_RATE,
      MAX_PRO_PITCH_PLAYBACK_RATE,
    );
  }

  return clampNumber(
    requestedPlaybackRate,
    MIN_PRO_PITCH_PLAYBACK_RATE,
    MAX_PRO_PITCH_PLAYBACK_RATE,
  );
}

export function getSafePitchRatio(planPitchRatio: number | undefined) {
  if (Number.isFinite(planPitchRatio) && planPitchRatio && planPitchRatio > 0) {
    return clampNumber(
      planPitchRatio,
      MIN_PRO_PITCH_PLAYBACK_RATE,
      MAX_PRO_PITCH_PLAYBACK_RATE,
    );
  }

  return 1;
}
