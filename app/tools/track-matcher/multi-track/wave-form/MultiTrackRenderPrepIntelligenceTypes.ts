export type MultiTrackRenderPrepReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackRenderPrepTarget =
  | "wav-export"
  | "mp3-export"
  | "stem-bounce"
  | "hybrid-preview"
  | "suno-reference"
  | "metadata-package"
  | "project-package"
  | "future-render";

export type MultiTrackRenderPrepSource =
  | "track-a"
  | "track-b"
  | "stem-plan"
  | "hybrid-builder"
  | "compatibility"
  | "arrangement"
  | "section"
  | "lineage"
  | "confidence"
  | "manual-review"
  | "future-ai";

export type MultiTrackRenderPrepFormat =
  | "wav"
  | "mp3"
  | "aiff"
  | "flac"
  | "json"
  | "text"
  | "future";

export type MultiTrackRenderPrepRisk =
  | "missing-track"
  | "missing-stem"
  | "missing-format"
  | "missing-confidence"
  | "missing-metadata"
  | "unverified-hybrid-plan"
  | "manual-review-required"
  | "future-only";

export type MultiTrackRenderPrepItem = {
  id: string;
  title: string;
  target: MultiTrackRenderPrepTarget;
  source: MultiTrackRenderPrepSource;
  format: MultiTrackRenderPrepFormat;
  readinessStatus: MultiTrackRenderPrepReadinessStatus;
  priorityLabel: string;
  summary: string;
  reviewNote: string;
  risks: MultiTrackRenderPrepRisk[];
};

export type MultiTrackRenderPrepLane = {
  id: string;
  title: string;
  description: string;
  status: MultiTrackRenderPrepReadinessStatus;
  itemIds: string[];
  outputGoal: string;
};

export type MultiTrackRenderPrepChecklistItem = {
  id: string;
  label: string;
  status: MultiTrackRenderPrepReadinessStatus;
  detail: string;
};

export type MultiTrackRenderPrepWorkspaceState = {
  title: string;
  description: string;
  status: MultiTrackRenderPrepReadinessStatus;
  items: MultiTrackRenderPrepItem[];
  lanes: MultiTrackRenderPrepLane[];
  checklist: MultiTrackRenderPrepChecklistItem[];
};