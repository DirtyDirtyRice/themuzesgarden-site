export type MultiTrackEditDecisionReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackEditDecisionChoice =
  | "keep"
  | "edit"
  | "duplicate"
  | "render"
  | "hold"
  | "reject";

export type MultiTrackEditDecisionTargetKind =
  | "hook"
  | "riff"
  | "bass-groove"
  | "drum-pocket"
  | "vocal-phrase"
  | "melody"
  | "hybrid-section";

export type MultiTrackEditDecisionVersionId =
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

export type MultiTrackEditDecisionColor =
  | "white"
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "orange"
  | "red"
  | "pink";

export type MultiTrackEditDecisionConfidenceBucket =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "blocked";

export type MultiTrackEditDecisionRiskKind =
  | "missing-audio"
  | "missing-extraction"
  | "weak-match"
  | "bad-loop"
  | "tail-risk"
  | "stem-bleed"
  | "manual-review"
  | "future-engine";

export type MultiTrackEditDecisionTimeRange = {
  startSeconds: number;
  endSeconds: number;
  label: string;
};

export type MultiTrackEditDecisionCandidate = {
  id: string;
  title: string;
  versionId: MultiTrackEditDecisionVersionId;
  targetKind: MultiTrackEditDecisionTargetKind;
  color: MultiTrackEditDecisionColor;
  timeRange: MultiTrackEditDecisionTimeRange;
  summary: string;
  confidenceBucket: MultiTrackEditDecisionConfidenceBucket;
  readinessStatus: MultiTrackEditDecisionReadinessStatus;
};

export type MultiTrackEditDecisionRisk = {
  id: string;
  riskKind: MultiTrackEditDecisionRiskKind;
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
  isBlocking: boolean;
};

export type MultiTrackEditDecisionScore = {
  id: string;
  candidateId: string;
  label: string;
  detail: string;
  value: number;
  confidenceBucket: MultiTrackEditDecisionConfidenceBucket;
};

export type MultiTrackEditDecisionRecord = {
  id: string;
  candidateId: string;
  choice: MultiTrackEditDecisionChoice;
  label: string;
  detail: string;
  reason: string;
  riskIds: string[];
  readinessStatus: MultiTrackEditDecisionReadinessStatus;
};

export type MultiTrackEditDecisionLane = {
  id: string;
  label: string;
  detail: string;
  color: MultiTrackEditDecisionColor;
  decisionIds: string[];
  readinessStatus: MultiTrackEditDecisionReadinessStatus;
};

export type MultiTrackEditDecisionWorkspaceState = {
  id: string;
  title: string;
  description: string;
  candidates: MultiTrackEditDecisionCandidate[];
  scores: MultiTrackEditDecisionScore[];
  risks: MultiTrackEditDecisionRisk[];
  decisions: MultiTrackEditDecisionRecord[];
  lanes: MultiTrackEditDecisionLane[];
  activeDecisionId: string;
  readinessStatus: MultiTrackEditDecisionReadinessStatus;
  guardrailNotes: string[];
};

export type MultiTrackEditDecisionSummary = {
  decisionId: string;
  candidateTitle: string;
  choice: MultiTrackEditDecisionChoice;
  targetKind: MultiTrackEditDecisionTargetKind;
  color: MultiTrackEditDecisionColor;
  averageScore: number;
  readinessStatus: MultiTrackEditDecisionReadinessStatus;
};

export type MultiTrackEditDecisionReviewPacket = {
  activeDecision: MultiTrackEditDecisionRecord | null;
  candidate: MultiTrackEditDecisionCandidate | null;
  scores: MultiTrackEditDecisionScore[];
  risks: MultiTrackEditDecisionRisk[];
};

export type MultiTrackEditDecisionValidationResult = {
  isValid: boolean;
  readyCount: number;
  reviewCount: number;
  futureCount: number;
  blockedCount: number;
  messages: string[];
};