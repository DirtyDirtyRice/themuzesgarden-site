import type {
  MultiTrackClipLaneEditTarget,
  MultiTrackClipLaneRenderStatus,
} from "./MultiTrackClipLaneTypes";
import type { MultiTrackRiffGroupColor } from "./MultiTrackRiffGroupTypes";

export type MultiTrackExperimentStatus =
  | "ready"
  | "testing"
  | "keeper"
  | "rejected"
  | "needs-review"
  | "future"
  | "blocked";

export type MultiTrackExperimentSource =
  | "riff-duplicate"
  | "manual"
  | "future-ai"
  | "future-dsp"
  | "future-render"
  | "seed";

export type MultiTrackExperimentKnobKind =
  | "pitch"
  | "timing"
  | "gain"
  | "stretch"
  | "pan-future"
  | "filter-future"
  | "texture-future"
  | "reverse-future"
  | "slice-future";

export type MultiTrackExperimentKnob = {
  id: string;
  label: string;
  kind: MultiTrackExperimentKnobKind;
  value: number;
  unit: string;
  neutralValue: number;
  minValue: number;
  maxValue: number;
  detail: string;
};

export type MultiTrackExperimentLane = {
  id: string;
  label: string;
  laneNumber: number;
  sourceClipId: string;
  sourceLaneId: string;
  riffGroupId: string;
  riffGroupLabel: string;
  color: MultiTrackRiffGroupColor;
  source: MultiTrackExperimentSource;
  status: MultiTrackExperimentStatus;
  renderStatus: MultiTrackClipLaneRenderStatus;
  knobs: MultiTrackExperimentKnob[];
  editTargets: MultiTrackClipLaneEditTarget[];
  selected: boolean;
  locked: boolean;
  notes: string;
};

export type MultiTrackExperimentBank = {
  id: string;
  label: string;
  riffGroupId: string;
  riffGroupLabel: string;
  color: MultiTrackRiffGroupColor;
  sourceClipId: string;
  sourceLaneId: string;
  duplicateCount: number;
  keeperLaneId: string | null;
  lanes: MultiTrackExperimentLane[];
  detail: string;
};

export type MultiTrackExperimentComparePlan = {
  id: string;
  label: string;
  bankId: string;
  laneIds: string[];
  compareTargets: MultiTrackExperimentKnobKind[];
  ready: boolean;
  detail: string;
};

export type MultiTrackExperimentRenderPlan = {
  id: string;
  label: string;
  bankId: string;
  laneIds: string[];
  keeperLaneIds: string[];
  outputLabel: string;
  ready: boolean;
  detail: string;
};

export type MultiTrackExperimentWorkspaceState = {
  id: string;
  label: string;
  summary: string;
  targetKey: string;
  targetBpm: number;
  microEditStepSeconds: number;
  banks: MultiTrackExperimentBank[];
  comparePlans: MultiTrackExperimentComparePlan[];
  renderPlans: MultiTrackExperimentRenderPlan[];
};