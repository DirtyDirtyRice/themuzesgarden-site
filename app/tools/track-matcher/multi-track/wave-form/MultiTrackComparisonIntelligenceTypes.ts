export type MultiTrackComparisonSourceId = "track-a" | "track-b" | "both";

export type MultiTrackComparisonReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackComparisonConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "manual-required";

export type MultiTrackComparisonLane =
  | "tempo"
  | "key"
  | "structure"
  | "hook"
  | "melody"
  | "rhythm"
  | "energy"
  | "stem"
  | "arrangement"
  | "lineage";

export type MultiTrackComparisonDecisionOwner =
  | "user"
  | "future-ai"
  | "future-analyzer"
  | "manual-review";

export type MultiTrackComparisonMetric = {
  id: string;
  lane: MultiTrackComparisonLane;
  label: string;
  sourceId: MultiTrackComparisonSourceId;
  status: MultiTrackComparisonReadinessStatus;
  confidence: MultiTrackComparisonConfidenceLevel;
  currentMeaning: string;
  futureMeaning: string;
};

export type MultiTrackComparisonFinding = {
  id: string;
  lane: MultiTrackComparisonLane;
  title: string;
  status: MultiTrackComparisonReadinessStatus;
  confidence: MultiTrackComparisonConfidenceLevel;
  trackAObservation: string;
  trackBObservation: string;
  comparisonMeaning: string;
  requiredConfirmation: string;
};

export type MultiTrackComparisonWorkflowStep = {
  id: string;
  label: string;
  owner: MultiTrackComparisonDecisionOwner;
  status: MultiTrackComparisonReadinessStatus;
  purpose: string;
  blockedUntil: string;
};

export type MultiTrackComparisonGuardrail = {
  id: string;
  label: string;
  rule: string;
  status: MultiTrackComparisonReadinessStatus;
};

export type MultiTrackComparisonWorkspaceState = {
  title: string;
  description: string;
  metrics: MultiTrackComparisonMetric[];
  findings: MultiTrackComparisonFinding[];
  workflowSteps: MultiTrackComparisonWorkflowStep[];
  guardrails: MultiTrackComparisonGuardrail[];
};