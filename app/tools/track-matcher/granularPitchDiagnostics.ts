import type {
  TrackMatcherGranularPitchEngineConfig,
  TrackMatcherGranularPitchEngineDiagnostics,
  TrackMatcherGranularPitchEngineMode,
  TrackMatcherGranularPitchEngineStatus,
} from "./granularPitchTypes";

type CreateGranularPitchDiagnosticsInput = {
  status: TrackMatcherGranularPitchEngineStatus;
  mode: TrackMatcherGranularPitchEngineMode;
  config: TrackMatcherGranularPitchEngineConfig;
  grainSpacingMs: number;
  scheduleAheadMs: number;
  scheduledGrainCount: number;
  activeGrainCount: number;
  currentBufferTime: number;
  startedAtContextTime: number;
};

type GranularPitchStressLevel = "idle" | "light" | "medium" | "heavy" | "extreme";

const HIGH_ACTIVE_GRAIN_COUNT = 40;
const EXTREME_ACTIVE_GRAIN_COUNT = 58;
const LARGE_PITCH_SHIFT_SEMITONES = 7;
const MEDIUM_PITCH_SHIFT_SEMITONES = 3;
const LARGE_TEMPO_SHIFT_RATIO = 0.35;
const MEDIUM_TEMPO_SHIFT_RATIO = 0.18;
const HIGH_OVERLAP_RATIO = 0.86;
const LOW_SPACING_MS = 10;
const HIGH_LATENCY_MS = 180;
const LOW_LATENCY_MS = 45;

