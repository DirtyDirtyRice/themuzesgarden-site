import type { MultiTrackEngineState } from "./multiTrackEngineTypes";
import type {
  MultiTrackEngineSyncAnchor,
  MultiTrackEngineSyncCandidate,
  MultiTrackEngineSyncConfidenceLevel,
  MultiTrackEngineSyncState,
  MultiTrackEngineSyncTransitionSuggestion,
} from "./multiTrackEngineSyncTypes";
import { DEFAULT_MULTI_TRACK_ENGINE_SYNC_STATE } from "./multiTrackEngineSyncSeed";

export function createMultiTrackEngineSyncState(): MultiTrackEngineSyncState {
  return structuredClone(DEFAULT_MULTI_TRACK_ENGINE_SYNC_STATE);
}

export function getSyncConfidenceLevel(confidence: number): MultiTrackEngineSyncConfidenceLevel {
  if (confidence >= 0.95) return "locked";
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.45) return "medium";
  if (confidence > 0) return "low";
  return "unknown";
}

export function calculateSyncAverageConfidence(candidates: MultiTrackEngineSyncCandidate[]): number {
  if (candidates.length === 0) return 0;

  const total = candidates.reduce((sum, candidate) => sum + candidate.confidence, 0);
  return Number((total / candidates.length).toFixed(2));
}

export function getBestSyncCandidate(candidates: MultiTrackEngineSyncCandidate[]) {
  if (candidates.length === 0) return null;

  return [...candidates].sort((left, right) => right.confidence - left.confidence)[0] ?? null;
}

export function addMultiTrackEngineSyncAnchor(
  syncState: MultiTrackEngineSyncState,
  anchor: MultiTrackEngineSyncAnchor,
): MultiTrackEngineSyncState {
  return recalculateMultiTrackEngineSyncState({
    ...syncState,
    anchors: [...syncState.anchors, anchor].sort((left, right) => left.seconds - right.seconds),
  });
}

export function removeMultiTrackEngineSyncAnchor(
  syncState: MultiTrackEngineSyncState,
  anchorId: string,
): MultiTrackEngineSyncState {
  return recalculateMultiTrackEngineSyncState({
    ...syncState,
    anchors: syncState.anchors.filter((anchor) => anchor.id !== anchorId || anchor.locked),
  });
}

export function addMultiTrackEngineSyncCandidate(
  syncState: MultiTrackEngineSyncState,
  candidate: MultiTrackEngineSyncCandidate,
): MultiTrackEngineSyncState {
  return recalculateMultiTrackEngineSyncState({
    ...syncState,
    candidates: [...syncState.candidates, normalizeSyncCandidate(candidate)].sort(
      (left, right) => right.confidence - left.confidence,
    ),
  });
}

export function removeMultiTrackEngineSyncCandidate(
  syncState: MultiTrackEngineSyncState,
  candidateId: string,
): MultiTrackEngineSyncState {
  return recalculateMultiTrackEngineSyncState({
    ...syncState,
    candidates: syncState.candidates.filter((candidate) => candidate.id !== candidateId),
  });
}

export function addMultiTrackEngineSyncTransitionSuggestion(
  syncState: MultiTrackEngineSyncState,
  suggestion: MultiTrackEngineSyncTransitionSuggestion,
): MultiTrackEngineSyncState {
  return recalculateMultiTrackEngineSyncState({
    ...syncState,
    transitionSuggestions: [...syncState.transitionSuggestions, suggestion].sort(
      (left, right) => left.startSeconds - right.startSeconds,
    ),
  });
}

export function removeMultiTrackEngineSyncTransitionSuggestion(
  syncState: MultiTrackEngineSyncState,
  suggestionId: string,
): MultiTrackEngineSyncState {
  return recalculateMultiTrackEngineSyncState({
    ...syncState,
    transitionSuggestions: syncState.transitionSuggestions.filter(
      (suggestion) => suggestion.id !== suggestionId,
    ),
  });
}

