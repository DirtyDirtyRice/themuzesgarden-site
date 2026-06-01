import type {
  MultiTrackEngineSnapshot,
  MultiTrackEngineState,
} from "./multiTrackEngineTypes";

const MAX_MULTI_TRACK_ENGINE_SNAPSHOTS = 12;

function createSnapshotId(state: MultiTrackEngineState): string {
  const nextSnapshotNumber = state.snapshots.length + 1;
  const timestamp = Date.now();

  return `snapshot-${nextSnapshotNumber}-${timestamp}`;
}

function trimMultiTrackEngineSnapshots(
  snapshots: MultiTrackEngineSnapshot[],
): MultiTrackEngineSnapshot[] {
  return snapshots.slice(0, MAX_MULTI_TRACK_ENGINE_SNAPSHOTS);
}

export function getSnapshotSummary(state: MultiTrackEngineState): string {
  const trackATitle = state.trackA.title || "Track A";
  const trackBTitle = state.trackB.title || "Track B";
  const score = Math.round(state.comparison.weightedScore);

  return `${trackATitle} / ${trackBTitle} — ${score}% engine match`;
}

export function getLatestMultiTrackEngineSnapshot(
  state: MultiTrackEngineState,
): MultiTrackEngineSnapshot | null {
  return state.snapshots[0] ?? null;
}

export function getMultiTrackEngineSnapshotCount(state: MultiTrackEngineState): number {
  return state.snapshots.length;
}

export function hasMultiTrackEngineSnapshots(state: MultiTrackEngineState): boolean {
  return state.snapshots.length > 0;
}

export function createMultiTrackEngineSnapshot(
  state: MultiTrackEngineState,
): MultiTrackEngineSnapshot {
  return {
    snapshotId: createSnapshotId(state),
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
    snapshots: trimMultiTrackEngineSnapshots([snapshot, ...state.snapshots]),
  };
}

export function restoreMultiTrackEngineSnapshot(
  state: MultiTrackEngineState,
  snapshotId: string,
): MultiTrackEngineState {
  const snapshot = state.snapshots.find((savedSnapshot) => savedSnapshot.snapshotId === snapshotId);

  if (!snapshot) {
    return state;
  }

  return {
    ...state,
    editedAtLabel: new Date().toISOString(),
    trackA: structuredClone(snapshot.trackA),
    trackB: structuredClone(snapshot.trackB),
    comparison: structuredClone(snapshot.comparison),
    timeline: structuredClone(snapshot.timeline),
    analysis: structuredClone(snapshot.analysis),
    decision: structuredClone(snapshot.decision),
  };
}