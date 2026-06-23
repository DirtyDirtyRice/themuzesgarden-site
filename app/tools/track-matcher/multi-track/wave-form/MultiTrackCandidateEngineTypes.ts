export type MultiTrackCandidateReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackCandidateTier =
  | "elite"
  | "strong"
  | "supporting"
  | "experimental";

export type MultiTrackCandidateSource =
  | "recurring-riff"
  | "riff-frequency"
  | "strongest-idea"
  | "arrangement"
  | "hybrid"
  | "keeper-bank"
  | "manual";

export type MultiTrackCandidateSection = {
  label: string;
  versionTitle: string;
  source: MultiTrackCandidateSource;
  riffOrIdea: string;
  confidenceScore: number;
  detail: string;
};

export type MultiTrackCandidate = {
  id: string;
  title: string;
  tier: MultiTrackCandidateTier;
  readiness: MultiTrackCandidateReadiness;
  candidateScore: number;
  buildPurpose: string;
  strongestIdeaLink: string;
  keeperBankStatus: string;
  arrangementStatus: string;
  hybridStatus: string;
  sections: MultiTrackCandidateSection[];
  detail: string;
};

export type MultiTrackCandidateMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackCandidateStep = {
  step: string;
  title: string;
  status: MultiTrackCandidateReadiness;
  detail: string;
};

export type MultiTrackCandidateWorkspace = {
  title: string;
  summary: string;
  metrics: MultiTrackCandidateMetric[];
  steps: MultiTrackCandidateStep[];
  candidates: MultiTrackCandidate[];
};