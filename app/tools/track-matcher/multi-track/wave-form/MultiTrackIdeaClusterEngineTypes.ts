export type MultiTrackIdeaClusterReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackIdeaClusterStatus =
  | "clustered"
  | "candidate"
  | "review"
  | "split"
  | "blocked"
  | "future";

export type MultiTrackIdeaClusterSource =
  | "manual"
  | "seed"
  | "riff-color-engine"
  | "phrase-matching-engine"
  | "similarity-engine"
  | "strongest-idea-engine"
  | "future-ai"
  | "future-dsp";

export type MultiTrackIdeaClusterKind =
  | "hook"
  | "riff"
  | "answer"
  | "groove"
  | "section"
  | "experiment"
  | "unknown";

export type MultiTrackIdeaClusterDecision =
  | "promote"
  | "keep"
  | "review"
  | "split"
  | "merge"
  | "archive"
  | "future";

export type MultiTrackIdeaClusterEvidenceKind =
  | "same-color"
  | "same-phrase"
  | "same-contour"
  | "same-rhythm"
  | "same-memory"
  | "same-source-family"
  | "manual-confirmed"
  | "future-detected";

export type MultiTrackIdeaClusterRisk =
  | "weak-confidence"
  | "color-conflict"
  | "phrase-drift"
  | "timing-drift"
  | "note-mutation"
  | "over-merged"
  | "needs-listening"
  | "future-only";

export type MultiTrackIdeaClusterTimeRange = {
  startSecond: number;
  endSecond: number;
  durationSecond: number;
  label: string;
};

export type MultiTrackIdeaClusterMember = {
  id: string;
  label: string;
  trackId: string;
  trackLabel: string;
  versionLabel: string;
  sourceRegionId: string;
  sourcePhraseId: string;
  source: MultiTrackIdeaClusterSource;
  readiness: MultiTrackIdeaClusterReadiness;
  status: MultiTrackIdeaClusterStatus;
  timeRange: MultiTrackIdeaClusterTimeRange;
  color: string;
  similarityPercent: number;
  confidencePercent: number;
  mutationDistancePercent: number;
  notes: string;
};

export type MultiTrackIdeaClusterEvidence = {
  id: string;
  label: string;
  kind: MultiTrackIdeaClusterEvidenceKind;
  scorePercent: number;
  weight: number;
  detail: string;
};

export type MultiTrackIdeaCluster = {
  id: string;
  label: string;
  kind: MultiTrackIdeaClusterKind;
  source: MultiTrackIdeaClusterSource;
  readiness: MultiTrackIdeaClusterReadiness;
  status: MultiTrackIdeaClusterStatus;
  color: string;
  rootMemberId: string;
  strongestMemberId: string;
  minimumConfidencePercent: number;
  clusterConfidencePercent: number;
  members: MultiTrackIdeaClusterMember[];
  evidence: MultiTrackIdeaClusterEvidence[];
  risks: MultiTrackIdeaClusterRisk[];
  decision: MultiTrackIdeaClusterDecision;
  detail: string;
};

export type MultiTrackIdeaClusterActionPlan = {
  id: string;
  label: string;
  clusterId: string;
  decision: MultiTrackIdeaClusterDecision;
  ready: boolean;
  confidencePercent: number;
  nextAction: string;
  detail: string;
};

export type MultiTrackIdeaClusterEngineState = {
  id: string;
  title: string;
  description: string;
  readiness: MultiTrackIdeaClusterReadiness;
  targetKey: string;
  targetBpm: number;
  clusters: MultiTrackIdeaCluster[];
  actionPlans: MultiTrackIdeaClusterActionPlan[];
  engineNotes: string[];
};