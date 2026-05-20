export type TrackMatcherAudioEngineMode =
  | "browser-speed-pitch"
  | "pro-pitch-dsp";

export type TrackMatcherAudioTrackInput = {
  bpm: number;
  keyShiftSemitones: number;
};

export type TrackMatcherAudioEngineState = {
  mode: TrackMatcherAudioEngineMode;
  bpm: number;
  keyShiftSemitones: number;
  playbackRate: number;
  pitchRatio: number;
  tempoRatio: number;
  isBrowserMode: boolean;
  isProPitchMode: boolean;
  label: string;
  detail: string;
  warning: string;
};

export type TrackMatcherProPitchDspPlan = {
  enabled: boolean;
  sourceReady: boolean;
  shouldUseBrowserFallback: boolean;
  tempoRatio: number;
  pitchRatio: number;
  playbackRate: number;
  grainSizeMs: number;
  overlapRatio: number;
  smoothingMs: number;
  latencyMs: number;
  dspReady: boolean;
  label: string;
  detail: string;
  warning: string;
};

export const TRACK_MATCHER_BASE_BPM = 100;
export const TRACK_MATCHER_MIN_BPM = 50;
export const TRACK_MATCHER_MAX_BPM = 200;
export const TRACK_MATCHER_MIN_KEY_SHIFT = -12;
export const TRACK_MATCHER_MAX_KEY_SHIFT = 12;

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/* ---------------------------------- */
/* NORMALIZATION */
/* ---------------------------------- */

export function normalizeTrackMatcherBpm(bpm: number) {
  return clampNumber(bpm, TRACK_MATCHER_MIN_BPM, TRACK_MATCHER_MAX_BPM);
}

export function normalizeTrackMatcherKeyShift(semitones: number) {
  return clampNumber(
    semitones,
    TRACK_MATCHER_MIN_KEY_SHIFT,
    TRACK_MATCHER_MAX_KEY_SHIFT,
  );
}

/* ---------------------------------- */
/* AUDIO MATH */
/* ---------------------------------- */

export function getSemitonePlaybackMultiplier(semitones: number) {
  return Math.pow(2, semitones / 12);
}

export function getTempoPlaybackMultiplier(bpm: number) {
  return normalizeTrackMatcherBpm(bpm) / TRACK_MATCHER_BASE_BPM;
}

export function getCombinedBrowserPlaybackRate(
  bpm: number,
  keyShiftSemitones: number,
) {
  return (
    getTempoPlaybackMultiplier(bpm) *
    getSemitonePlaybackMultiplier(normalizeTrackMatcherKeyShift(keyShiftSemitones))
  );
}

/* ---------------------------------- */
/* TRACK HELPERS */
/* ---------------------------------- */

export function getTrackKeyShiftSemitones(track: TrackMatcherAudioTrackInput) {
  return normalizeTrackMatcherKeyShift(track.keyShiftSemitones);
}

export function getTrackTempoRatio(track: TrackMatcherAudioTrackInput) {
  return getTempoPlaybackMultiplier(track.bpm);
}

export function getTrackPitchRatio(track: TrackMatcherAudioTrackInput) {
  return getSemitonePlaybackMultiplier(getTrackKeyShiftSemitones(track));
}

export function getTrackBrowserPlaybackRate(track: TrackMatcherAudioTrackInput) {
  return getCombinedBrowserPlaybackRate(track.bpm, track.keyShiftSemitones);
}

/* ---------------------------------- */
/* DSP READINESS */
/* ---------------------------------- */

export function isWebAudioSupported() {
  return typeof window !== "undefined" && !!window.AudioContext;
}

export function createAudioContextSafe(): AudioContext | null {
  if (!isWebAudioSupported()) return null;

  try {
    return new window.AudioContext();
  } catch {
    return null;
  }
}

