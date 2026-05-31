import type {
  MultiTrackEngineReadinessLevel,
  MultiTrackEngineState,
  MultiTrackEngineTrackSlotId,
  MultiTrackEngineTrackState,
} from "./multiTrackEngineTypes";

export function getMultiTrackEngineTrack(
  state: MultiTrackEngineState,
  trackSlotId: MultiTrackEngineTrackSlotId,
): MultiTrackEngineTrackState {
  return trackSlotId === "track-a" ? state.trackA : state.trackB;
}

export function getMultiTrackEngineTrackPair(state: MultiTrackEngineState) {
  return [state.trackA, state.trackB] as const;
}

export function getTrackReadiness(track: MultiTrackEngineTrackState): MultiTrackEngineReadinessLevel {
  if (track.sourceKind === "empty" || !track.loaded) return "empty";
  if (!track.waveformReady || !track.metadataReady) return "draft";
  if (!track.analysisReady || !track.transientReady) return "warning";
  if (!track.syncReady) return "warning";
  return "ready";
}

export function getEngineReadiness(state: MultiTrackEngineState): MultiTrackEngineReadinessLevel {
  const trackAReadiness = getTrackReadiness(state.trackA);
  const trackBReadiness = getTrackReadiness(state.trackB);

  if (trackAReadiness === "blocked" || trackBReadiness === "blocked") return "blocked";
  if (trackAReadiness === "empty" && trackBReadiness === "empty") return "empty";
  if (trackAReadiness === "ready" && trackBReadiness === "ready") return "ready";
  if (trackAReadiness === "warning" || trackBReadiness === "warning") return "warning";
  return "draft";
}

export function getLongestTrackDurationSeconds(state: MultiTrackEngineState): number {
  return Math.max(state.trackA.durationSeconds, state.trackB.durationSeconds, 0);
}