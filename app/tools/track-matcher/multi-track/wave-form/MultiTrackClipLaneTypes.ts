import type {
  MultiTrackRiffGroupColor,
  MultiTrackRiffGroupEditMode,
  MultiTrackRiffGroupLaneMode,
  MultiTrackRiffGroupStatus,
  MultiTrackRiffTimeRange,
} from "./MultiTrackRiffGroupTypes";

export type MultiTrackClipLaneStatus =
  | "ready"
  | "needs-review"
  | "empty"
  | "editing"
  | "experiment"
  | "future"
  | "blocked";

export type MultiTrackClipLaneSource =
  | "riff-group"
  | "source-track"
  | "manual-copy"
  | "experiment-duplicate"
  | "future-render"
  | "future-detector"
  | "seed";

export type MultiTrackClipLaneClipRole =
  | "original"
  | "extracted-riff"
  | "group-copy"
  | "experiment-copy"
  | "render-candidate"
  | "review-copy"
  | "future-ai-choice";

export type MultiTrackClipLaneEditTarget =
  | "trim-start"
  | "trim-end"
  | "nudge"
  | "gain"
  | "mute"
  | "solo"
  | "pitch"
  | "stretch"
  | "reverse-future"
  | "filter-future"
  | "texture-future";

export type MultiTrackClipLaneRenderStatus =
  | "not-ready"
  | "preview-ready"
  | "render-ready"
  | "keeper"
  | "rejected"
  | "future";

export type MultiTrackClipLaneClip = {
  id: string;
  laneId: string;
  sourceInstanceId: string;
  sourceTrackId: string;
  sourceTrackLabel: string;
  riffGroupId: string;
  riffGroupLabel: string;
  color: MultiTrackRiffGroupColor;
  role: MultiTrackClipLaneClipRole;
  status: MultiTrackClipLaneStatus;
  renderStatus: MultiTrackClipLaneRenderStatus;
  sourceTimeRange: MultiTrackRiffTimeRange;
  laneTimeRange: MultiTrackRiffTimeRange;
  nudgeSeconds: number;
  gainDb: number;
  pitchShiftSemitones: number;
  stretchPercent: number;
  muted: boolean;
  selected: boolean;
  locked: boolean;
  notes: string;
};

export type MultiTrackClipLane = {
  id: string;
  label: string;
  laneNumber: number;
  laneMode: MultiTrackRiffGroupLaneMode;
  source: MultiTrackClipLaneSource;
  status: MultiTrackClipLaneStatus;
  riffGroupId: string;
  riffGroupLabel: string;
  color: MultiTrackRiffGroupColor;
  editMode: MultiTrackRiffGroupEditMode;
  targetKey: string;
  targetBpm: number;
  microEditStepSeconds: number;
  clips: MultiTrackClipLaneClip[];
  detail: string;
};

export type MultiTrackClipLaneSelection = {
  id: string;
  label: string;
  laneIds: string[];
  clipIds: string[];
  editTargets: MultiTrackClipLaneEditTarget[];
  microEditStepSeconds: number;
  detail: string;
};

export type MultiTrackClipLaneDuplicatePlan = {
  id: string;
  label: string;
  sourceClipId: string;
  sourceLaneId: string;
  duplicateCount: number;
  destinationLanePrefix: string;
  knobTargets: MultiTrackClipLaneEditTarget[];
  ready: boolean;
  detail: string;
};

export type MultiTrackClipLaneRenderPlan = {
  id: string;
  label: string;
  laneIds: string[];
  clipIds: string[];
  renderStatus: MultiTrackClipLaneRenderStatus;
  outputLabel: string;
  ready: boolean;
  detail: string;
};

export type MultiTrackClipLaneWorkspaceState = {
  id: string;
  label: string;
  summary: string;
  targetKey: string;
  targetBpm: number;
  microEditStepSeconds: number;
  laneCountTarget: number;
  lanes: MultiTrackClipLane[];
  selections: MultiTrackClipLaneSelection[];
  duplicatePlans: MultiTrackClipLaneDuplicatePlan[];
  renderPlans: MultiTrackClipLaneRenderPlan[];
};

export type MultiTrackClipLaneMetrics = {
  laneCount: number;
  clipCount: number;
  selectedClipCount: number;
  readyClipCount: number;
  reviewClipCount: number;
  experimentClipCount: number;
  renderReadyClipCount: number;
  keeperClipCount: number;
};