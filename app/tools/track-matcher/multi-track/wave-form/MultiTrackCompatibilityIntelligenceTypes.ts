export type MultiTrackCompatibilityReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackCompatibilityCategory =
  | "tempo"
  | "key"
  | "section"
  | "stem"
  | "arrangement"
  | "energy"
  | "lineage"
  | "confidence"
  | "hybrid"
  | "mix"
  | "future";

export type MultiTrackCompatibilityRating =
  | "excellent"
  | "good"
  | "possible"
  | "weak"
  | "blocked"
  | "unknown"
  | "future";

export type MultiTrackCompatibilityEvidenceSource =
  | "waveform"
  | "statistics"
  | "cue"
  | "marker"
  | "detection"
  | "stem-ownership"
  | "dsp-ownership"
  | "arrangement"
  | "lineage"
  | "section"
  | "comparison"
  | "confidence"
  | "manual-review"
  | "future-ai";

export type MultiTrackCompatibilityUseCase =
  | "a-b-review"
  | "sync-check"
  | "key-check"
  | "section-match"
  | "stem-match"
  | "hybrid-planning"
  | "mashup-planning"
  | "mix-planning"
  | "future-builder";

export type MultiTrackCompatibilityRisk =
  | "missing-track-a"
  | "missing-track-b"
  | "missing-bpm"
  | "missing-key"
  | "missing-section-map"
  | "missing-stem-map"
  | "weak-confidence"
  | "conflicting-evidence"
  | "manual-review-required"
  | "future-only";

export type MultiTrackCompatibilitySignal = {
  id: string;
  label: string;
  category: MultiTrackCompatibilityCategory;
  rating: MultiTrackCompatibilityRating;
  readinessStatus: MultiTrackCompatibilityReadinessStatus;
  evidenceSource: MultiTrackCompatibilityEvidenceSource;
  scoreLabel: string;
  summary: string;
  reviewNote: string;
  risks: MultiTrackCompatibilityRisk[];
};

export type MultiTrackCompatibilityPair = {
  id: string;
  title: string;
  useCase: MultiTrackCompatibilityUseCase;
  readinessStatus: MultiTrackCompatibilityReadinessStatus;
  rating: MultiTrackCompatibilityRating;
  signalIds: string[];
  evidenceSources: MultiTrackCompatibilityEvidenceSource[];
  recommendation: string;
  risks: MultiTrackCompatibilityRisk[];
};

export type MultiTrackCompatibilityLane = {
  id: string;
  title: string;
  description: string;
  status: MultiTrackCompatibilityReadinessStatus;
  useCase: MultiTrackCompatibilityUseCase;
  signalIds: string[];
  pairIds: string[];
  reviewGoal: string;
};

export type MultiTrackCompatibilityChecklistItem = {
  id: string;
  label: string;
  status: MultiTrackCompatibilityReadinessStatus;
  detail: string;
};

export type MultiTrackCompatibilityWorkspaceState = {
  title: string;
  description: string;
  status: MultiTrackCompatibilityReadinessStatus;
  signals: MultiTrackCompatibilitySignal[];
  pairs: MultiTrackCompatibilityPair[];
  lanes: MultiTrackCompatibilityLane[];
  checklist: MultiTrackCompatibilityChecklistItem[];
};