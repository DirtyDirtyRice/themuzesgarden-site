// app/tools/track-matcher/multi-track/wave-form/MultiTrackSectionSurvivorEngineTypes.ts

export type MultiTrackSectionSurvivorReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackSectionSurvivorVerdict =
  | "survivor"
  | "contender"
  | "supporting"
  | "rejected";

export type MultiTrackSectionSurvivorEntry = {
  id: string;
  sectionType: string;
  strongestIdea: string;
  sourceVersion: string;
  sourceCandidate: string;
  verdict: MultiTrackSectionSurvivorVerdict;
  confidence: number;
  survivalScore: number;
  detail: string;
};

export type MultiTrackSectionSurvivorMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackSectionSurvivorStep = {
  step: string;
  title: string;
  status: MultiTrackSectionSurvivorReadiness;
  detail: string;
};

export type MultiTrackSectionSurvivorWorkspace = {
  title: string;
  summary: string;
  metrics: MultiTrackSectionSurvivorMetric[];
  steps: MultiTrackSectionSurvivorStep[];
  survivors: MultiTrackSectionSurvivorEntry[];
};