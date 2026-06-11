export type MultiTrackVariationEngineReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackVariationEngineVariationKind =
  | "hook"
  | "riff"
  | "melody"
  | "vocal"
  | "bass"
  | "drums"
  | "groove"
  | "transition"
  | "section"
  | "hybrid";

export type MultiTrackVariationEngineDecisionKind =
  | "keep"
  | "compare"
  | "extract"
  | "duplicate"
  | "edit"
  | "render"
  | "reject"
  | "hold";

export type MultiTrackVariationEngineVersionId =
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

export type MultiTrackVariationEngineConfidenceBucket =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "blocked";

export type MultiTrackVariationEngineColor =
  | "white"
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "orange"
  | "red"
  | "pink";

export type MultiTrackVariationEngineScoreKind =
  | "identity-match"
  | "melody-strength"
  | "rhythm-strength"
  | "groove-strength"
  | "editability"
  | "render-readiness"
  | "stem-safety"
  | "user-keeper";

export type MultiTrackVariationEngineRiskKind =
  | "missing-audio"
  | "missing-analysis"
  | "weak-identity"
  | "bad-edit-window"
  | "render-not-ready"
  | "stem-bleed"
  | "manual-review"
  | "future-dsp";

export type MultiTrackVariationEngineTimeRange = {
  startSeconds: number;
  endSeconds: number;
  label: string;
};

export type MultiTrackVariationEngineSourceVersion = {
  id: string;
  versionId: MultiTrackVariationEngineVersionId;
  title: string;
  fileLabel: string;
  bpm: number | null;
  keyLabel: string | null;
  durationSeconds: number | null;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineScore = {
  id: string;
  scoreKind: MultiTrackVariationEngineScoreKind;
  label: string;
  detail: string;
  value: number;
  confidenceBucket: MultiTrackVariationEngineConfidenceBucket;
};

export type MultiTrackVariationEngineRisk = {
  id: string;
  riskKind: MultiTrackVariationEngineRiskKind;
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
  isBlocking: boolean;
};

export type MultiTrackVariationEngineDecision = {
  id: string;
  decisionKind: MultiTrackVariationEngineDecisionKind;
  label: string;
  detail: string;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineCandidate = {
  id: string;
  title: string;
  versionId: MultiTrackVariationEngineVersionId;
  variationKind: MultiTrackVariationEngineVariationKind;
  color: MultiTrackVariationEngineColor;
  timeRange: MultiTrackVariationEngineTimeRange;
  summary: string;
  scoreIds: string[];
  riskIds: string[];
  decisionIds: string[];
  confidenceBucket: MultiTrackVariationEngineConfidenceBucket;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineCluster = {
  id: string;
  title: string;
  detail: string;
  variationKind: MultiTrackVariationEngineVariationKind;
  color: MultiTrackVariationEngineColor;
  candidateIds: string[];
  winningCandidateId: string | null;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineEditPlan = {
  id: string;
  candidateId: string;
  label: string;
  detail: string;
  trimStartSeconds: number;
  trimEndSeconds: number;
  duplicateCount: number;
  targetLaneLabel: string;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineRenderPlan = {
  id: string;
  candidateId: string;
  label: string;
  detail: string;
  outputFormat: "wav" | "mp3" | "stem-pack" | "future-session";
  includeTail: boolean;
  normalizeOutput: boolean;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineComparison = {
  id: string;
  clusterId: string;
  leftCandidateId: string;
  rightCandidateId: string;
  similarityPercent: number;
  winnerCandidateId: string | null;
  reason: string;
  confidenceBucket: MultiTrackVariationEngineConfidenceBucket;
};

export type MultiTrackVariationEngineLane = {
  id: string;
  label: string;
  detail: string;
  color: MultiTrackVariationEngineColor;
  candidateIds: string[];
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineWorkspaceState = {
  id: string;
  title: string;
  description: string;
  sourceVersions: MultiTrackVariationEngineSourceVersion[];
  scores: MultiTrackVariationEngineScore[];
  risks: MultiTrackVariationEngineRisk[];
  decisions: MultiTrackVariationEngineDecision[];
  candidates: MultiTrackVariationEngineCandidate[];
  clusters: MultiTrackVariationEngineCluster[];
  comparisons: MultiTrackVariationEngineComparison[];
  editPlans: MultiTrackVariationEngineEditPlan[];
  renderPlans: MultiTrackVariationEngineRenderPlan[];
  lanes: MultiTrackVariationEngineLane[];
  activeClusterId: string;
  activeCandidateId: string;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
  guardrailNotes: string[];
};

export type MultiTrackVariationEngineCandidateSummary = {
  candidateId: string;
  title: string;
  versionId: MultiTrackVariationEngineVersionId;
  variationKind: MultiTrackVariationEngineVariationKind;
  color: MultiTrackVariationEngineColor;
  averageScore: number;
  riskCount: number;
  confidenceBucket: MultiTrackVariationEngineConfidenceBucket;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineClusterSummary = {
  clusterId: string;
  title: string;
  variationKind: MultiTrackVariationEngineVariationKind;
  color: MultiTrackVariationEngineColor;
  candidateCount: number;
  winningCandidateTitle: string;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineReviewPacket = {
  activeCluster: MultiTrackVariationEngineCluster | null;
  activeCandidate: MultiTrackVariationEngineCandidate | null;
  scores: MultiTrackVariationEngineScore[];
  risks: MultiTrackVariationEngineRisk[];
  decisions: MultiTrackVariationEngineDecision[];
  editPlans: MultiTrackVariationEngineEditPlan[];
  renderPlans: MultiTrackVariationEngineRenderPlan[];
  comparisons: MultiTrackVariationEngineComparison[];
};

export type MultiTrackVariationEngineVersionRanking = {
  versionId: MultiTrackVariationEngineVersionId;
  sourceTitle: string;
  candidateCount: number;
  averageScore: number;
  strongestCandidateTitle: string;
  readinessStatus: MultiTrackVariationEngineReadinessStatus;
};

export type MultiTrackVariationEngineValidationResult = {
  isValid: boolean;
  readyCount: number;
  reviewCount: number;
  futureCount: number;
  blockedCount: number;
  messages: string[];
};

export type MultiTrackVariationEngineFilter = {
  searchText: string;
  variationKind: MultiTrackVariationEngineVariationKind | "all";
  color: MultiTrackVariationEngineColor | "all";
  confidenceBucket: MultiTrackVariationEngineConfidenceBucket | "all";
  readinessStatus: MultiTrackVariationEngineReadinessStatus | "all";
};