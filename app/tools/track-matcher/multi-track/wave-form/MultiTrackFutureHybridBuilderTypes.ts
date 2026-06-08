export type MultiTrackFutureHybridBuilderReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackFutureHybridBuilderSourceRole =
  | "track-a"
  | "track-b"
  | "reference"
  | "stem-source"
  | "section-source"
  | "lineage-source"
  | "arrangement-source"
  | "future-ai-source";

export type MultiTrackFutureHybridBuilderRecipeType =
  | "section-blend"
  | "stem-blend"
  | "tempo-key-blend"
  | "arrangement-remap"
  | "lineage-inspired"
  | "suno-prompt-plan"
  | "third-song-plan"
  | "future-ai-build";

export type MultiTrackFutureHybridBuilderEvidenceSource =
  | "compatibility"
  | "section"
  | "arrangement"
  | "lineage"
  | "stem-ownership"
  | "dsp-ownership"
  | "comparison"
  | "confidence"
  | "ai-prompt"
  | "manual-review"
  | "future-ai";

export type MultiTrackFutureHybridBuilderOutputTarget =
  | "review-notes"
  | "suno-prompt"
  | "hybrid-arrangement"
  | "stem-plan"
  | "mix-plan"
  | "metadata-plan"
  | "future-render"
  | "future-ai-output";

export type MultiTrackFutureHybridBuilderRisk =
  | "missing-track-a"
  | "missing-track-b"
  | "missing-compatibility"
  | "missing-confidence"
  | "missing-section-map"
  | "missing-stem-map"
  | "missing-key-map"
  | "missing-lineage"
  | "manual-review-required"
  | "future-only";

export type MultiTrackFutureHybridBuilderCandidate = {
  id: string;
  title: string;
  sourceRole: MultiTrackFutureHybridBuilderSourceRole;
  readinessStatus: MultiTrackFutureHybridBuilderReadinessStatus;
  evidenceSource: MultiTrackFutureHybridBuilderEvidenceSource;
  strengthLabel: string;
  summary: string;
  usableFor: MultiTrackFutureHybridBuilderOutputTarget[];
  risks: MultiTrackFutureHybridBuilderRisk[];
};

export type MultiTrackFutureHybridBuilderRecipeStep = {
  id: string;
  orderLabel: string;
  title: string;
  recipeType: MultiTrackFutureHybridBuilderRecipeType;
  readinessStatus: MultiTrackFutureHybridBuilderReadinessStatus;
  candidateIds: string[];
  evidenceSources: MultiTrackFutureHybridBuilderEvidenceSource[];
  instruction: string;
  reviewNote: string;
  risks: MultiTrackFutureHybridBuilderRisk[];
};

export type MultiTrackFutureHybridBuilderLane = {
  id: string;
  title: string;
  description: string;
  status: MultiTrackFutureHybridBuilderReadinessStatus;
  outputTarget: MultiTrackFutureHybridBuilderOutputTarget;
  candidateIds: string[];
  recipeStepIds: string[];
  reviewGoal: string;
};

export type MultiTrackFutureHybridBuilderChecklistItem = {
  id: string;
  label: string;
  status: MultiTrackFutureHybridBuilderReadinessStatus;
  detail: string;
};

export type MultiTrackFutureHybridBuilderWorkspaceState = {
  title: string;
  description: string;
  status: MultiTrackFutureHybridBuilderReadinessStatus;
  candidates: MultiTrackFutureHybridBuilderCandidate[];
  recipeSteps: MultiTrackFutureHybridBuilderRecipeStep[];
  lanes: MultiTrackFutureHybridBuilderLane[];
  checklist: MultiTrackFutureHybridBuilderChecklistItem[];
};