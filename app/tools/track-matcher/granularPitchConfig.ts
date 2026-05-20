// FULL FILE REPLACEMENT — GRANULAR CONFIG V2 (INTELLIGENT)

import type {
  TrackMatcherGranularPitchEngineConfig,
  TrackMatcherGranularPitchQuality,
  TrackMatcherGranularPitchTuning,
  TrackMatcherGranularPitchWindowShape,
} from "./granularPitchTypes";

/* ===============================
   CONSTANTS
================================ */

export const MIN_RATIO = 0.25;
export const MAX_RATIO = 4;

export const MIN_GRAIN_SIZE_MS = 20;
export const MAX_GRAIN_SIZE_MS = 240;

export const MIN_OVERLAP_RATIO = 0.1;
export const MAX_OVERLAP_RATIO = 0.92;

export const MIN_SMOOTHING_MS = 4;
export const MAX_SMOOTHING_MS = 80;

export const DEFAULT_GRAIN_SIZE_MS = 80;
export const DEFAULT_OVERLAP_RATIO = 0.5;
export const DEFAULT_SMOOTHING_MS = 24;
export const DEFAULT_LATENCY_MS = 90;

/* ===============================
   UTILS
================================ */

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/* ===============================
   SAFE VALUES
================================ */

export function getSafeTempoRatio(value: number) {
  return clampNumber(value, MIN_RATIO, MAX_RATIO);
}

export function getSafePitchRatio(value: number) {
  return clampNumber(value, MIN_RATIO, MAX_RATIO);
}

export function getSafeGrainSizeMs(value: number) {
  return clampNumber(value, MIN_GRAIN_SIZE_MS, MAX_GRAIN_SIZE_MS);
}

export function getSafeOverlapRatio(value: number) {
  return clampNumber(value, MIN_OVERLAP_RATIO, MAX_OVERLAP_RATIO);
}

export function getSafeSmoothingMs(value: number) {
  return clampNumber(value, MIN_SMOOTHING_MS, MAX_SMOOTHING_MS);
}

/* ===============================
   PITCH MATH
================================ */

export function getPitchShiftSemitones(pitchRatio: number) {
  if (!Number.isFinite(pitchRatio) || pitchRatio <= 0) return 0;
  return roundTo(12 * Math.log2(pitchRatio), 2);
}

/* ===============================
   QUALITY PROFILES
================================ */

function getQualityProfile(quality: TrackMatcherGranularPitchQuality) {
  switch (quality) {
    case "draft":
      return {
        grainScale: 0.7,
        overlapBoost: 0.8,
        smoothingScale: 0.6,
        latency: 70,
      };
    case "balanced":
      return {
        grainScale: 1,
        overlapBoost: 1,
        smoothingScale: 1,
        latency: 90,
      };
    case "smooth":
      return {
        grainScale: 1.2,
        overlapBoost: 1.2,
        smoothingScale: 1.3,
        latency: 110,
      };
    case "studio":
      return {
        grainScale: 1.35,
        overlapBoost: 1.35,
        smoothingScale: 1.5,
        latency: 140,
      };
  }
}

/* ===============================
   WINDOW / QUALITY SAFETY
================================ */

function getSafeWindowShape(
  value: TrackMatcherGranularPitchWindowShape | undefined,
): TrackMatcherGranularPitchWindowShape {
  if (
    value === "linear" ||
    value === "equal-power" ||
    value === "hann" ||
    value === "cosine"
  ) {
    return value;
  }
  return "equal-power";
}

function getSafeQuality(
  value: TrackMatcherGranularPitchQuality | undefined,
): TrackMatcherGranularPitchQuality {
  if (
    value === "draft" ||
    value === "balanced" ||
    value === "smooth" ||
    value === "studio"
  ) {
    return value;
  }
  return "smooth";
}

/* ===============================
   INTELLIGENT TUNING
================================ */

