import type {
  MultiTrackEngineComparisonSignal,
  MultiTrackEngineState,
  MultiTrackEngineTimelineMarker,
} from "./multiTrackEngineTypes";

export function calculateSimpleAverageComparisonScore(
  signals: MultiTrackEngineComparisonSignal[],
): number {
  if (signals.length === 0) return 0;

  const total = signals.reduce((sum, signal) => sum + signal.score, 0);
  return Math.round(total / signals.length);
}

export function calculateWeightedComparisonScore(signals: MultiTrackEngineComparisonSignal[]): number {
  const totalWeight = signals.reduce((sum, signal) => sum + signal.weight, 0);

  if (totalWeight <= 0) return 0;

  const weightedTotal = signals.reduce((sum, signal) => sum + signal.score * signal.weight, 0);
  return Math.round(weightedTotal / totalWeight);
}

export function calculateTempoScore(trackABpm: number | null, trackBBpm: number | null): number {
  if (!trackABpm || !trackBBpm) return 0;

  const difference = Math.abs(trackABpm - trackBBpm);
  if (difference === 0) return 100;
  if (difference <= 2) return 90;
  if (difference <= 5) return 75;
  if (difference <= 10) return 50;
  return 25;
}

export function calculateKeyScore(trackAKey: string, trackBKey: string): number {
  if (trackAKey === "Unknown key" || trackBKey === "Unknown key") return 0;
  if (trackAKey === trackBKey) return 100;

  const normalizedA = trackAKey.replace(" minor", "").replace(" major", "");
  const normalizedB = trackBKey.replace(" minor", "").replace(" major", "");

  if (normalizedA === normalizedB) return 80;
  return 45;
}

export function calculateStructureScore(markers: MultiTrackEngineTimelineMarker[]): number {
  if (markers.length <= 1) return 0;
  if (markers.length <= 3) return 45;
  if (markers.length <= 6) return 70;
  return 85;
}

export function calculateReadinessScore(state: MultiTrackEngineState): number {
  const checks = [
    state.trackA.loaded,
    state.trackB.loaded,
    state.trackA.waveformReady,
    state.trackB.waveformReady,
    state.trackA.metadataReady,
    state.trackB.metadataReady,
    state.trackA.analysisReady,
    state.trackB.analysisReady,
    state.trackA.transientReady,
    state.trackB.transientReady,
    state.trackA.syncReady,
    state.trackB.syncReady,
  ];

  const completedChecks = checks.filter(Boolean).length;
  return Math.round((completedChecks / checks.length) * 100);
}

export function getTempoDetail(trackABpm: number | null, trackBBpm: number | null): string {
  if (!trackABpm || !trackBBpm) return "Waiting for BPM values from both tracks.";

  const difference = Math.abs(trackABpm - trackBBpm);
  return `Track A is ${trackABpm} BPM, Track B is ${trackBBpm} BPM, difference is ${difference} BPM.`;
}

export function getKeyDetail(trackAKey: string, trackBKey: string): string {
  if (trackAKey === "Unknown key" || trackBKey === "Unknown key") {
    return "Waiting for key labels from both tracks.";
  }

  if (trackAKey === trackBKey) return `Both tracks are in ${trackAKey}.`;
  return `Track A is ${trackAKey}, Track B is ${trackBKey}.`;
}

export function getStructureDetail(markerCount: number): string {
  if (markerCount <= 1) return "Waiting for more timeline markers.";
  return `${markerCount} timeline markers are available for structure comparison.`;
}

export function getReadinessDetail(state: MultiTrackEngineState): string {
  const score = calculateReadinessScore(state);
  return `Engine readiness checks are ${score}% complete.`;
}