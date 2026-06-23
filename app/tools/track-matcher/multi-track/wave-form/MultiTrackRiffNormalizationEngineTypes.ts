export type MultiTrackRiffNormalizationReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackRiffNormalizationMode =
  | "tempo-only"
  | "key-only"
  | "tempo-and-key"
  | "reference-version"
  | "manual";

export type MultiTrackRiffNormalizationScope =
  | "riff"
  | "phrase"
  | "section"
  | "full-version";

export type MultiTrackRiffNormalizationRisk =
  | "safe"
  | "watch-artifacts"
  | "feel-change"
  | "manual-check";

export type MultiTrackRiffNormalizationTarget = {
  label: string;
  value: string;
  detail: string;
};

export type MultiTrackRiffNormalizationVersion = {
  id: string;
  title: string;
  originalBpm: number;
  originalKey: string;
  analysisBpm: number;
  analysisKey: string;
  bpmShift: string;
  keyShift: string;
  mode: MultiTrackRiffNormalizationMode;
  scope: MultiTrackRiffNormalizationScope;
  readiness: MultiTrackRiffNormalizationReadiness;
  risk: MultiTrackRiffNormalizationRisk;
  detail: string;
};

export type MultiTrackRiffNormalizationStep = {
  step: string;
  title: string;
  status: MultiTrackRiffNormalizationReadiness;
  detail: string;
};

export type MultiTrackRiffNormalizationReminder = {
  title: string;
  body: string;
};

export type MultiTrackRiffNormalizationMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackRiffNormalizationWorkspace = {
  title: string;
  summary: string;
  analysisTarget: MultiTrackRiffNormalizationTarget;
  metrics: MultiTrackRiffNormalizationMetric[];
  steps: MultiTrackRiffNormalizationStep[];
  versions: MultiTrackRiffNormalizationVersion[];
  reminders: MultiTrackRiffNormalizationReminder[];
};