export function createTrackMatcherGranularPitchTuning({
  tempoRatio,
  pitchRatio,
  durationSeconds,
}: {
  tempoRatio: number;
  pitchRatio: number;
  durationSeconds: number;
}): TrackMatcherGranularPitchTuning {
  const safeTempoRatio = getSafeTempoRatio(tempoRatio);
  const safePitchRatio = getSafePitchRatio(pitchRatio);

  const semitones = getPitchShiftSemitones(safePitchRatio);
  const pitchAmount = Math.abs(semitones);
  const tempoAmount = Math.abs(safeTempoRatio - 1);

  const isShortFile =
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    durationSeconds < 20;

  const quality: TrackMatcherGranularPitchQuality =
    pitchAmount > 6 ? "studio" :
    pitchAmount > 3 ? "smooth" :
    "balanced";

  const profile = getQualityProfile(quality);

  /* ===============================
     DYNAMIC GRAIN SIZE
  ================================= */

  let grainSize = DEFAULT_GRAIN_SIZE_MS;

  grainSize += pitchAmount * 6;        // more pitch → bigger grains
  grainSize += tempoAmount * 80;       // tempo stretch → bigger grains

  if (safePitchRatio < 1) {
    grainSize *= 1.15; // low pitch needs bigger grains
  }

  if (isShortFile) {
    grainSize *= 0.8;
  }

  grainSize *= profile.grainScale;

  grainSize = getSafeGrainSizeMs(grainSize);

  /* ===============================
     OVERLAP
  ================================= */

  let overlap = DEFAULT_OVERLAP_RATIO;

  overlap += pitchAmount * 0.04;
  overlap += tempoAmount * 0.6;

  overlap *= profile.overlapBoost;

  overlap = getSafeOverlapRatio(overlap);

  /* ===============================
     SMOOTHING
  ================================= */

  let smoothing = DEFAULT_SMOOTHING_MS;

  smoothing += pitchAmount * 2.5;
  smoothing += tempoAmount * 25;

  smoothing *= profile.smoothingScale;

  smoothing = getSafeSmoothingMs(smoothing);

  /* ===============================
     LATENCY
  ================================= */

  let latency = profile.latency;

  latency += pitchAmount * 6;
  latency += tempoAmount * 60;

  if (isShortFile) {
    latency *= 0.75;
  }

  /* ===============================
     WINDOW SHAPE
  ================================= */

  const windowShape: TrackMatcherGranularPitchWindowShape =
    pitchAmount > 5 ? "hann" :
    pitchAmount > 2 ? "equal-power" :
    "cosine";

  /* ===============================
     OUTPUT
  ================================= */

  return {
    grainSizeMs: grainSize,
    overlapRatio: overlap,
    smoothingMs: smoothing,
    latencyMs: latency,
    quality,
    windowShape,
    pitchShiftSemitones: semitones,
    detail:
      "Adaptive granular tuning based on pitch, tempo, and file length.",
    warning: "",
  };
}

/* ===============================
   SAFE CONFIG
================================ */

export function createSafeConfig(
  config: TrackMatcherGranularPitchEngineConfig,
): TrackMatcherGranularPitchEngineConfig {
  const safeDurationSeconds = Math.max(0, config.durationSeconds);

  return {
    tempoRatio: getSafeTempoRatio(config.tempoRatio),
    pitchRatio: getSafePitchRatio(config.pitchRatio),
    grainSizeMs: getSafeGrainSizeMs(config.grainSizeMs),
    overlapRatio: getSafeOverlapRatio(config.overlapRatio),
    smoothingMs: getSafeSmoothingMs(config.smoothingMs),
    latencyMs: Math.max(
      0,
      Number.isFinite(config.latencyMs) ? config.latencyMs : DEFAULT_LATENCY_MS,
    ),
    startAtSeconds: Math.min(
      safeDurationSeconds,
      Math.max(
        0,
        Number.isFinite(config.startAtSeconds) ? config.startAtSeconds : 0,
      ),
    ),
    durationSeconds: safeDurationSeconds,
    quality: getSafeQuality(config.quality),
    windowShape: getSafeWindowShape(config.windowShape),
  };
}