import type {
  MultiTrackEngineSourceKind,
  MultiTrackEngineTrackState,
} from "../../engine/multiTrackEngineTypes";

export type MultiTrackSourceWorkspaceStatus =
  | "available"
  | "coming-soon"
  | "connected"
  | "recommended";

export type MultiTrackSourceWorkspaceItem = {
  id: string;
  label: string;
  sourceKind: MultiTrackEngineSourceKind;
  status: MultiTrackSourceWorkspaceStatus;
  description: string;
  recommendedFor: string;
  demoPatch: Partial<MultiTrackEngineTrackState>;
};

export type MultiTrackSourceWorkspaceRecommendation = {
  title: string;
  detail: string;
  actionLabel: string;
};