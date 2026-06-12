export type MultiTrackRiffColorReadiness =
  | "ready"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackRiffColorStatus =
  | "assigned"
  | "suggested"
  | "review"
  | "unassigned"
  | "conflict"
  | "future";

export type MultiTrackRiffColorSource =
  | "manual"
  | "seed"
  | "phrase-matching"
  | "similarity-engine"
  | "riff-grouping"
  | "future-ai"
  | "future-dsp";

export type MultiTrackRiffColorName =
  | "blue"
  | "purple"
  | "green"
  | "yellow"
  | "orange"
  | "pink"
  | "cyan"
  | "white";

export type MultiTrackRiffColorReason =
  | "same-phrase"
  | "same-riff-family"
  | "same-hook-memory"
  | "same-answer-phrase"
  | "same-rhythm-pocket"
  | "same-melodic-contour"
  | "manual-confirmed"
  | "future-detected";

export type MultiTrackRiffColorRisk =
  | "timing-drift"
  | "note-mutation"
  | "weak-match"
  | "color-conflict"
  | "needs-listening"
  | "normalization-needed"
  | "future-only";

export type MultiTrackRiffColorTimeRange = {
  startSecond: number;
  endSecond: number;
  durationSecond: number;
  label: string;
};

export type MultiTrackRiffColorRegion = {
  id: string;
  label: string;
  trackId: string;
  trackLabel: string;
  versionLabel: string;
  phraseId: string;
  source: MultiTrackRiffColorSource;
  readiness: MultiTrackRiffColorReadiness;
  status: MultiTrackRiffColorStatus;
  color: MultiTrackRiffColorName;
  timeRange: MultiTrackRiffColorTimeRange;
  similarityPercent: number;
  confidencePercent: number;
  reasons: MultiTrackRiffColorReason[];
  risks: MultiTrackRiffColorRisk[];
  notes: string;
};

export type MultiTrackRiffColorFamily = {
  id: string;
  label: string;
  color: MultiTrackRiffColorName;
  readiness: MultiTrackRiffColorReadiness;
  status: MultiTrackRiffColorStatus;
  phraseFamilyId: string;
  minimumConfidencePercent: number;
  regions: MultiTrackRiffColorRegion[];
  detail: string;
};

export type MultiTrackRiffColorConflict = {
  id: string;
  label: string;
  regionId: string;
  currentColor: MultiTrackRiffColorName;
  suggestedColor: MultiTrackRiffColorName;
  severity: number;
  resolved: boolean;
  detail: string;
};

export type MultiTrackRiffColorExtractionHint = {
  id: string;
  familyId: string;
  label: string;
  color: MultiTrackRiffColorName;
  regionCount: number;
  readyRegionCount: number;
  destinationLaneLabel: string;
  ready: boolean;
  detail: string;
};

export type MultiTrackRiffColorEngineState = {
  id: string;
  title: string;
  description: string;
  readiness: MultiTrackRiffColorReadiness;
  targetKey: string;
  targetBpm: number;
  families: MultiTrackRiffColorFamily[];
  conflicts: MultiTrackRiffColorConflict[];
  extractionHints: MultiTrackRiffColorExtractionHint[];
  engineNotes: string[];
};