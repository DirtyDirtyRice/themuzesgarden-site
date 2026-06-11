export type MultiTrackExtractionPlanReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackExtractionPlanTargetKind =
  | "hook"
  | "riff"
  | "vocal-phrase"
  | "bass-groove"
  | "drum-pocket"
  | "melody"
  | "transition"
  | "hybrid-section";

export type MultiTrackExtractionPlanActionKind =
  | "mark"
  | "color-code"
  | "trim"
  | "extract"
  | "duplicate"
  | "edit"
  | "render"
  | "hold";

export type MultiTrackExtractionPlanVersionId =
  | "version-01"
  | "version-02"
  | "version-03"
  | "version-04"
  | "version-05"
  | "version-06"
  | "version-07"
  | "version-08"
  | "version-09"
  | "version-10";

export type MultiTrackExtractionPlanColor =
  | "white"
  | "blue"
  | "green"
  | "purple"
  | "yellow"
  | "orange"
  | "red"
  | "pink";

export type MultiTrackExtractionPlanConfidenceBucket =
  | "verified"
  | "strong"
  | "moderate"
  | "weak"
  | "unknown"
  | "blocked";

export type MultiTrackExtractionPlanRiskKind =
  | "missing-audio"
  | "missing-waveform"
  | "bad-edit-window"
  | "tail-cut-risk"
  | "stem-bleed"
  | "tempo-drift"
  | "key-drift"
  | "manual-review"
  | "future-render-engine";

export type MultiTrackExtractionPlanOutputKind =
  | "clip"
  | "loop"
  | "one-shot"
  | "wav-render"
  | "mp3-render"
  | "stem-pack"
  | "future-session";

export type MultiTrackExtractionPlanTimeRange = {
  startSeconds: number;
  endSeconds: number;
  label: string;
};

export type MultiTrackExtractionPlanSourceClip = {
  id: string;
  versionId: MultiTrackExtractionPlanVersionId;
  title: string;
  fileLabel: string;
  bpm: number | null;
  keyLabel: string | null;
  timeRange: MultiTrackExtractionPlanTimeRange;
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
};

export type MultiTrackExtractionPlanRisk = {
  id: string;
  riskKind: MultiTrackExtractionPlanRiskKind;
  label: string;
  detail: string;
  severity: "low" | "medium" | "high";
  isBlocking: boolean;
};

export type MultiTrackExtractionPlanMarker = {
  id: string;
  sourceClipId: string;
  label: string;
  detail: string;
  color: MultiTrackExtractionPlanColor;
  timeRange: MultiTrackExtractionPlanTimeRange;
  confidenceBucket: MultiTrackExtractionPlanConfidenceBucket;
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
};

export type MultiTrackExtractionPlanStep = {
  id: string;
  stepNumber: number;
  actionKind: MultiTrackExtractionPlanActionKind;
  label: string;
  detail: string;
  targetClipId: string;
  markerId: string | null;
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
};

export type MultiTrackExtractionPlanEditInstruction = {
  id: string;
  sourceClipId: string;
  label: string;
  detail: string;
  trimStartSeconds: number;
  trimEndSeconds: number;
  fadeInMs: number;
  fadeOutMs: number;
  duplicateCount: number;
  targetLaneLabel: string;
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
};

export type MultiTrackExtractionPlanRenderInstruction = {
  id: string;
  sourceClipId: string;
  label: string;
  detail: string;
  outputKind: MultiTrackExtractionPlanOutputKind;
  includeTail: boolean;
  normalizeOutput: boolean;
  preserveOriginalPitch: boolean;
  preserveOriginalTempo: boolean;
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
};

export type MultiTrackExtractionPlanTarget = {
  id: string;
  title: string;
  targetKind: MultiTrackExtractionPlanTargetKind;
  color: MultiTrackExtractionPlanColor;
  summary: string;
  sourceClipIds: string[];
  markerIds: string[];
  stepIds: string[];
  editInstructionIds: string[];
  renderInstructionIds: string[];
  riskIds: string[];
  confidenceBucket: MultiTrackExtractionPlanConfidenceBucket;
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
};

export type MultiTrackExtractionPlanLane = {
  id: string;
  label: string;
  detail: string;
  color: MultiTrackExtractionPlanColor;
  targetIds: string[];
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
};

export type MultiTrackExtractionPlanWorkspaceState = {
  id: string;
  title: string;
  description: string;
  sourceClips: MultiTrackExtractionPlanSourceClip[];
  risks: MultiTrackExtractionPlanRisk[];
  markers: MultiTrackExtractionPlanMarker[];
  steps: MultiTrackExtractionPlanStep[];
  editInstructions: MultiTrackExtractionPlanEditInstruction[];
  renderInstructions: MultiTrackExtractionPlanRenderInstruction[];
  targets: MultiTrackExtractionPlanTarget[];
  lanes: MultiTrackExtractionPlanLane[];
  activeTargetId: string;
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
  guardrailNotes: string[];
};

export type MultiTrackExtractionPlanTargetSummary = {
  targetId: string;
  title: string;
  targetKind: MultiTrackExtractionPlanTargetKind;
  color: MultiTrackExtractionPlanColor;
  clipCount: number;
  stepCount: number;
  confidenceBucket: MultiTrackExtractionPlanConfidenceBucket;
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
};

export type MultiTrackExtractionPlanReviewPacket = {
  activeTarget: MultiTrackExtractionPlanTarget | null;
  sourceClips: MultiTrackExtractionPlanSourceClip[];
  markers: MultiTrackExtractionPlanMarker[];
  steps: MultiTrackExtractionPlanStep[];
  editInstructions: MultiTrackExtractionPlanEditInstruction[];
  renderInstructions: MultiTrackExtractionPlanRenderInstruction[];
  risks: MultiTrackExtractionPlanRisk[];
};

export type MultiTrackExtractionPlanVersionCoverage = {
  versionId: MultiTrackExtractionPlanVersionId;
  clipCount: number;
  markerCount: number;
  strongestTargetTitle: string;
  readinessStatus: MultiTrackExtractionPlanReadinessStatus;
};

export type MultiTrackExtractionPlanValidationResult = {
  isValid: boolean;
  readyCount: number;
  reviewCount: number;
  futureCount: number;
  blockedCount: number;
  messages: string[];
};

export type MultiTrackExtractionPlanFilter = {
  searchText: string;
  targetKind: MultiTrackExtractionPlanTargetKind | "all";
  color: MultiTrackExtractionPlanColor | "all";
  confidenceBucket: MultiTrackExtractionPlanConfidenceBucket | "all";
  readinessStatus: MultiTrackExtractionPlanReadinessStatus | "all";
};