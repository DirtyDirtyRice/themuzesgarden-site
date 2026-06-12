export type MultiTrackVersionAlignmentReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackVersionAlignmentStatus =
  | "aligned"
  | "close"
  | "drifting"
  | "unmatched"
  | "future";

export type MultiTrackVersionAlignmentSource =
  | "manual"
  | "seed"
  | "future-waveform"
  | "future-transient"
  | "future-bpm"
  | "future-key"
  | "future-ai";

export type MultiTrackVersionAlignmentTrackRole =
  | "reference"
  | "candidate"
  | "keeper"
  | "experiment"
  | "review"
  | "future";

export type MultiTrackVersionAlignmentCorrectionKind =
  | "start-offset"
  | "bpm-normalize"
  | "key-normalize"
  | "phrase-slip"
  | "downbeat-shift"
  | "micro-nudge"
  | "future-warp";

export type MultiTrackVersionAlignmentAnchorKind =
  | "song-start"
  | "first-downbeat"
  | "hook-entry"
  | "riff-entry"
  | "chorus-entry"
  | "manual-marker"
  | "future-transient";

export type MultiTrackVersionAlignmentTimePoint = {
  seconds: number;
  label: string;
};

export type MultiTrackVersionAlignmentAnchor = {
  id: string;
  label: string;
  kind: MultiTrackVersionAlignmentAnchorKind;
  trackId: string;
  trackLabel: string;
  source: MultiTrackVersionAlignmentSource;
  referenceTime: MultiTrackVersionAlignmentTimePoint;
  candidateTime: MultiTrackVersionAlignmentTimePoint;
  offsetSeconds: number;
  confidencePercent: number;
  detail: string;
};

export type MultiTrackVersionAlignmentCorrection = {
  id: string;
  label: string;
  kind: MultiTrackVersionAlignmentCorrectionKind;
  trackId: string;
  trackLabel: string;
  amountLabel: string;
  amountValue: number;
  ready: boolean;
  detail: string;
};

export type MultiTrackVersionAlignmentTrack = {
  id: string;
  label: string;
  versionLabel: string;
  role: MultiTrackVersionAlignmentTrackRole;
  readiness: MultiTrackVersionAlignmentReadiness;
  status: MultiTrackVersionAlignmentStatus;
  originalKey: string;
  targetKey: string;
  originalBpm: number;
  targetBpm: number;
  startOffsetSeconds: number;
  driftSeconds: number;
  confidencePercent: number;
  anchors: MultiTrackVersionAlignmentAnchor[];
  corrections: MultiTrackVersionAlignmentCorrection[];
  notes: string;
};

export type MultiTrackVersionAlignmentGroup = {
  id: string;
  label: string;
  referenceTrackId: string;
  targetKey: string;
  targetBpm: number;
  readiness: MultiTrackVersionAlignmentReadiness;
  status: MultiTrackVersionAlignmentStatus;
  tracks: MultiTrackVersionAlignmentTrack[];
  detail: string;
};

export type MultiTrackVersionAlignmentPlan = {
  id: string;
  label: string;
  groupId: string;
  readyTrackCount: number;
  reviewTrackCount: number;
  blockedTrackCount: number;
  averageConfidencePercent: number;
  maxDriftSeconds: number;
  nextAction: string;
};

export type MultiTrackVersionAlignmentEngineState = {
  id: string;
  title: string;
  description: string;
  readiness: MultiTrackVersionAlignmentReadiness;
  targetKey: string;
  targetBpm: number;
  microNudgeSeconds: number;
  groups: MultiTrackVersionAlignmentGroup[];
  plans: MultiTrackVersionAlignmentPlan[];
  engineNotes: string[];
};