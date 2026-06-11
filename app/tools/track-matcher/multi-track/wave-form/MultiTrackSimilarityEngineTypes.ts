export type MultiTrackSimilarityEngineReadiness =
  | "ready"
  | "needs-waveform"
  | "needs-statistics"
  | "needs-transients"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackSimilarityEngineStatus =
  | "matched"
  | "estimated"
  | "seeded"
  | "missing"
  | "future";

export type MultiTrackSimilarityEngineSourceKind =
  | "track-a"
  | "track-b"
  | "suno-version"
  | "stem"
  | "reference"
  | "hybrid-render";

export type MultiTrackSimilarityEngineMatchStrength =
  | "weak"
  | "moderate"
  | "strong"
  | "keeper"
  | "blocked";

export type MultiTrackSimilarityEngineRisk =
  | "low"
  | "medium"
  | "high"
  | "blocked";

export type MultiTrackSimilarityEngineFeatureKind =
  | "energy-shape"
  | "transient-anchor"
  | "riff-entry"
  | "timing-drift"
  | "density"
  | "section-shape"
  | "loudness-bias"
  | "unknown";

export type MultiTrackSimilarityEngineFeature = {
  featureId: string;
  kind: MultiTrackSimilarityEngineFeatureKind;
  label: string;
  sourceLabel: string;
  score: number;
  detail: string;
  status: MultiTrackSimilarityEngineStatus;
  risk: MultiTrackSimilarityEngineRisk;
};

export type MultiTrackSimilarityEngineRegion = {
  regionId: string;
  title: string;
  sourceId: string;
  startMs: number;
  endMs: number;
  energyScore: number;
  transientScore: number;
  timingScore: number;
  structureScore: number;
  confidence: number;
  status: MultiTrackSimilarityEngineStatus;
};

export type MultiTrackSimilarityEngineMatch = {
  matchId: string;
  title: string;
  originalRegionId: string;
  candidateRegionId: string;
  overallScore: number;
  matchStrength: MultiTrackSimilarityEngineMatchStrength;
  timingDriftMs: number;
  energyDifference: number;
  transientOverlap: number;
  detail: string;
  recommendation: string;
  status: MultiTrackSimilarityEngineStatus;
  risk: MultiTrackSimilarityEngineRisk;
};

export type MultiTrackSimilarityEngineSource = {
  sourceId: string;
  title: string;
  sourceKind: MultiTrackSimilarityEngineSourceKind;
  fileLabel: string;
  readiness: MultiTrackSimilarityEngineReadiness;
  waveformReady: boolean;
  statisticsReady: boolean;
  transientsReady: boolean;
  similarityReady: boolean;
  regions: MultiTrackSimilarityEngineRegion[];
  features: MultiTrackSimilarityEngineFeature[];
  notes: string[];
};

export type MultiTrackSimilarityEngineFinding = {
  findingId: string;
  title: string;
  detail: string;
  action: string;
  status: MultiTrackSimilarityEngineStatus;
  risk: MultiTrackSimilarityEngineRisk;
};

export type MultiTrackSimilarityEngineWorkspace = {
  workspaceId: string;
  title: string;
  summary: string;
  readiness: MultiTrackSimilarityEngineReadiness;
  readinessLabel: string;
  engineGoal: string;
  engineBoundary: string;
  sources: MultiTrackSimilarityEngineSource[];
  matches: MultiTrackSimilarityEngineMatch[];
  findings: MultiTrackSimilarityEngineFinding[];
  engineRules: string[];
  nextSteps: string[];
};