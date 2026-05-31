import type {
  MultiTrackEngineComparisonSignal,
  MultiTrackEngineReadinessLevel,
  MultiTrackEngineState,
} from "./multiTrackEngineTypes";
import {
  calculateKeyScore,
  calculateReadinessScore,
  calculateStructureScore,
  calculateTempoScore,
  getKeyDetail,
  getReadinessDetail,
  getStructureDetail,
  getTempoDetail,
} from "./multiTrackEngineScoreHelpers";

export function recalculateComparisonSignals(
  state: MultiTrackEngineState,
): MultiTrackEngineComparisonSignal[] {
  return state.comparison.signals.map((signal) => {
    if (signal.id === "tempo-placeholder") {
      const score = calculateTempoScore(state.trackA.bpm, state.trackB.bpm);

      return {
        ...signal,
        score,
        ready: Boolean(state.trackA.bpm && state.trackB.bpm),
        polarity: score >= 70 ? "positive" : score >= 30 ? "neutral" : "negative",
        detail: getTempoDetail(state.trackA.bpm, state.trackB.bpm),
      };
    }

    if (signal.id === "key-placeholder") {
      const score = calculateKeyScore(state.trackA.keyLabel, state.trackB.keyLabel);

      return {
        ...signal,
        score,
        ready: state.trackA.keyLabel !== "Unknown key" && state.trackB.keyLabel !== "Unknown key",
        polarity: score >= 70 ? "positive" : score >= 30 ? "neutral" : "negative",
        detail: getKeyDetail(state.trackA.keyLabel, state.trackB.keyLabel),
      };
    }

    if (signal.id === "structure-placeholder") {
      const score = calculateStructureScore(state.timeline.markers);

      return {
        ...signal,
        score,
        ready: state.timeline.markers.length > 1,
        polarity: score >= 60 ? "positive" : score >= 30 ? "neutral" : "negative",
        detail: getStructureDetail(state.timeline.markers.length),
      };
    }

    if (signal.id === "readiness-placeholder") {
      const score = calculateReadinessScore(state);

      return {
        ...signal,
        score,
        ready: state.trackA.loaded || state.trackB.loaded,
        polarity: score >= 70 ? "positive" : score >= 30 ? "neutral" : "negative",
        detail: getReadinessDetail(state),
      };
    }

    return signal;
  });
}

export function getComparisonReadiness(
  engineReadiness: MultiTrackEngineReadinessLevel,
  weightedScore: number,
): MultiTrackEngineReadinessLevel {
  if (engineReadiness === "blocked") return "blocked";
  if (engineReadiness === "empty") return "empty";
  if (weightedScore >= 80 && engineReadiness === "ready") return "ready";
  if (weightedScore >= 40) return "warning";
  return "draft";
}

export function getComparisonStatus(
  engineReadiness: MultiTrackEngineReadinessLevel,
  weightedScore: number,
) {
  if (engineReadiness === "blocked") return "blocked";
  if (engineReadiness === "empty") return "not-started";
  if (weightedScore >= 80) return "aligned";
  if (weightedScore >= 40) return "drifting";
  return "waiting";
}

export function getStrongestSignalLabel(signals: MultiTrackEngineComparisonSignal[]): string {
  if (signals.length === 0) return "No comparison yet";

  return [...signals].sort((left, right) => right.score - left.score)[0]?.label ?? "No comparison yet";
}

export function getWeakestSignalLabel(signals: MultiTrackEngineComparisonSignal[]): string {
  if (signals.length === 0) return "No comparison yet";

  return [...signals].sort((left, right) => left.score - right.score)[0]?.label ?? "No comparison yet";
}