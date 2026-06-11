export type MultiTrackIdeaLineageReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackIdeaLineageVersionId =
  | "original"
  | "version-01"
  | "version-02"
  | "version-03"
  | "version-04"
  | "version-05"
  | "version-06"
  | "version-07"
  | "version-08"
  | "version-09"
  | "version-10";

export type MultiTrackIdeaLineageIdeaKind =
  | "hook"
  | "riff"
  | "melody"
  | "bass-motion"
  | "drum-pocket"
  | "vocal-phrase"
  | "section-shape"
  | "hybrid";

export type MultiTrackIdeaLineageMutationKind =
  | "preserved"
  | "expanded"
  | "simplified"
  | "tempo-shifted"
  | "key-shifted"
  | "rhythm-shifted"
  | "lyric-shifted"
  | "instrument-shifted"
  | "weakened"
  | "lost";

export type MultiTrackIdeaLineageConfidenceBucket =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "blocked";

export type MultiTrackIdeaLineageColor =
  | "white"
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "orange"
  | "red"
  | "pink";

export type MultiTrackIdeaLineageRiskKind =
  | "missing-original"
  | "missing-version"
  | "weak-match"
  | "conflicting-lineage"
  | "missing-waveform"
  | "manual-review"
  | "future-analyzer";

export type MultiTrackIdeaLineageTimeRange = {
  startSeconds: number;
  endSeconds: number;
  label: string;
};

export type MultiTrackIdeaLineageNode = {
  id: string;
  title: string;
  versionId: MultiTrackIdeaLineageVersionId;
  ideaKind: MultiTrackIdeaLineageIdeaKind;
  color: MultiTrackIdeaLineageColor;
  timeRange: MultiTrackIdeaLineageTimeRange;
  summary: string;
  parentNodeId: string | null;
  childNodeIds: string[];
  mutationKind: MultiTrackIdeaLineageMutationKind;
  confidenceBucket: MultiTrackIdeaLineageConfidenceBucket;
  readinessStatus: MultiTrackIdeaLineageReadinessStatus;
};

export type MultiTrackIdeaLineageRisk = {
  id: string;
  riskKind: MultiTrackIdeaLineageRiskKind;
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
  isBlocking: boolean;
};

export type MultiTrackIdeaLineageScore = {
  id: string;
  nodeId: string;
  label: string;
  detail: string;
  value: number;
  confidenceBucket: MultiTrackIdeaLineageConfidenceBucket;
};

export type MultiTrackIdeaLineageBranch = {
  id: string;
  title: string;
  detail: string;
  rootNodeId: string;
  nodeIds: string[];
  survivorNodeId: string | null;
  color: MultiTrackIdeaLineageColor;
  riskIds: string[];
  readinessStatus: MultiTrackIdeaLineageReadinessStatus;
};

export type MultiTrackIdeaLineageLane = {
  id: string;
  label: string;
  detail: string;
  color: MultiTrackIdeaLineageColor;
  branchIds: string[];
  readinessStatus: MultiTrackIdeaLineageReadinessStatus;
};

export type MultiTrackIdeaLineageWorkspaceState = {
  id: string;
  title: string;
  description: string;
  nodes: MultiTrackIdeaLineageNode[];
  scores: MultiTrackIdeaLineageScore[];
  risks: MultiTrackIdeaLineageRisk[];
  branches: MultiTrackIdeaLineageBranch[];
  lanes: MultiTrackIdeaLineageLane[];
  activeBranchId: string;
  activeNodeId: string;
  readinessStatus: MultiTrackIdeaLineageReadinessStatus;
  guardrailNotes: string[];
};

export type MultiTrackIdeaLineageNodeSummary = {
  nodeId: string;
  title: string;
  versionId: MultiTrackIdeaLineageVersionId;
  ideaKind: MultiTrackIdeaLineageIdeaKind;
  mutationKind: MultiTrackIdeaLineageMutationKind;
  averageScore: number;
  confidenceBucket: MultiTrackIdeaLineageConfidenceBucket;
  readinessStatus: MultiTrackIdeaLineageReadinessStatus;
};

export type MultiTrackIdeaLineageBranchSummary = {
  branchId: string;
  title: string;
  rootTitle: string;
  survivorTitle: string;
  nodeCount: number;
  color: MultiTrackIdeaLineageColor;
  readinessStatus: MultiTrackIdeaLineageReadinessStatus;
};

export type MultiTrackIdeaLineageReviewPacket = {
  activeBranch: MultiTrackIdeaLineageBranch | null;
  activeNode: MultiTrackIdeaLineageNode | null;
  branchNodes: MultiTrackIdeaLineageNode[];
  scores: MultiTrackIdeaLineageScore[];
  risks: MultiTrackIdeaLineageRisk[];
};

export type MultiTrackIdeaLineageValidationResult = {
  isValid: boolean;
  readyCount: number;
  reviewCount: number;
  futureCount: number;
  blockedCount: number;
  messages: string[];
};