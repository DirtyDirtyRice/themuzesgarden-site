// app/tools/track-matcher/multi-track/wave-form/MultiTrackCandidateRankingEngineTypes.ts

export type MultiTrackCandidateRankingReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackCandidateRankingTier =
  | "elite"
  | "strong"
  | "supporting"
  | "experimental";

export type MultiTrackCandidateRankingEntry = {
  id: string;
  title: string;
  rank: number;
  score: number;
  tier: MultiTrackCandidateRankingTier;
  readiness: MultiTrackCandidateRankingReadiness;
  strongestIdea: string;
  evidenceSources: number;
  confidence: number;
  promotionReady: boolean;
  detail: string;
};

export type MultiTrackCandidateRankingMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackCandidateRankingStep = {
  step: string;
  title: string;
  status: MultiTrackCandidateRankingReadiness;
  detail: string;
};

export type MultiTrackCandidateRankingWorkspace = {
  title: string;
  summary: string;
  metrics: MultiTrackCandidateRankingMetric[];
  steps: MultiTrackCandidateRankingStep[];
  rankings: MultiTrackCandidateRankingEntry[];
};