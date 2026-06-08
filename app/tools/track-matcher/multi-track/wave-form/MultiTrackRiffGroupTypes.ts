export type MultiTrackRiffGroupStatus =
  | "ready"
  | "needs-review"
  | "manual"
  | "future"
  | "blocked";

export type MultiTrackRiffGroupSource =
  | "suno-version"
  | "user-marked"
  | "future-detector"
  | "future-ai"
  | "future-dsp"
  | "seed";

export type MultiTrackRiffGroupColor =
  | "blue"
  | "red"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "pink"
  | "cyan"
  | "white";

export type MultiTrackRiffGroupEditMode =
  | "single"
  | "selected"
  | "group"
  | "all-matching"
  | "experiment";

export type MultiTrackRiffGroupLaneMode =
  | "source-track"
  | "riff-family-lane"
  | "experiment-lane"
  | "render-lane";

export type MultiTrackRiffGroupMatchReason =
  | "same-melodic-shape"
  | "same-rhythm-shape"
  | "same-hook-memory"
  | "same-start-gesture"
  | "same-ending-gesture"
  | "same-chord-function"
  | "same-vocal-phrase"
  | "same-instrumental-riff"
  | "manual-family"
  | "future-ai-family";

export type MultiTrackRiffGroupRisk =
  | "timing-drift"
  | "note-difference"
  | "key-not-normalized"
  | "bpm-not-normalized"
  | "weak-confidence"
  | "overlap-conflict"
  | "needs-listening"
  | "future-detection-only";

export type MultiTrackRiffTimeRange = {
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  startLabel: string;
  endLabel: string;
};

export type MultiTrackRiffSourceTrack = {
  id: string;
  label: string;
  sunoVersionLabel: string;
  sourceTrackNumber: number;
  originalKey: string;
  targetKey: string;
  originalBpm: number;
  targetBpm: number;
  normalized: boolean;
};

export type MultiTrackRiffInstance = {
  id: string;
  riffGroupId: string;
  sourceTrackId: string;
  sourceTrackLabel: string;
  source: MultiTrackRiffGroupSource;
  color: MultiTrackRiffGroupColor;
  status: MultiTrackRiffGroupStatus;
  timeRange: MultiTrackRiffTimeRange;
  similarityPercent: number;
  noteMatchPercent: number;
  rhythmMatchPercent: number;
  timingDriftSeconds: number;
  pitchDriftSemitones: number;
  matchReasons: MultiTrackRiffGroupMatchReason[];
  risks: MultiTrackRiffGroupRisk[];
  notes: string;
};

export type MultiTrackRiffGroup = {
  id: string;
  label: string;
  color: MultiTrackRiffGroupColor;
  status: MultiTrackRiffGroupStatus;
  source: MultiTrackRiffGroupSource;
  targetKey: string;
  targetBpm: number;
  familyConfidencePercent: number;
  minimumSimilarityPercent: number;
  description: string;
  instances: MultiTrackRiffInstance[];
};

export type MultiTrackRiffExtractPlan = {
  id: string;
  riffGroupId: string;
  label: string;
  laneMode: MultiTrackRiffGroupLaneMode;
  destinationLaneLabel: string;
  includeCount: number;
  readyCount: number;
  reviewCount: number;
  detail: string;
};

export type MultiTrackRiffEditPlan = {
  id: string;
  riffGroupId: string;
  label: string;
  editMode: MultiTrackRiffGroupEditMode;
  selectedInstanceIds: string[];
  editableFields: string[];
  microEditStepSeconds: number;
  detail: string;
};

export type MultiTrackRiffExperimentPlan = {
  id: string;
  riffGroupId: string;
  sourceInstanceId: string;
  label: string;
  duplicateCount: number;
  destinationLanePrefix: string;
  knobTargets: string[];
  detail: string;
};

export type MultiTrackRiffGroupWorkspaceState = {
  id: string;
  label: string;
  summary: string;
  targetTrackCount: number;
  loadedTrackCount: number;
  targetKey: string;
  targetBpm: number;
  microEditStepSeconds: number;
  groups: MultiTrackRiffGroup[];
  extractPlans: MultiTrackRiffExtractPlan[];
  editPlans: MultiTrackRiffEditPlan[];
  experimentPlans: MultiTrackRiffExperimentPlan[];
};