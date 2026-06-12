export type MultiTrackRiffGroupingEngineReadiness =
  | "ready"
  | "needs-similarity"
  | "needs-transients"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackRiffGroupingEngineStatus =
  | "grouped"
  | "estimated"
  | "seeded"
  | "missing"
  | "future";

export type MultiTrackRiffGroupingEngineRisk =
  | "low"
  | "medium"
  | "high"
  | "blocked";

export type MultiTrackRiffGroupingEngineSourceKind =
  | "track-a"
  | "track-b"
  | "suno-version"
  | "stem"
  | "reference"
  | "hybrid-render";

export type MultiTrackRiffGroupingEngineRiffRole =
  | "main-hook"
  | "supporting-riff"
  | "variation"
  | "bridge-lift"
  | "turnaround"
  | "intro-idea"
  | "unknown";

export type MultiTrackRiffGroupingEngineGroupStrength =
  | "weak"
  | "moderate"
  | "strong"
  | "keeper-candidate"
  | "blocked";

export type MultiTrackRiffGroupingEngineSegment = {
  segmentId: string;
  sourceId: string;
  title: string;
  startMs: number;
  endMs: number;
  role: MultiTrackRiffGroupingEngineRiffRole;
  energyScore: number;
  transientScore: number;
  similarityScore: number;
  timingDriftMs: number;
  confidence: number;
  status: MultiTrackRiffGroupingEngineStatus;
  risk: MultiTrackRiffGroupingEngineRisk;
};

export type MultiTrackRiffGroupingEngineGroup = {
  groupId: string;
  title: string;
  role: MultiTrackRiffGroupingEngineRiffRole;
  segmentIds: string[];
  sourceIds: string[];
  groupStrength: MultiTrackRiffGroupingEngineGroupStrength;
  averageSimilarity: number;
  averageConfidence: number;
  driftSpreadMs: number;
  survivorPotential: number;
  detail: string;
  recommendation: string;
  status: MultiTrackRiffGroupingEngineStatus;
  risk: MultiTrackRiffGroupingEngineRisk;
};

export type MultiTrackRiffGroupingEngineSource = {
  sourceId: string;
  title: string;
  sourceKind: MultiTrackRiffGroupingEngineSourceKind;
  fileLabel: string;
  readiness: MultiTrackRiffGroupingEngineReadiness;
  similarityReady: boolean;
  transientReady: boolean;
  groupingReady: boolean;
  segments: MultiTrackRiffGroupingEngineSegment[];
  notes: string[];
};

export type MultiTrackRiffGroupingEngineFinding = {
  findingId: string;
  title: string;
  detail: string;
  action: string;
  status: MultiTrackRiffGroupingEngineStatus;
  risk: MultiTrackRiffGroupingEngineRisk;
};

export type MultiTrackRiffGroupingEngineWorkspace = {
  workspaceId: string;
  title: string;
  summary: string;
  readiness: MultiTrackRiffGroupingEngineReadiness;
  readinessLabel: string;
  engineGoal: string;
  engineBoundary: string;
  sources: MultiTrackRiffGroupingEngineSource[];
  groups: MultiTrackRiffGroupingEngineGroup[];
  findings: MultiTrackRiffGroupingEngineFinding[];
  engineRules: string[];
  nextSteps: string[];
};