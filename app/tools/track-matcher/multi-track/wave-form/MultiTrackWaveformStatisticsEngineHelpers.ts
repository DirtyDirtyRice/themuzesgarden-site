import { multiTrackWaveformStatisticsEngineWorkspace } from "./MultiTrackWaveformStatisticsEngineSeed";
import type {
  MultiTrackWaveformStatisticsEngineComparison,
  MultiTrackWaveformStatisticsEngineFinding,
  MultiTrackWaveformStatisticsEngineMeasurement,
  MultiTrackWaveformStatisticsEngineReadiness,
  MultiTrackWaveformStatisticsEngineRiskLevel,
  MultiTrackWaveformStatisticsEngineSource,
  MultiTrackWaveformStatisticsEngineStatus,
  MultiTrackWaveformStatisticsEngineWindow,
  MultiTrackWaveformStatisticsEngineWorkspace,
} from "./MultiTrackWaveformStatisticsEngineTypes";

export function getMultiTrackWaveformStatisticsEngineWorkspace(): MultiTrackWaveformStatisticsEngineWorkspace {
  return multiTrackWaveformStatisticsEngineWorkspace;
}

export function getWaveformStatisticsEngineReadinessLabel(
  readiness: MultiTrackWaveformStatisticsEngineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-waveform") return "Needs Waveform";
  if (readiness === "needs-audio") return "Needs Audio";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getWaveformStatisticsEngineStatusLabel(
  status: MultiTrackWaveformStatisticsEngineStatus,
): string {
  if (status === "measured") return "Measured";
  if (status === "estimated") return "Estimated";
  if (status === "seeded") return "Seeded";
  if (status === "missing") return "Missing";
  return "Future";
}

export function getWaveformStatisticsEngineRiskLabel(
  risk: MultiTrackWaveformStatisticsEngineRiskLevel,
): string {
  if (risk === "low") return "Low";
  if (risk === "medium") return "Medium";
  if (risk === "high") return "High";
  return "Blocked";
}

export function getWaveformStatisticsEngineBooleanLabel(value: boolean): string {
  return value ? "Ready" : "Not Ready";
}

export function getWaveformStatisticsEngineDurationLabel(durationMs: number): string {
  if (durationMs <= 0) return "0:00";
  const seconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function getWaveformStatisticsEngineWindowLabel(
  window: MultiTrackWaveformStatisticsEngineWindow,
): string {
  return `${window.startMs}ms - ${window.endMs}ms`;
}

export function getWaveformStatisticsEnginePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 100;
  return Math.round(value * 100);
}

export function getWaveformStatisticsEngineEnergyWidth(
  window: MultiTrackWaveformStatisticsEngineWindow,
): string {
  return `${Math.max(4, getWaveformStatisticsEnginePercent(window.energy))}%`;
}

export function getWaveformStatisticsEngineRmsWidth(
  measurement: MultiTrackWaveformStatisticsEngineMeasurement,
): string {
  return `${Math.max(4, getWaveformStatisticsEnginePercent(measurement.value))}%`;
}

export function getWaveformStatisticsEngineAverageWindowEnergy(
  source: MultiTrackWaveformStatisticsEngineSource,
): number {
  if (source.windows.length === 0) return 0;
  const total = source.windows.reduce((sum, window) => sum + window.energy, 0);
  return roundStatistic(total / source.windows.length);
}

export function getWaveformStatisticsEngineAverageWindowRms(
  source: MultiTrackWaveformStatisticsEngineSource,
): number {
  if (source.windows.length === 0) return 0;
  const total = source.windows.reduce((sum, window) => sum + window.rms, 0);
  return roundStatistic(total / source.windows.length);
}

export function getWaveformStatisticsEnginePeakMeasurement(
  source: MultiTrackWaveformStatisticsEngineSource,
): MultiTrackWaveformStatisticsEngineMeasurement | null {
  return source.measurements.find((measurement) => measurement.kind === "peak") ?? null;
}

export function getWaveformStatisticsEngineRmsMeasurement(
  source: MultiTrackWaveformStatisticsEngineSource,
): MultiTrackWaveformStatisticsEngineMeasurement | null {
  return source.measurements.find((measurement) => measurement.kind === "rms") ?? null;
}

export function getWaveformStatisticsEngineStrongestWindow(
  source: MultiTrackWaveformStatisticsEngineSource,
): MultiTrackWaveformStatisticsEngineWindow | null {
  if (source.windows.length === 0) return null;
  return source.windows.reduce((strongest, window) => {
    if (window.energy > strongest.energy) return window;
    return strongest;
  }, source.windows[0]);
}

export function getWaveformStatisticsEngineQuietestWindow(
  source: MultiTrackWaveformStatisticsEngineSource,
): MultiTrackWaveformStatisticsEngineWindow | null {
  if (source.windows.length === 0) return null;
  return source.windows.reduce((quietest, window) => {
    if (window.rms < quietest.rms) return window;
    return quietest;
  }, source.windows[0]);
}

export function getWaveformStatisticsEngineRiskCount(
  source: MultiTrackWaveformStatisticsEngineSource,
): number {
  return source.findings.filter(
    (finding) => finding.risk === "medium" || finding.risk === "high" || finding.risk === "blocked",
  ).length;
}

export function getWaveformStatisticsEngineSourceSummary(
  source: MultiTrackWaveformStatisticsEngineSource,
): string {
  const strongest = getWaveformStatisticsEngineStrongestWindow(source);
  const averageEnergy = getWaveformStatisticsEngineAverageWindowEnergy(source);
  const riskCount = getWaveformStatisticsEngineRiskCount(source);

  if (!strongest) {
    return "No statistics windows exist yet.";
  }

  return `${strongest.label} is strongest. Average energy ${averageEnergy}. Risk flags ${riskCount}.`;
}

export function getWaveformStatisticsEngineComparisonSummary(
  comparison: MultiTrackWaveformStatisticsEngineComparison,
): string {
  const peak = roundStatistic(comparison.peakDifference);
  const rms = roundStatistic(comparison.rmsDifference);
  const energy = roundStatistic(comparison.energyDifference);

  return `Peak difference ${peak}, RMS difference ${rms}, energy difference ${energy}.`;
}

export function getWaveformStatisticsEngineFindingAction(
  finding: MultiTrackWaveformStatisticsEngineFinding,
): string {
  const risk = getWaveformStatisticsEngineRiskLabel(finding.risk);
  const status = getWaveformStatisticsEngineStatusLabel(finding.status);
  return `${status} / ${risk}: ${finding.action}`;
}

export function buildWaveformStatisticsEnginePlanningSentence(
  source: MultiTrackWaveformStatisticsEngineSource,
): string {
  const peak = getWaveformStatisticsEnginePeakMeasurement(source);
  const rms = getWaveformStatisticsEngineRmsMeasurement(source);
  const strongest = getWaveformStatisticsEngineStrongestWindow(source);

  if (!peak || !rms || !strongest) {
    return "Statistics engine needs peak, RMS, and window data before planning.";
  }

  return `${source.title}: peak ${peak.valueLabel}, RMS ${rms.valueLabel}, strongest window ${strongest.label}.`;
}

function roundStatistic(value: number): number {
  return Math.round(value * 100) / 100;
}