export function isAudioBufferValid(buffer: AudioBuffer | null | undefined) {
  if (!buffer) return false;
  if (!buffer.length) return false;
  if (!buffer.sampleRate) return false;
  return true;
}

/* ---------------------------------- */
/* ENGINE STATE */
/* ---------------------------------- */

export function getTrackMatcherAudioEngineState(
  track: TrackMatcherAudioTrackInput,
  mode: TrackMatcherAudioEngineMode,
): TrackMatcherAudioEngineState {
  const bpm = normalizeTrackMatcherBpm(track.bpm);
  const keyShiftSemitones = getTrackKeyShiftSemitones(track);
  const tempoRatio = getTempoPlaybackMultiplier(bpm);
  const pitchRatio = getSemitonePlaybackMultiplier(keyShiftSemitones);

  const isProPitchMode = mode === "pro-pitch-dsp";

  const playbackRate = isProPitchMode
    ? tempoRatio
    : tempoRatio * pitchRatio;

  return {
    mode,
    bpm,
    keyShiftSemitones,
    playbackRate: roundTo(playbackRate, 5),
    pitchRatio: roundTo(pitchRatio, 5),
    tempoRatio: roundTo(tempoRatio, 5),
    isBrowserMode: mode === "browser-speed-pitch",
    isProPitchMode,
    label: isProPitchMode ? "Pro Pitch DSP" : "Browser Mode",
    detail: isProPitchMode
      ? "Tempo separated from pitch using DSP preparation layer."
      : "Browser playbackRate ties tempo and pitch together.",
    warning: isProPitchMode
      ? "DSP active. Will fallback if audio graph is not ready."
      : "Stable fallback mode.",
  };
}

/* ---------------------------------- */
/* DSP PLAN */
/* ---------------------------------- */

export function createTrackMatcherProPitchDspPlan(
  track: TrackMatcherAudioTrackInput,
  sourceReady: boolean,
  audioBuffer?: AudioBuffer | null,
): TrackMatcherProPitchDspPlan {
  const bpm = normalizeTrackMatcherBpm(track.bpm);
  const keyShiftSemitones = getTrackKeyShiftSemitones(track);

  const tempoRatio = getTempoPlaybackMultiplier(bpm);
  const pitchRatio = getSemitonePlaybackMultiplier(keyShiftSemitones);

  const hasTempoChange = Math.abs(tempoRatio - 1) > 0.001;
  const hasPitchChange = Math.abs(pitchRatio - 1) > 0.001;

  const bufferValid = isAudioBufferValid(audioBuffer);
  const dspReady = isWebAudioSupported() && bufferValid;

  return {
    enabled: true,
    sourceReady,
    shouldUseBrowserFallback: !dspReady,
    tempoRatio: roundTo(tempoRatio, 5),
    pitchRatio: roundTo(pitchRatio, 5),
    playbackRate: roundTo(tempoRatio, 5),
    grainSizeMs: hasPitchChange ? 80 : 120,
    overlapRatio: hasTempoChange || hasPitchChange ? 0.5 : 0.25,
    smoothingMs: 24,
    latencyMs: hasPitchChange ? 90 : 40,
    dspReady,
    label: "Pro Pitch DSP plan",
    detail:
      "Prepared for Web Audio granular/time-stretch pipeline.",
    warning: dspReady
      ? ""
      : "DSP not ready — falling back to Browser Mode.",
  };
}

/* ---------------------------------- */
/* MODE LABELS */
/* ---------------------------------- */

export function getTrackMatcherAudioModeLabel(mode: TrackMatcherAudioEngineMode) {
  return mode === "pro-pitch-dsp" ? "Pro Pitch DSP" : "Browser Mode";
}

export function getTrackMatcherAudioModeDetail(
  mode: TrackMatcherAudioEngineMode,
) {
  return mode === "pro-pitch-dsp"
    ? "Separated pitch + tempo via DSP pipeline."
    : "Simple playbackRate control.";
}