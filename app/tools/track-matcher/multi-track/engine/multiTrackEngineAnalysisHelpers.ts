import type {
  MultiTrackEngineAnalysisFinding,
  MultiTrackEngineLaneReadiness,
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
import { getEngineReadiness } from "./multiTrackEngineTrackHelpers";

export function getAnalysisFindingCounts(findings: MultiTrackEngineAnalysisFinding[]) {
  return {
    warningCount: findings.filter((finding) => finding.severity === "warning").length,
    blockedCount: findings.filter((finding) => finding.severity === "blocked").length,
  };
}

export function recalculateLaneReadiness(
  state: MultiTrackEngineState,
  weightedScore: number,
): MultiTrackEngineLaneReadiness[] {
  return state.analysis.laneReadiness.map((lane) => {
    if (lane.laneId === "overview") {
      return {
        ...lane,
        readiness: getEngineReadiness(state),
        score: calculateReadinessScore(state),
        detail: getReadinessDetail(state),
      };
    }

    if (lane.laneId === "waveform") {
      const score = Math.round(
        ((Number(state.trackA.waveformReady) + Number(state.trackB.waveformReady)) / 2) * 100,
      );

      return {
        ...lane,
        readiness: score === 100 ? "ready" : score > 0 ? "warning" : "empty",
        score,
        detail: score === 100 ? "Both waveforms are ready." : "Waveform data is still incomplete.",
      };
    }

    if (lane.laneId === "tempo") {
      const score = calculateTempoScore(state.trackA.bpm, state.trackB.bpm);

      return {
        ...lane,
        readiness: score >= 70 ? "ready" : score > 0 ? "warning" : "empty",
        score,
        detail: getTempoDetail(state.trackA.bpm, state.trackB.bpm),
      };
    }

    if (lane.laneId === "key") {
      const score = calculateKeyScore(state.trackA.keyLabel, state.trackB.keyLabel);

      return {
        ...lane,
        readiness: score >= 70 ? "ready" : score > 0 ? "warning" : "empty",
        score,
        detail: getKeyDetail(state.trackA.keyLabel, state.trackB.keyLabel),
      };
    }

    if (lane.laneId === "structure") {
      const score = calculateStructureScore(state.timeline.markers);

      return {
        ...lane,
        readiness: score >= 70 ? "ready" : score > 0 ? "draft" : "empty",
        score,
        detail: getStructureDetail(state.timeline.markers.length),
      };
    }

    if (lane.laneId === "sync") {
      const score = Math.round(
        ((Number(state.trackA.syncReady) + Number(state.trackB.syncReady)) / 2) * 100,
      );

      return {
        ...lane,
        readiness: score === 100 ? "ready" : score > 0 ? "warning" : "empty",
        score,
        detail: score === 100 ? "Both tracks are sync-ready." : "Sync readiness is incomplete.",
      };
    }

    if (lane.laneId === "decision") {
      return {
        ...lane,
        readiness: weightedScore >= 80 ? "ready" : weightedScore >= 40 ? "warning" : "draft",
        score: weightedScore,
        detail:
          weightedScore >= 80
            ? "Comparison foundation is strong enough for saving."
            : weightedScore >= 60
              ? "Comparison foundation is usable but still needs verification."
              : weightedScore >= 30
                ? "Comparison foundation has partial data."
                : "Comparison is waiting for track, waveform, metadata, and analysis readiness.",
      };
    }

    return lane;
  });
}