import type {
  MultiTrackStatus,
  TrackWorkspaceKind,
} from "../multiTrackTypes";

export type MultiTrackControllerView =
  | "overview"
  | "tracks"
  | "comparison"
  | "metadata"
  | "timeline"
  | "save"
  | "ai";

export type MultiTrackControllerPanelId =
  | "track-load-routing"
  | "track-slot-hierarchy"
  | "track-a-workspace"
  | "track-b-workspace"
  | "metadata-readiness"
  | "comparison-scoring"
  | "timeline-lanes"
  | "save-record-shape"
  | "ai-routing";

export type MultiTrackControllerTrackSlot = {
  id: "track-a" | "track-b";
  label: TrackWorkspaceKind;
  sourceLabel: string;
  loadedTitle: string;
  readiness: MultiTrackStatus;
};

export type MultiTrackControllerPanelSummary = {
  id: MultiTrackControllerPanelId;
  label: string;
  view: MultiTrackControllerView;
  status: MultiTrackStatus;
  detail: string;
};

export type MultiTrackControllerSnapshot = {
  activeView: MultiTrackControllerView;
  activeTrackSlot: MultiTrackControllerTrackSlot["id"];
  trackSlots: MultiTrackControllerTrackSlot[];
  panelSummaries: MultiTrackControllerPanelSummary[];
};

export type MultiTrackControllerAction =
  | {
      type: "set-view";
      view: MultiTrackControllerView;
    }
  | {
      type: "set-active-track-slot";
      trackSlotId: MultiTrackControllerTrackSlot["id"];
    };