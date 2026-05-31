import type {
  MultiTrackEngineSnapshot,
  MultiTrackEngineState,
} from "./multiTrackEngineTypes";

export function createMultiTrackEngineSnapshot(state: MultiTrackEngineState): MultiTrackEngineSnapshot {
  return {
    snapshotId: `snapshot-${state.snapshots.length + 1}`,
    createdAtLabel: new Date().toISOString(),
    summary: getSnapshotSummary(state),
    trackA: structuredClone(state.trackA),
    trackB: structuredClone(state.trackB),
    comparison: structuredClone(state.comparison),
    timeline: structuredClone(state.timeline),
    analysis: structuredClone(state.analysis),
    decision: structuredClone(state.decision),
  };
}

export function saveMultiTrackEngineSnapshot(state: MultiTrackEngineState): MultiTrackEngineState {
  const snapshot = createMultiTrackEngineSnapshot(state);

  return {
    ...state,
    editedAtLabel: snapshot.createdAtLabel,
    snapshots: [snapshot, ...state.snapshots].slice(0, 12),
  };
}

export function getSnapshotSummary(state: MultiTrackEngineState): string {
  return `${state.trackA.title} / ${state.trackB.title} — ${state.comparison.weightedScore}% engine match`;
}