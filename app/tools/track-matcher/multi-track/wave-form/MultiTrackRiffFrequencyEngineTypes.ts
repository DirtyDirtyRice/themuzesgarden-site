export type MultiTrackRiffFrequencyReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackRiffFrequencyTier =
  | "elite"
  | "high"
  | "medium"
  | "low";

export type MultiTrackRiffFrequencyRecord = {
  id: string;
  label: string;
  usageCount: number;
  versionCoverage: number;
  sectionCoverage: number;
  confidenceScore: number;
  frequencyScore: number;
  readiness: MultiTrackRiffFrequencyReadiness;
  tier: MultiTrackRiffFrequencyTier;
  keeperBankStatus: string;
  strongestIdeaStatus: string;
  detail: string;
};

export type MultiTrackRiffFrequencyMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackRiffFrequencyStep = {
  step: string;
  title: string;
  status: MultiTrackRiffFrequencyReadiness;
  detail: string;
};

export type MultiTrackRiffFrequencyWorkspace = {
  title: string;
  summary: string;
  metrics: MultiTrackRiffFrequencyMetric[];
  steps: MultiTrackRiffFrequencyStep[];
  records: MultiTrackRiffFrequencyRecord[];
};