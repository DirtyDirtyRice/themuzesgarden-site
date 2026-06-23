// app/tools/track-matcher/multi-track/wave-form/MultiTrackBuildDecisionEngineTypes.ts

export type MultiTrackBuildDecisionReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackBuildDecisionOutcome =
  | "promote"
  | "hold"
  | "review"
  | "reject";

export type MultiTrackBuildDecisionEvidence = {
  label: string;
  value: string;
  confidence: number;
  detail: string;
};

export type MultiTrackBuildDecisionCandidate = {
  id: string;
  title: string;
  outcome: MultiTrackBuildDecisionOutcome;
  readiness: MultiTrackBuildDecisionReadiness;
  finalScore: number;
  strongestIdea: string;
  recurringRiffSupport: number;
  frequencySupport: number;
  arrangementSupport: number;
  hybridSupport: number;
  keeperSupport: number;
  survivorSupport: number;
  confidence: number;
  detail: string;
  evidence: MultiTrackBuildDecisionEvidence[];
};

export type MultiTrackBuildDecisionMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackBuildDecisionStep = {
  step: string;
  title: string;
  status: MultiTrackBuildDecisionReadiness;
  detail: string;
};

export type MultiTrackBuildDecisionWorkspace = {
  title: string;
  summary: string;
  metrics: MultiTrackBuildDecisionMetric[];
  steps: MultiTrackBuildDecisionStep[];
  decisions: MultiTrackBuildDecisionCandidate[];
};