export function recalculateMultiTrackEngineSyncState(
  syncState: MultiTrackEngineSyncState,
  engineState?: MultiTrackEngineState,
): MultiTrackEngineSyncState {
  const candidates = syncState.candidates.map(normalizeSyncCandidate);
  const bestCandidate = getBestSyncCandidate(candidates);
  const averageConfidence = calculateSyncAverageConfidence(candidates);
  const suggestedOffsetSeconds = bestCandidate?.offsetSeconds ?? 0;
  const hasBothTracks = Boolean(engineState?.trackA.loaded && engineState?.trackB.loaded);
  const bothSyncReady = Boolean(engineState?.trackA.syncReady && engineState?.trackB.syncReady);

  return {
    ...syncState,
    candidates,
    readiness: getSyncReadiness(averageConfidence, hasBothTracks, bothSyncReady),
    status: getSyncStatus(averageConfidence, hasBothTracks, bothSyncReady),
    summary: getSyncSummary(averageConfidence, hasBothTracks, bothSyncReady),
    bestCandidateLabel: bestCandidate?.label ?? "No sync candidate yet",
    averageConfidence,
    suggestedOffsetSeconds,
  };
}

export function normalizeSyncCandidate(
  candidate: MultiTrackEngineSyncCandidate,
): MultiTrackEngineSyncCandidate {
  const offsetSeconds = Number((candidate.trackBSeconds - candidate.trackASeconds).toFixed(3));
  const confidence = Math.max(0, Math.min(1, candidate.confidence));

  return {
    ...candidate,
    offsetSeconds,
    confidence,
    confidenceLevel: getSyncConfidenceLevel(confidence),
    ready: confidence >= 0.45,
  };
}

export function getSyncReadiness(
  averageConfidence: number,
  hasBothTracks: boolean,
  bothSyncReady: boolean,
) {
  if (!hasBothTracks) return "draft";
  if (bothSyncReady && averageConfidence >= 0.75) return "ready";
  if (averageConfidence >= 0.45) return "warning";
  return "draft";
}

export function getSyncStatus(
  averageConfidence: number,
  hasBothTracks: boolean,
  bothSyncReady: boolean,
) {
  if (!hasBothTracks) return "waiting";
  if (bothSyncReady && averageConfidence >= 0.75) return "aligned";
  if (averageConfidence >= 0.45) return "drifting";
  return "waiting";
}

export function getSyncSummary(
  averageConfidence: number,
  hasBothTracks: boolean,
  bothSyncReady: boolean,
): string {
  if (!hasBothTracks) return "Sync intelligence is waiting for both tracks to load.";
  if (bothSyncReady && averageConfidence >= 0.75) {
    return "Sync intelligence has a strong candidate alignment.";
  }
  if (averageConfidence >= 0.45) {
    return "Sync intelligence has partial alignment data and needs verification.";
  }
  return "Sync intelligence is waiting for stronger timing anchors and candidates.";
}

export function createSyncCandidateFromAnchors(
  trackAAnchor: MultiTrackEngineSyncAnchor,
  trackBAnchor: MultiTrackEngineSyncAnchor,
): MultiTrackEngineSyncCandidate {
  const confidence = Number(((trackAAnchor.confidence + trackBAnchor.confidence) / 2).toFixed(2));

  return normalizeSyncCandidate({
    id: `sync-candidate-${trackAAnchor.id}-${trackBAnchor.id}`,
    label: `${trackAAnchor.label} → ${trackBAnchor.label}`,
    trackASeconds: trackAAnchor.seconds,
    trackBSeconds: trackBAnchor.seconds,
    offsetSeconds: trackBAnchor.seconds - trackAAnchor.seconds,
    confidence,
    confidenceLevel: getSyncConfidenceLevel(confidence),
    detail: `Candidate offset created from ${trackAAnchor.label} and ${trackBAnchor.label}.`,
    ready: confidence >= 0.45,
  });
}