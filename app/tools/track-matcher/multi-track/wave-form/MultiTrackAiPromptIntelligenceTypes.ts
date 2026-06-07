export type MultiTrackConfidenceReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackConfidenceBucket =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "manual-review"
  | "blocked";

export type MultiTrackConfidenceEvidenceType =
  | "user-confirmed"
  | "metadata-confirmed"
  | "future-analyzer-confirmed"
  | "future-ai-confirmed"
  | "future-dsp-confirmed"
  | "seed-only"
  | "missing-evidence";

export type MultiTrackConfidenceRiskFactor =
  | "missing-metadata"
  | "missing-bpm"
  | "missing-key"
  | "missing-structure"
  | "missing-stem-labels"
  | "missing-user-review"
  | "conflicting-evidence"
  | "unverified-ai-suggestion";

export type MultiTrackConfidenceEscalationRule =
  | "auto-accept"
  | "recommend"
  | "review-required"
  | "manual-approval"
  | "blocked";

export type MultiTrackConfidenceOwner =
  | "user"
  | "manual-review"
  | "future-analyzer"
  | "future-ai"
  | "future-dsp"
  | "future-hybrid-builder";

export type MultiTrackConfidenceLane =
  | "overall"
  | "tempo"
  | "key"
  | "structure"
  | "hook"
  | "melody"
  | "rhythm"
  | "stem"
  | "arrangement"
  | "hybrid"
  | "lineage"
  | "training"
  | "comparison";

export type MultiTrackConfidenceSource = {
  id: string;
  lane: MultiTrackConfidenceLane;
  label: string;
  bucket: MultiTrackConfidenceBucket;
  status: MultiTrackConfidenceReadinessStatus;
  owner: MultiTrackConfidenceOwner;
  score: number;
  currentMeaning: string;
  futureMeaning: string;
  userRule: string;
};

export type MultiTrackConfidenceEvidence = {
  id: string;
  sourceId: string;
  evidenceType: MultiTrackConfidenceEvidenceType;
  label: string;
  detail: string;
  status: MultiTrackConfidenceReadinessStatus;
};

export type MultiTrackConfidenceRisk = {
  id: string;
  sourceId: string;
  riskFactor: MultiTrackConfidenceRiskFactor;
  label: string;
  detail: string;
  escalation: MultiTrackConfidenceEscalationRule;
  status: MultiTrackConfidenceReadinessStatus;
};

export type MultiTrackConfidenceDashboardCard = {
  id: string;
  lane: MultiTrackConfidenceLane;
  title: string;
  bucket: MultiTrackConfidenceBucket;
  score: number;
  status: MultiTrackConfidenceReadinessStatus;
  summary: string;
  nextAction: string;
};

export type MultiTrackConfidenceSafetyRule = {
  id: string;
  label: string;
  rule: string;
  owner: MultiTrackConfidenceOwner;
  status: MultiTrackConfidenceReadinessStatus;
};

export type MultiTrackConfidenceWorkspaceState = {
  title: string;
  description: string;
  sources: MultiTrackConfidenceSource[];
  evidence: MultiTrackConfidenceEvidence[];
  risks: MultiTrackConfidenceRisk[];
  dashboardCards: MultiTrackConfidenceDashboardCard[];
  safetyRules: MultiTrackConfidenceSafetyRule[];
};