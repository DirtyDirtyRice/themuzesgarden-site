import type { PhraseDriftSeverity } from "./playerMomentPhraseDrift";
import type { PhraseStabilityLabel } from "./playerMomentPhraseStability.types";

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function clamp100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function round3(value: number): number {
  return Number(clamp01(value).toFixed(3));
}

export function round1(value: number): number {
  return Number(value.toFixed(1));
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getSeverityPenalty(severity: PhraseDriftSeverity): number {
  if (severity === "high") return 0.32;
  if (severity === "medium") return 0.18;
  if (severity === "low") return 0.08;
  return 0;
}

export function getStabilityLabel(score: number): PhraseStabilityLabel {
  if (score >= 85) return "solid";
  if (score >= 70) return "good";
  if (score >= 50) return "fragile";
  return "unstable";
}

export function getSeveritySortRank(severity: PhraseDriftSeverity): number {
  if (severity === "high") return 0;
  if (severity === "medium") return 1;
  if (severity === "low") return 2;
  return 3;
}