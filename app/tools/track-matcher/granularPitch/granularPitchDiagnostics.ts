import { getPitchShiftSemitones, roundTo } from "./granularPitchMath";
import type {
  TrackMatcherGranularPitchEngineConfig,
  TrackMatcherGranularPitchEngineDiagnostics,
} from "./granularPitchTypes";

type CreateDiagnosticsInput = {
  status: string;
  mode: string;
  config: TrackMatcherGranularPitchEngineConfig;
  grainSpacingMs: number;
  scheduleAheadMs: number;
  scheduledGrainCount: number;
  activeGrainCount: number;
  currentBufferTime: number;
  startedAtContextTime: number;
  error: string;
};

function getDiagnosticsLabel(status: string, mode: string) {
  if (status === "playing") return "Granular pitch engine active";
  if (status === "paused") return "Granular pitch engine paused";
  if (status === "ready") return "Granular pitch engine ready";
  if (status === "failed") return "Granular pitch engine failed";
  if (status === "stopped") return "Granular pitch engine stopped";
  if (mode === "pro-pitch") return "Granular pitch engine idle";

  return "Granular engine idle";
}

function getDiagnosticsDetail({
  status,
  config,
  scheduledGrainCount,
  activeGrainCount,
}: {
  status: string;
  config: TrackMatcherGranularPitchEngineConfig;
  scheduledGrainCount: number;
  activeGrainCount: number;
}) {
  if (status === "failed") {
    return "The granular pitch engine hit an error and returned control to the safe playback path.";
  }

  return `Tempo ${roundTo(config.tempoRatio, 3)}x, pitch ${roundTo(
    config.pitchRatio,
    3,
  )}x, ${scheduledGrainCount} grains scheduled, ${activeGrainCount} active.`;
}

function getDiagnosticsWarning(status: string, error: string) {
  if (error) return error;

  if (status === "failed") {
    return "Granular pitch playback failed.";
  }

  return "";
}

export function createGranularPitchDiagnostics({
  status,
  mode,
  config,
  grainSpacingMs,
  scheduleAheadMs,
  scheduledGrainCount,
  activeGrainCount,
  currentBufferTime,
  startedAtContextTime,
  error,
}: CreateDiagnosticsInput): TrackMatcherGranularPitchEngineDiagnostics {
  return {
    status,
    mode,
    tempoRatio: roundTo(config.tempoRatio, 5),
    pitchRatio: roundTo(config.pitchRatio, 5),
    sourcePlaybackRate: roundTo(config.pitchRatio, 5),
    pitchShiftSemitones: getPitchShiftSemitones(config.pitchRatio),
    grainSizeMs: roundTo(config.grainSizeMs, 2),
    grainSpacingMs: roundTo(grainSpacingMs, 2),
    scheduleAheadMs: roundTo(scheduleAheadMs, 2),
    scheduledGrainCount,
    activeGrainCount,
    currentBufferTime: roundTo(currentBufferTime, 3),
    startedAtContextTime: roundTo(startedAtContextTime, 3),
    error,
    label: getDiagnosticsLabel(status, mode),
    detail: getDiagnosticsDetail({
      status,
      config,
      scheduledGrainCount,
      activeGrainCount,
    }),
    warning: getDiagnosticsWarning(status, error),
  };
}

export function getGranularPitchDiagnosticsSummary(
  diagnostics: TrackMatcherGranularPitchEngineDiagnostics,
) {
  return [
    `status=${diagnostics.status}`,
    `mode=${diagnostics.mode}`,
    `tempo=${diagnostics.tempoRatio}`,
    `pitch=${diagnostics.pitchRatio}`,
    `grains=${diagnostics.activeGrainCount}/${diagnostics.scheduledGrainCount}`,
    `buffer=${diagnostics.currentBufferTime}`,
  ].join(" · ");
}