function roundTo(value: number, places: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** places;

  return Math.round(value * factor) / factor;
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function getSafeCount(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function getPitchShiftSemitones(pitchRatio: number) {
  if (!Number.isFinite(pitchRatio) || pitchRatio <= 0) {
    return 0;
  }

  return roundTo(12 * Math.log2(pitchRatio), 2);
}

function getTempoShiftPercent(tempoRatio: number) {
  if (!Number.isFinite(tempoRatio)) {
    return 0;
  }

  return roundTo((tempoRatio - 1) * 100, 1);
}

function getPitchShiftLabel(semitones: number) {
  if (Math.abs(semitones) < 0.01) {
    return "no pitch shift";
  }

  const direction = semitones > 0 ? "up" : "down";

  return `${Math.abs(semitones).toFixed(2)} semitones ${direction}`;
}

function getTempoShiftLabel(tempoRatio: number) {
  const percent = getTempoShiftPercent(tempoRatio);

  if (Math.abs(percent) < 0.1) {
    return "native tempo";
  }

  const direction = percent > 0 ? "faster" : "slower";

  return `${Math.abs(percent).toFixed(1)}% ${direction}`;
}

function getStressLevel({
  status,
  activeGrainCount,
  pitchShiftSemitones,
  tempoRatio,
  overlapRatio,
  grainSpacingMs,
}: {
  status: TrackMatcherGranularPitchEngineStatus;
  activeGrainCount: number;
  pitchShiftSemitones: number;
  tempoRatio: number;
  overlapRatio: number;
  grainSpacingMs: number;
}): GranularPitchStressLevel {
  if (status === "idle" || status === "stopped") {
    return "idle";
  }

  const pitchAmount = Math.abs(pitchShiftSemitones);
  const tempoAmount = Math.abs(tempoRatio - 1);

  if (
    activeGrainCount >= EXTREME_ACTIVE_GRAIN_COUNT ||
    pitchAmount >= 12 ||
    tempoAmount >= 0.6
  ) {
    return "extreme";
  }

  if (
    activeGrainCount >= HIGH_ACTIVE_GRAIN_COUNT ||
    pitchAmount >= LARGE_PITCH_SHIFT_SEMITONES ||
    tempoAmount >= LARGE_TEMPO_SHIFT_RATIO ||
    overlapRatio >= HIGH_OVERLAP_RATIO
  ) {
    return "heavy";
  }

  if (
    pitchAmount >= MEDIUM_PITCH_SHIFT_SEMITONES ||
    tempoAmount >= MEDIUM_TEMPO_SHIFT_RATIO ||
    grainSpacingMs <= LOW_SPACING_MS
  ) {
    return "medium";
  }

  if (activeGrainCount > 0 || pitchAmount > 0.1 || tempoAmount > 0.02) {
    return "light";
  }

  return "idle";
}

function getDiagnosticsLabel({
  status,
  stressLevel,
}: {
  status: TrackMatcherGranularPitchEngineStatus;
  stressLevel: GranularPitchStressLevel;
}) {
  if (status === "failed") {
    return "Granular pitch engine needs attention";
  }

  if (status === "stopped") {
    return "Granular pitch engine stopped";
  }

  if (status === "idle") {
    return "Granular pitch engine idle";
  }

  if (stressLevel === "extreme") {
    return "Granular pitch engine under extreme load";
  }

  if (stressLevel === "heavy") {
    return "Granular pitch engine working hard";
  }

  return "Granular pitch engine";
}

function getDetailText({
  pitchShiftSemitones,
  tempoRatio,
  grainSizeMs,
  grainSpacingMs,
  activeGrainCount,
  scheduledGrainCount,
  stressLevel,
}: {
  pitchShiftSemitones: number;
  tempoRatio: number;
  grainSizeMs: number;
  grainSpacingMs: number;
  activeGrainCount: number;
  scheduledGrainCount: number;
  stressLevel: GranularPitchStressLevel;
}) {
  const pitchLabel = getPitchShiftLabel(pitchShiftSemitones);
  const tempoLabel = getTempoShiftLabel(tempoRatio);
  const stressLabel = stressLevel === "idle" ? "stable" : stressLevel;

  return [
    `Pitch shift: ${pitchLabel}`,
    `Tempo: ${tempoLabel}`,
    `Grain: ${roundTo(grainSizeMs, 1)}ms every ${roundTo(grainSpacingMs, 1)}ms`,
    `Active grains: ${activeGrainCount}`,
    `Scheduled grains: ${scheduledGrainCount}`,
    `Load: ${stressLabel}`,
  ].join(" · ");
}

function getWarningText({
  status,
  activeGrainCount,
  pitchShiftSemitones,
  tempoRatio,
  overlapRatio,
  grainSpacingMs,
  latencyMs,
  durationSeconds,
  currentBufferTime,
}: {
  status: TrackMatcherGranularPitchEngineStatus;
  activeGrainCount: number;
  pitchShiftSemitones: number;
  tempoRatio: number;
  overlapRatio: number;
  grainSpacingMs: number;
  latencyMs: number;
  durationSeconds: number;
  currentBufferTime: number;
}) {
  if (status === "failed") {
    return "Granular engine failed while scheduling grains.";
  }

  if (activeGrainCount >= EXTREME_ACTIVE_GRAIN_COUNT) {
    return "Very high grain count.";
  }

  if (activeGrainCount > HIGH_ACTIVE_GRAIN_COUNT) {
    return "High grain count.";
  }

  if (Math.abs(pitchShiftSemitones) >= 12) {
    return "Extreme pitch shift may add artifacts.";
  }

  if (Math.abs(tempoRatio - 1) >= 0.6) {
    return "Extreme tempo movement may add artifacts.";
  }

  if (overlapRatio >= HIGH_OVERLAP_RATIO && grainSpacingMs <= LOW_SPACING_MS) {
    return "Dense overlap may increase CPU use.";
  }

  if (latencyMs >= HIGH_LATENCY_MS) {
    return "High latency tuning is active for smoother pitch quality.";
  }

  if (latencyMs <= LOW_LATENCY_MS && status === "playing") {
    return "Low latency tuning may be less smooth.";
  }

  if (
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    currentBufferTime > durationSeconds
  ) {
    return "Buffer time is outside the source duration.";
  }

  return "";
}

function normalizeDiagnosticsInput(
  input: CreateGranularPitchDiagnosticsInput,
): CreateGranularPitchDiagnosticsInput {
  const safeDurationSeconds = Math.max(
    0,
    Number.isFinite(input.config.durationSeconds)
      ? input.config.durationSeconds
      : 0,
  );

  return {
    ...input,
    config: {
      ...input.config,
      tempoRatio: clampNumber(input.config.tempoRatio, 0.25, 4),
      pitchRatio: clampNumber(input.config.pitchRatio, 0.25, 4),
      grainSizeMs: Math.max(0, input.config.grainSizeMs),
      overlapRatio: clampNumber(input.config.overlapRatio, 0, 0.98),
      smoothingMs: Math.max(0, input.config.smoothingMs),
      latencyMs: Math.max(0, input.config.latencyMs),
      startAtSeconds: clampNumber(input.config.startAtSeconds, 0, safeDurationSeconds),
      durationSeconds: safeDurationSeconds,
    },
    grainSpacingMs: Math.max(0, input.grainSpacingMs),
    scheduleAheadMs: Math.max(0, input.scheduleAheadMs),
    scheduledGrainCount: getSafeCount(input.scheduledGrainCount),
    activeGrainCount: getSafeCount(input.activeGrainCount),
    currentBufferTime: Math.max(0, input.currentBufferTime),
    startedAtContextTime: Math.max(0, input.startedAtContextTime),
  };
}

export function createDiagnostics(
  input: CreateGranularPitchDiagnosticsInput,
): TrackMatcherGranularPitchEngineDiagnostics {
  const normalized = normalizeDiagnosticsInput(input);
  const { config } = normalized;
  const pitchShiftSemitones = getPitchShiftSemitones(config.pitchRatio);
  const stressLevel = getStressLevel({
    status: normalized.status,
    activeGrainCount: normalized.activeGrainCount,
    pitchShiftSemitones,
    tempoRatio: config.tempoRatio,
    overlapRatio: config.overlapRatio,
    grainSpacingMs: normalized.grainSpacingMs,
  });

  return {
    status: normalized.status,
    mode: normalized.mode,
    tempoRatio: roundTo(config.tempoRatio, 5),
    pitchRatio: roundTo(config.pitchRatio, 5),
    sourcePlaybackRate: roundTo(config.tempoRatio, 5),
    grainSizeMs: roundTo(config.grainSizeMs, 2),
    grainSpacingMs: roundTo(normalized.grainSpacingMs, 2),
    overlapRatio: roundTo(config.overlapRatio, 3),
    smoothingMs: roundTo(config.smoothingMs, 2),
    latencyMs: roundTo(config.latencyMs, 2),
    scheduleAheadMs: roundTo(normalized.scheduleAheadMs, 2),
    scheduledGrainCount: normalized.scheduledGrainCount,
    activeGrainCount: normalized.activeGrainCount,
    startAtSeconds: roundTo(config.startAtSeconds, 3),
    currentBufferTime: roundTo(normalized.currentBufferTime, 3),
    startedAtContextTime: roundTo(normalized.startedAtContextTime, 3),
    label: getDiagnosticsLabel({
      status: normalized.status,
      stressLevel,
    }),
    detail: getDetailText({
      pitchShiftSemitones,
      tempoRatio: config.tempoRatio,
      grainSizeMs: config.grainSizeMs,
      grainSpacingMs: normalized.grainSpacingMs,
      activeGrainCount: normalized.activeGrainCount,
      scheduledGrainCount: normalized.scheduledGrainCount,
      stressLevel,
    }),
    warning: getWarningText({
      status: normalized.status,
      activeGrainCount: normalized.activeGrainCount,
      pitchShiftSemitones,
      tempoRatio: config.tempoRatio,
      overlapRatio: config.overlapRatio,
      grainSpacingMs: normalized.grainSpacingMs,
      latencyMs: config.latencyMs,
      durationSeconds: config.durationSeconds,
      currentBufferTime: normalized.currentBufferTime,
    }),
  };
}