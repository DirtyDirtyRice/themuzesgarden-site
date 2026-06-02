import { DEFAULT_MULTI_TRACK_ENGINE_STATE } from "./multiTrackEngineSeed";
import type {
  MultiTrackEngineAnalysisFinding,
  MultiTrackEngineDecisionRoute,
  MultiTrackEngineState,
  MultiTrackEngineTimelineCue,
  MultiTrackEngineTimelineMarker,
  MultiTrackEngineTrackSlotId,
  MultiTrackEngineTrackState,
} from "./multiTrackEngineTypes";
import {
  getAnalysisFindingCounts,
  recalculateLaneReadiness,
} from "./multiTrackEngineAnalysisHelpers";
import {
  getComparisonReadiness,
  getComparisonStatus,
  getStrongestSignalLabel,
  getWeakestSignalLabel,
  recalculateComparisonSignals,
} from "./multiTrackEngineComparisonHelpers";
import {
  getComparisonSummary,
  getDecisionReason,
  getNextStepLabel,
  getRecommendedDecisionRoute,
} from "./multiTrackEngineDecisionHelpers";
import {
  calculateSimpleAverageComparisonScore,
  calculateWeightedComparisonScore,
} from "./multiTrackEngineScoreHelpers";
import {
  createMultiTrackEngineSnapshot,
  getSnapshotSummary,
  saveMultiTrackEngineSnapshot,
} from "./multiTrackEngineSnapshotHelpers";
import {
  getEngineReadiness,
  getLongestTrackDurationSeconds,
  getMultiTrackEngineTrack,
  getMultiTrackEngineTrackPair,
  getTrackReadiness,
} from "./multiTrackEngineTrackHelpers";
import { recalculateMultiTrackEngineRelationshipState } from "./multiTrackEngineRelationshipHelpers";

export { getAnalysisFindingCounts, recalculateLaneReadiness };
export {
  getComparisonReadiness,
  getComparisonStatus,
  getStrongestSignalLabel,
  getWeakestSignalLabel,
  recalculateComparisonSignals,
};
export {
  getComparisonSummary,
  getDecisionReason,
  getNextStepLabel,
  getRecommendedDecisionRoute,
};
export {
  calculateKeyScore,
  calculateReadinessScore,
  calculateSimpleAverageComparisonScore,
  calculateStructureScore,
  calculateTempoScore,
  calculateWeightedComparisonScore,
  getKeyDetail,
  getReadinessDetail,
  getStructureDetail,
  getTempoDetail,
} from "./multiTrackEngineScoreHelpers";
export {
  createMultiTrackEngineSnapshot,
  getSnapshotSummary,
  saveMultiTrackEngineSnapshot,
};
export {
  getEngineReadiness,
  getLongestTrackDurationSeconds,
  getMultiTrackEngineTrack,
  getMultiTrackEngineTrackPair,
  getTrackReadiness,
};
export {
  createMultiTrackEngineRelationshipState,
  recalculateMultiTrackEngineRelationshipState,
} from "./multiTrackEngineRelationshipHelpers";
export {
  getMultiTrackEngineVisibleCues,
  getMultiTrackEngineVisibleMarkers,
  setMultiTrackEngineLoop,
  setMultiTrackEnginePlayhead,
  setMultiTrackEngineTransportStatus,
  toggleMultiTrackEngineSnapToMarkers,
} from "./multiTrackEngineTimelineHelpers";

export function createMultiTrackEngineState(): MultiTrackEngineState {
  return structuredClone(DEFAULT_MULTI_TRACK_ENGINE_STATE);
}

export function resetMultiTrackEngineState(): MultiTrackEngineState {
  return createMultiTrackEngineState();
}

export function updateMultiTrackEngineTrack(
  state: MultiTrackEngineState,
  trackSlotId: MultiTrackEngineTrackSlotId,
  patch: Partial<MultiTrackEngineTrackState>,
): MultiTrackEngineState {
  const currentTrack = getMultiTrackEngineTrack(state, trackSlotId);
  const nextTrack = {
    ...currentTrack,
    ...patch,
  };

  nextTrack.loaded = nextTrack.sourceKind !== "empty" && nextTrack.title !== "No track loaded";
  nextTrack.readiness = getTrackReadiness(nextTrack);

  return trackSlotId === "track-a"
    ? recalculateMultiTrackEngineState({ ...state, trackA: nextTrack })
    : recalculateMultiTrackEngineState({ ...state, trackB: nextTrack });
}

export function toggleMultiTrackEngineTrackMute(
  state: MultiTrackEngineState,
  trackSlotId: MultiTrackEngineTrackSlotId,
): MultiTrackEngineState {
  const track = getMultiTrackEngineTrack(state, trackSlotId);
  return updateMultiTrackEngineTrack(state, trackSlotId, { muted: !track.muted });
}

export function toggleMultiTrackEngineTrackSolo(
  state: MultiTrackEngineState,
  trackSlotId: MultiTrackEngineTrackSlotId,
): MultiTrackEngineState {
  const track = getMultiTrackEngineTrack(state, trackSlotId);
  return updateMultiTrackEngineTrack(state, trackSlotId, { solo: !track.solo });
}

export function toggleMultiTrackEngineTrackLock(
  state: MultiTrackEngineState,
  trackSlotId: MultiTrackEngineTrackSlotId,
): MultiTrackEngineState {
  const track = getMultiTrackEngineTrack(state, trackSlotId);
  return updateMultiTrackEngineTrack(state, trackSlotId, { locked: !track.locked });
}

