// app/tools/track-matcher/multi-track/wave-form/MultiTrackSectionExtractionEngineTypes.ts

export type MultiTrackSectionExtractionReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackSectionType =
  | "intro"
  | "verse"
  | "pre-chorus"
  | "chorus"
  | "bridge"
  | "outro";

export type MultiTrackExtractedSection = {
  id: string;
  sectionType: MultiTrackSectionType;
  sourceVersion: string;
  sourceCandidate: string;
  confidence: number;
  strongestIdea: string;
  keeperStatus: string;
  detail: string;
};

export type MultiTrackSectionExtractionMetric = {
  label: string;
  value: string | number;
  detail: string;
};

export type MultiTrackSectionExtractionStep = {
  step: string;
  title: string;
  status: MultiTrackSectionExtractionReadiness;
  detail: string;
};

export type MultiTrackSectionExtractionWorkspace = {
  title: string;
  summary: string;
  metrics: MultiTrackSectionExtractionMetric[];
  steps: MultiTrackSectionExtractionStep[];
  sections: MultiTrackExtractedSection[];
};