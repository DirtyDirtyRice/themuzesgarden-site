import {
  multiTrackWaveformEngineWorkspace,
} from "./MultiTrackWaveformEngineSeed";
import type {
  MultiTrackWaveformEngineCheckpointStatus,
  MultiTrackWaveformEngineFrame,
  MultiTrackWaveformEngineMetric,
  MultiTrackWaveformEngineReadiness,
  MultiTrackWaveformEngineSource,
  MultiTrackWaveformEngineWorkspace,
} from "./MultiTrackWaveformEngineTypes";

export function getMultiTrackWaveformEngineWorkspace(): MultiTrackWaveformEngineWorkspace {
  return multiTrackWaveformEngineWorkspace;
}

export function getWaveformEngineReadinessLabel(
  readiness: MultiTrackWaveformEngineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-audio") return "Needs Audio";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getWaveformEngineCheckpointStatusLabel(
  status: MultiTrackWaveformEngineCheckpointStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-audio") return "Needs Audio";
  if (status === "needs-decode") return "Needs Decode";
  if (status === "needs-analysis") return "Needs Analysis";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getWaveformEngineBooleanLabel(value: boolean): string {
  return value ? "Ready" : "Not Ready";
}

export function getWaveformEngineDurationLabel(durationMs: number): string {
  if (durationMs <= 0) return "0:00";
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function getWaveformEngineFrameDurationLabel(frame: MultiTrackWaveformEngineFrame): string {
  return `${frame.startMs}ms - ${frame.endMs}ms`;
}

export function getWaveformEnginePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 100;
  return Math.round(value * 100);
}

export function getWaveformEngineFrameWidth(frame: MultiTrackWaveformEngineFrame): string {
  const peakPercent = getWaveformEnginePercent(frame.peak);
  return `${Math.max(4, peakPercent)}%`;
}

export function getWaveformEngineFrameOpacity(frame: MultiTrackWaveformEngineFrame): number {
  const rmsPercent = getWaveformEnginePercent(frame.rms);
  return Math.max(0.15, Math.min(0.8, rmsPercent / 100));
}

export function getWaveformEngineAveragePeak(frames: MultiTrackWaveformEngineFrame[]): number {
  if (frames.length === 0) return 0;
  const total = frames.reduce((sum, frame) => sum + frame.peak, 0);
  return roundWaveformEngineNumber(total / frames.length);
}

export function getWaveformEngineAverageRms(frames: MultiTrackWaveformEngineFrame[]): number {
  if (frames.length === 0) return 0;
  const total = frames.reduce((sum, frame) => sum + frame.rms, 0);
  return roundWaveformEngineNumber(total / frames.length);
}

export function getWaveformEngineAverageZeroCrossingRate(
  frames: MultiTrackWaveformEngineFrame[],
): number {
  if (frames.length === 0) return 0;
  const total = frames.reduce((sum, frame) => sum + frame.zeroCrossingRate, 0);
  return roundWaveformEngineNumber(total / frames.length);
}

export function getWaveformEngineMaxPeak(frames: MultiTrackWaveformEngineFrame[]): number {
  if (frames.length === 0) return 0;
  return roundWaveformEngineNumber(Math.max(...frames.map((frame) => frame.peak)));
}

export function getWaveformEngineMinPeak(frames: MultiTrackWaveformEngineFrame[]): number {
  if (frames.length === 0) return 0;
  return roundWaveformEngineNumber(Math.min(...frames.map((frame) => frame.peak)));
}

export function getWaveformEngineReadyDecodeStepCount(
  source: MultiTrackWaveformEngineSource,
): number {
  return source.decodeSteps.filter((step) => step.status === "ready").length;
}

export function getWaveformEngineDecodeStepCount(source: MultiTrackWaveformEngineSource): number {
  return source.decodeSteps.length;
}

export function getWaveformEngineDecodeReadinessPercent(
  source: MultiTrackWaveformEngineSource,
): number {
  const total = getWaveformEngineDecodeStepCount(source);
  if (total === 0) return 0;
  return Math.round((getWaveformEngineReadyDecodeStepCount(source) / total) * 100);
}

export function getWaveformEngineMetricStatusLabel(metric: MultiTrackWaveformEngineMetric): string {
  const status = getWaveformEngineCheckpointStatusLabel(metric.status);
  if (metric.direction === "higher-is-better") return `${status} / Higher`;
  if (metric.direction === "lower-is-better") return `${status} / Lower`;
  if (metric.direction === "range-is-better") return `${status} / Range`;
  return `${status} / Info`;
}

export function getWaveformEngineSourceReadinessDetail(
  source: MultiTrackWaveformEngineSource,
): string {
  const ready = getWaveformEngineReadyDecodeStepCount(source);
  const total = getWaveformEngineDecodeStepCount(source);

  if (source.readiness === "ready") {
    return `${ready} of ${total} engine steps are ready.`;
  }

  if (source.readiness === "needs-audio") {
    return "Audio must be loaded before real waveform analysis can run.";
  }

  if (source.readiness === "blocked") {
    return "This source is blocked until an upstream engine dependency is fixed.";
  }

  if (source.readiness === "needs-review") {
    return `${ready} of ${total} engine steps are ready. Review before real decode wiring.`;
  }

  return "Future source reserved for later engine wiring.";
}

export function getWaveformEngineSourceKindLabel(source: MultiTrackWaveformEngineSource): string {
  if (source.sourceKind === "track-a") return "Track A";
  if (source.sourceKind === "track-b") return "Track B";
  if (source.sourceKind === "stem") return "Stem";
  if (source.sourceKind === "reference") return "Reference";
  if (source.sourceKind === "suno-version") return "Suno Version";
  if (source.sourceKind === "hybrid-render") return "Hybrid Render";
  return "Manual Import";
}

export function getWaveformEngineSourceFormatLabel(
  source: MultiTrackWaveformEngineSource,
): string {
  return `${source.sampleRate.toLocaleString()} Hz / ${source.bitDepth}-bit / ${source.channelMode}`;
}

export function getWaveformEngineFrameSummary(source: MultiTrackWaveformEngineSource): string {
  const averagePeak = getWaveformEngineAveragePeak(source.frames);
  const averageRms = getWaveformEngineAverageRms(source.frames);
  const zcr = getWaveformEngineAverageZeroCrossingRate(source.frames);

  return `Avg peak ${averagePeak}, avg RMS ${averageRms}, avg ZCR ${zcr}`;
}

export function getWaveformEngineStrongestFrame(
  frames: MultiTrackWaveformEngineFrame[],
): MultiTrackWaveformEngineFrame | null {
  if (frames.length === 0) return null;

  return frames.reduce((strongest, frame) => {
    if (frame.peak > strongest.peak) return frame;
    return strongest;
  }, frames[0]);
}

export function getWaveformEngineQuietestFrame(
  frames: MultiTrackWaveformEngineFrame[],
): MultiTrackWaveformEngineFrame | null {
  if (frames.length === 0) return null;

  return frames.reduce((quietest, frame) => {
    if (frame.rms < quietest.rms) return frame;
    return quietest;
  }, frames[0]);
}

export function buildWaveformEnginePlanningSentence(
  source: MultiTrackWaveformEngineSource,
): string {
  const strongestFrame = getWaveformEngineStrongestFrame(source.frames);
  const quietestFrame = getWaveformEngineQuietestFrame(source.frames);

  if (!strongestFrame || !quietestFrame) {
    return "No frame data exists yet. Load audio before the waveform engine can plan.";
  }

  return `${source.title} has strongest peak at ${getWaveformEngineFrameDurationLabel(
    strongestFrame,
  )} and quietest RMS at ${getWaveformEngineFrameDurationLabel(quietestFrame)}.`;
}

function roundWaveformEngineNumber(value: number): number {
  return Math.round(value * 100) / 100;
}