export function addMultiTrackEngineTimelineMarker(
  state: MultiTrackEngineState,
  marker: MultiTrackEngineTimelineMarker,
): MultiTrackEngineState {
  return recalculateMultiTrackEngineState({
    ...state,
    timeline: {
      ...state.timeline,
      markers: [...state.timeline.markers, marker].sort(
        (left, right) => left.startSeconds - right.startSeconds,
      ),
    },
  });
}

export function removeMultiTrackEngineTimelineMarker(
  state: MultiTrackEngineState,
  markerId: string,
): MultiTrackEngineState {
  return recalculateMultiTrackEngineState({
    ...state,
    timeline: {
      ...state.timeline,
      markers: state.timeline.markers.filter((marker) => marker.id !== markerId || marker.locked),
    },
  });
}

export function addMultiTrackEngineTimelineCue(
  state: MultiTrackEngineState,
  cue: MultiTrackEngineTimelineCue,
): MultiTrackEngineState {
  return recalculateMultiTrackEngineState({
    ...state,
    timeline: {
      ...state.timeline,
      cues: [...state.timeline.cues, cue].sort((left, right) => left.seconds - right.seconds),
    },
  });
}

export function removeMultiTrackEngineTimelineCue(
  state: MultiTrackEngineState,
  cueId: string,
): MultiTrackEngineState {
  return recalculateMultiTrackEngineState({
    ...state,
    timeline: {
      ...state.timeline,
      cues: state.timeline.cues.filter((cue) => cue.id !== cueId),
    },
  });
}

export function addMultiTrackEngineFinding(
  state: MultiTrackEngineState,
  finding: MultiTrackEngineAnalysisFinding,
): MultiTrackEngineState {
  return recalculateMultiTrackEngineState({
    ...state,
    analysis: {
      ...state.analysis,
      findings: [finding, ...state.analysis.findings],
    },
  });
}

export function clearMultiTrackEngineFindings(state: MultiTrackEngineState): MultiTrackEngineState {
  return recalculateMultiTrackEngineState({
    ...state,
    analysis: {
      ...state.analysis,
      findings: [],
    },
  });
}

export function setMultiTrackEngineDecisionRoute(
  state: MultiTrackEngineState,
  route: MultiTrackEngineDecisionRoute,
): MultiTrackEngineState {
  return recalculateMultiTrackEngineState({
    ...state,
    decision: {
      ...state.decision,
      route,
      reason: getDecisionReason(route),
    },
  });
}

export function recalculateMultiTrackEngineState(state: MultiTrackEngineState): MultiTrackEngineState {
  const trackAReadiness = getTrackReadiness(state.trackA);
  const trackBReadiness = getTrackReadiness(state.trackB);
  const comparisonSignals = recalculateComparisonSignals(state);
  const weightedScore = calculateWeightedComparisonScore(comparisonSignals);
  const averageScore = calculateSimpleAverageComparisonScore(comparisonSignals);
  const laneReadiness = recalculateLaneReadiness(state, weightedScore);
  const engineReadiness = getEngineReadiness({
    ...state,
    trackA: { ...state.trackA, readiness: trackAReadiness },
    trackB: { ...state.trackB, readiness: trackBReadiness },
  });
  const recommendedRoute = getRecommendedDecisionRoute({
    ...state,
    comparison: {
      ...state.comparison,
      weightedScore,
      averageScore,
    },
  });
  const findingCounts = getAnalysisFindingCounts(state.analysis.findings);

  const nextStateBase: MultiTrackEngineState = {
    ...state,
    editedAtLabel: new Date().toISOString(),
    trackA: {
      ...state.trackA,
      loaded: state.trackA.sourceKind !== "empty" && state.trackA.title !== "No track loaded",
      readiness: trackAReadiness,
    },
    trackB: {
      ...state.trackB,
      loaded: state.trackB.sourceKind !== "empty" && state.trackB.title !== "No track loaded",
      readiness: trackBReadiness,
    },
    comparison: {
      ...state.comparison,
      signals: comparisonSignals,
      averageScore,
      weightedScore,
      readiness: getComparisonReadiness(engineReadiness, weightedScore),
      status: getComparisonStatus(engineReadiness, weightedScore),
      strongestMatchLabel: getStrongestSignalLabel(comparisonSignals),
      weakestMatchLabel: getWeakestSignalLabel(comparisonSignals),
      summary: getComparisonSummary(engineReadiness, weightedScore),
    },
    timeline: {
      ...state.timeline,
      loopEndSeconds:
        state.timeline.loopEndSeconds > 0
          ? Math.min(state.timeline.loopEndSeconds, getLongestTrackDurationSeconds(state))
          : state.timeline.loopEndSeconds,
    },
    analysis: {
      ...state.analysis,
      readiness: engineReadiness === "empty" ? "draft" : engineReadiness,
      findingCount: state.analysis.findings.length,
      warningCount: findingCounts.warningCount,
      blockedCount: findingCounts.blockedCount,
      laneReadiness,
      nextStepLabel: getNextStepLabel(recommendedRoute),
    },
    decision: {
      ...state.decision,
      route: recommendedRoute,
      readiness: engineReadiness,
      reason: getDecisionReason(recommendedRoute),
      canSave: weightedScore >= 60 && engineReadiness !== "blocked",
      canExport: weightedScore >= 80 && engineReadiness === "ready",
    },
  };

  return {
    ...nextStateBase,
    relationship: recalculateMultiTrackEngineRelationshipState(
      nextStateBase.relationship,
      nextStateBase,
    ),
  };
}