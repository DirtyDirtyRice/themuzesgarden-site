// app/tools/track-matcher/multi-track/wave-form/MultiTrackCandidateComparisonEngineTypes.ts

export type MultiTrackCandidateComparisonReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackCandidateComparisonVerdict =
  | "winner"
  | "contender"
  | "close-call"
  | "needs-review";

export type MultiTrackCandidateComparisonRow = {
  category: string;
  candidateA: string | number;
  candidateB: string | number;
  winner: string;
  detail: string;
};

export type MultiTrackCandidateComparison = {
  id: string;
  title: string;
  verdict: MultiTrackCandidateComparisonVerdict;
  readiness: MultiTrackCandidateComparisonReadiness;
  winner: string;
  confidence: number;
  detail: string;
  rows: MultiTrackCandidateComparisonRow[];
};

export type MultiTrackCandidateComparisonMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackCandidateComparisonStep = {
  step: string;
  title: string;
  status: MultiTrackCandidateComparisonReadiness;
  detail: string;
};

export type MultiTrackCandidateComparisonWorkspace = {
  title: string;
  summary: string;
  metrics: MultiTrackCandidateComparisonMetric[];
  steps: MultiTrackCandidateComparisonStep[];
  comparisons: MultiTrackCandidateComparison[];
};