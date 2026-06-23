export type MultiTrackRecurringRiffReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackRecurringRiffStrength =
  | "dominant"
  | "strong"
  | "moderate"
  | "weak";

export type MultiTrackRecurringRiffMatchType =
  | "exact-shape"
  | "tempo-shifted"
  | "key-shifted"
  | "rhythm-related"
  | "melody-related"
  | "manual-review";

export type MultiTrackRecurringRiffUsage = {
  versionTitle: string;
  originalBpm: number;
  originalKey: string;
  normalizedBpm: number;
  normalizedKey: string;
  section: string;
  matchType: MultiTrackRecurringRiffMatchType;
  detail: string;
};

export type MultiTrackRecurringRiff = {
  id: string;
  label: string;
  description: string;
  usageCount: number;
  versionCoverage: string;
  strength: MultiTrackRecurringRiffStrength;
  readiness: MultiTrackRecurringRiffReadiness;
  keeperBankStatus: string;
  strongestIdeaStatus: string;
  uses: MultiTrackRecurringRiffUsage[];
};

export type MultiTrackRecurringRiffStep = {
  step: string;
  title: string;
  status: MultiTrackRecurringRiffReadiness;
  detail: string;
};

export type MultiTrackRecurringRiffMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackRecurringRiffWorkspace = {
  title: string;
  summary: string;
  metrics: MultiTrackRecurringRiffMetric[];
  steps: MultiTrackRecurringRiffStep[];
  riffs: MultiTrackRecurringRiff[];
};