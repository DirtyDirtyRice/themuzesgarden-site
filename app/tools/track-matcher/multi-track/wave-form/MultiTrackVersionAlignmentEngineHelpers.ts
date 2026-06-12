import type {
  MultiTrackVersionAlignmentCorrection,
  MultiTrackVersionAlignmentEngineState,
  MultiTrackVersionAlignmentGroup,
  MultiTrackVersionAlignmentReadiness,
  MultiTrackVersionAlignmentStatus,
  MultiTrackVersionAlignmentTrack,
} from "./MultiTrackVersionAlignmentEngineTypes";

export function getVersionAlignmentReadinessLabel(
  readiness: MultiTrackVersionAlignmentReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getVersionAlignmentStatusLabel(
  status: MultiTrackVersionAlignmentStatus,
): string {
  if (status === "aligned") return "Aligned";
  if (status === "close") return "Close";
  if (status === "drifting") return "Drifting";
  if (status === "unmatched") return "Unmatched";
  return "Future";
}

export function getAllVersionAlignmentTracks(
  groups: MultiTrackVersionAlignmentGroup[],
): MultiTrackVersionAlignmentTrack[] {
  return groups.flatMap((group) => group.tracks);
}

export function getReadyVersionAlignmentTracks(
  groups: MultiTrackVersionAlignmentGroup[],
): MultiTrackVersionAlignmentTrack[] {
  return getAllVersionAlignmentTracks(groups).filter(
    (track) => track.readiness === "ready",
  );
}

export function getReviewVersionAlignmentTracks(
  groups: MultiTrackVersionAlignmentGroup[],
): MultiTrackVersionAlignmentTrack[] {
  return getAllVersionAlignmentTracks(groups).filter(
    (track) => track.readiness === "needs-review",
  );
}

export function getVersionAlignmentAverageConfidence(
  tracks: MultiTrackVersionAlignmentTrack[],
): number {
  if (tracks.length === 0) return 0;

  const total = tracks.reduce((sum, track) => sum + track.confidencePercent, 0);
  return Math.round(total / tracks.length);
}

export function getVersionAlignmentMaxDriftSeconds(
  tracks: MultiTrackVersionAlignmentTrack[],
): number {
  if (tracks.length === 0) return 0;

  return Number(
    Math.max(...tracks.map((track) => Math.abs(track.driftSeconds))).toFixed(2),
  );
}

export function getVersionAlignmentMaxOffsetSeconds(
  tracks: MultiTrackVersionAlignmentTrack[],
): number {
  if (tracks.length === 0) return 0;

  return Number(
    Math.max(...tracks.map((track) => Math.abs(track.startOffsetSeconds))).toFixed(2),
  );
}

export function getVersionAlignmentCorrectionLabel(
  correction: MultiTrackVersionAlignmentCorrection,
): string {
  if (correction.kind === "start-offset") return "Start Offset";
  if (correction.kind === "bpm-normalize") return "BPM Normalize";
  if (correction.kind === "key-normalize") return "Key Normalize";
  if (correction.kind === "phrase-slip") return "Phrase Slip";
  if (correction.kind === "downbeat-shift") return "Downbeat Shift";
  if (correction.kind === "micro-nudge") return "Micro Nudge";
  return "Future Warp";
}

export function getVersionAlignmentPendingCorrectionCount(
  track: MultiTrackVersionAlignmentTrack,
): number {
  return track.corrections.filter((correction) => correction.ready).length;
}

export function getVersionAlignmentTrackScore(track: MultiTrackVersionAlignmentTrack): number {
  const offsetPenalty = Math.min(Math.abs(track.startOffsetSeconds) * 12, 18);
  const driftPenalty = Math.min(Math.abs(track.driftSeconds) * 18, 22);
  const confidence = track.confidencePercent;

  const score = Math.round(confidence - offsetPenalty - driftPenalty);
  if (!Number.isFinite(score)) return 0;
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}

export function getVersionAlignmentTrackAction(track: MultiTrackVersionAlignmentTrack): string {
  if (track.role === "reference") return "Use as reference";
  if (track.status === "aligned") return "Ready for phrase matching";
  if (track.status === "close") return "Apply correction and review hook anchor";
  if (track.status === "drifting") return "Normalize and listen before matching";
  if (track.status === "unmatched") return "Do not match yet";
  return "Future detector needed";
}

export function getVersionAlignmentGroupScore(group: MultiTrackVersionAlignmentGroup): number {
  if (group.tracks.length === 0) return 0;

  const total = group.tracks.reduce(
    (sum, track) => sum + getVersionAlignmentTrackScore(track),
    0,
  );

  return Math.round(total / group.tracks.length);
}

export function getVersionAlignmentEngineMetrics(
  state: MultiTrackVersionAlignmentEngineState,
): {
  groupCount: number;
  trackCount: number;
  readyCount: number;
  reviewCount: number;
  averageConfidence: number;
  maxOffsetSeconds: number;
  maxDriftSeconds: number;
  groupScore: number;
} {
  const tracks = getAllVersionAlignmentTracks(state.groups);

  return {
    groupCount: state.groups.length,
    trackCount: tracks.length,
    readyCount: getReadyVersionAlignmentTracks(state.groups).length,
    reviewCount: getReviewVersionAlignmentTracks(state.groups).length,
    averageConfidence: getVersionAlignmentAverageConfidence(tracks),
    maxOffsetSeconds: getVersionAlignmentMaxOffsetSeconds(tracks),
    maxDriftSeconds: getVersionAlignmentMaxDriftSeconds(tracks),
    groupScore:
      state.groups.length === 0
        ? 0
        : Math.round(
            state.groups.reduce((sum, group) => sum + getVersionAlignmentGroupScore(group), 0) /
              state.groups.length,
          ),
  };
}

export function getVersionAlignmentDistanceLabel(
  state: MultiTrackVersionAlignmentEngineState,
): string {
  const metrics = getVersionAlignmentEngineMetrics(state);

  if (metrics.groupScore >= 90) return "Ready for phrase matching";
  if (metrics.groupScore >= 75) return "Close alignment";
  if (metrics.groupScore >= 50) return "Review alignment";
  return "Not aligned";
}