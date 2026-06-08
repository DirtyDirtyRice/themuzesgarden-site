import type {
  MultiTrackRiffGroupColor,
  MultiTrackRiffGroupMatchReason,
  MultiTrackRiffGroupRisk,
  MultiTrackRiffGroupStatus,
} from "./MultiTrackRiffGroupTypes";

export type MultiTrackSimilarityStatus =
  | "match"
  | "strong"
  | "review"
  | "weak"
  | "blocked"
  | "future";

export type MultiTrackSimilaritySource =
  | "manual"
  | "seed"
  | "future-waveform"
  | "future-transient"
  | "future-pitch-contour"
  | "future-rhythm"
  | "future-ai";

export type MultiTrackSimilarityComparisonKind =
  | "riff-to-riff"
  | "riff-to-family"
  | "track-to-track"
  | "experiment-to-source"
  | "future-auto-scan";

export type MultiTrackSimilarityFeature =
  | "melodic-contour"
  | "note-set"
  | "rhythm-shape"
  | "timing-window"
  | "phrase-start"
  | "phrase-ending"
  | "chord-function"
  | "energy-shape"
  | "vocal-memory"
  | "instrument-memory"
  | "manual-ear-confirmed";

export type MultiTrackSimilarityDecision =
  | "same-family"
  | "probable-family"
  | "needs-listening"
  | "different-family"
  | "blocked-by-normalization"
  | "future-detection";

export type MultiTrackSimilarityFeatureScore = {
  id: string;
  feature: MultiTrackSimilarityFeature;
  label: string;
  scorePercent: number;
  weight: number;
  detail: string;
};

export type MultiTrackSimilarityCandidate = {
  id: string;
  label: string;
  comparisonKind: MultiTrackSimilarityComparisonKind;
  source: MultiTrackSimilaritySource;
  status: MultiTrackSimilarityStatus;
  decision: MultiTrackSimilarityDecision;
  riffGroupId: string;
  riffGroupLabel: string;
  color: MultiTrackRiffGroupColor;
  sourceInstanceId: string;
  candidateInstanceId: string;
  sourceTrackLabel: string;
  candidateTrackLabel: string;
  sourceStartSeconds: number;
  candidateStartSeconds: number;
  timingDriftSeconds: number;
  noteMatchPercent: number;
  rhythmMatchPercent: number;
  contourMatchPercent: number;
  energyMatchPercent: number;
  totalSimilarityPercent: number;
  confidencePercent: number;
  featureScores: MultiTrackSimilarityFeatureScore[];
  matchReasons: MultiTrackRiffGroupMatchReason[];
  risks: MultiTrackRiffGroupRisk[];
  detail: string;
};

export type MultiTrackSimilarityThresholds = {
  monsterMatchPercent: number;
  sameFamilyPercent: number;
  reviewPercent: number;
  weakPercent: number;
  maxTimingDriftSeconds: number;
  maxPitchDriftSemitones: number;
  minimumNoteMatchPercent: number;
  minimumRhythmMatchPercent: number;
};

export type MultiTrackSimilarityScanPlan = {
  id: string;
  label: string;
  status: MultiTrackRiffGroupStatus;
  source: MultiTrackSimilaritySource;
  targetTrackCount: number;
  scannedTrackCount: number;
  candidateCount: number;
  acceptedCount: number;
  reviewCount: number;
  rejectedCount: number;
  detail: string;
};

export type MultiTrackSimilarityFamilySummary = {
  id: string;
  riffGroupId: string;
  riffGroupLabel: string;
  color: MultiTrackRiffGroupColor;
  candidateCount: number;
  acceptedCount: number;
  reviewCount: number;
  averageSimilarityPercent: number;
  averageConfidencePercent: number;
  maxTimingDriftSeconds: number;
  detail: string;
};

export type MultiTrackSimilarityWorkspaceState = {
  id: string;
  label: string;
  summary: string;
  targetKey: string;
  targetBpm: number;
  thresholds: MultiTrackSimilarityThresholds;
  scanPlans: MultiTrackSimilarityScanPlan[];
  candidates: MultiTrackSimilarityCandidate[];
};