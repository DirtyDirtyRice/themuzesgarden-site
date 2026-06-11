export type MultiTrackTransientEngineReadiness =
  | "ready"
  | "needs-waveform"
  | "needs-statistics"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackTransientEngineStatus =
  | "detected"
  | "estimated"
  | "seeded"
  | "missing"
  | "future";

export type MultiTrackTransientEngineSourceKind =
  | "track-a"
  | "track-b"
  | "suno-version"
  | "stem"
  | "reference"
  | "hybrid-render";

export type MultiTrackTransientEngineStrength =
  | "weak"
  | "medium"
  | "strong"
  | "anchor";

export type MultiTrackTransientEngineRole =
  | "downbeat"
  | "snare"
  | "kick"
  | "vocal-attack"
  | "guitar-attack"
  | "riff-start"
  | "section-hit"
  | "unknown";

export type MultiTrackTransientEngineRisk =
  | "low"
  | "medium"
  | "high"
  | "blocked";

export type MultiTrackTransientEngineHit = {
  transientId: string;
  label: string;
  timeMs: number;
  strength: MultiTrackTransientEngineStrength;
  role: MultiTrackTransientEngineRole;
  peak: number;
  rmsJump: number;
  confidence: number;
  status: MultiTrackTransientEngineStatus;
};

export type MultiTrackTransientEngineCluster = {
  clusterId: string;
  title: string;
  startMs: number;
  endMs: number;
  transientIds: string[];
  dominantRole: MultiTrackTransientEngineRole;
  averageConfidence: number;
  densityLabel: string;
  status: MultiTrackTransientEngineStatus;
  risk: MultiTrackTransientEngineRisk;
};

export type MultiTrackTransientEngineFinding = {
  findingId: string;
  title: string;
  detail: string;
  action: string;
  status: MultiTrackTransientEngineStatus;
  risk: MultiTrackTransientEngineRisk;
};

export type MultiTrackTransientEngineSource = {
  sourceId: string;
  title: string;
  sourceKind: MultiTrackTransientEngineSourceKind;
  fileLabel: string;
  durationMs: number;
  readiness: MultiTrackTransientEngineReadiness;
  waveformReady: boolean;
  statisticsReady: boolean;
  transientsReady: boolean;
  transientCount: number;
  anchorCount: number;
  hits: MultiTrackTransientEngineHit[];
  clusters: MultiTrackTransientEngineCluster[];
  findings: MultiTrackTransientEngineFinding[];
  notes: string[];
};

export type MultiTrackTransientEngineComparison = {
  comparisonId: string;
  title: string;
  leftSourceId: string;
  rightSourceId: string;
  sharedAnchorCount: number;
  timingDriftMs: number;
  densityDifference: number;
  detail: string;
  status: MultiTrackTransientEngineStatus;
  risk: MultiTrackTransientEngineRisk;
};

export type MultiTrackTransientEngineWorkspace = {
  workspaceId: string;
  title: string;
  summary: string;
  readiness: MultiTrackTransientEngineReadiness;
  readinessLabel: string;
  engineGoal: string;
  engineBoundary: string;
  sources: MultiTrackTransientEngineSource[];
  comparisons: MultiTrackTransientEngineComparison[];
  engineRules: string[];
  nextSteps: string[];
};