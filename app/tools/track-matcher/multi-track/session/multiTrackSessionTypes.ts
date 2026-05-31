import type {
  MultiTrackControllerPanelId,
  MultiTrackControllerTrackSlot,
  MultiTrackControllerView,
} from "../controller/multiTrackControllerTypes";
import type { MultiTrackStatus } from "../multiTrackTypes";

export type MultiTrackSessionNoteKind =
  | "listening"
  | "arrangement"
  | "decision"
  | "metadata"
  | "timeline"
  | "ai";

export type MultiTrackSessionNote = {
  id: string;
  kind: MultiTrackSessionNoteKind;
  title: string;
  body: string;
  status: MultiTrackStatus;
};

export type MultiTrackSessionRouteStatus = {
  panelId: MultiTrackControllerPanelId;
  view: MultiTrackControllerView;
  status: MultiTrackStatus;
  routeLabel: string;
  detail: string;
};

export type MultiTrackSessionHealth = {
  label: string;
  detail: string;
  status: MultiTrackStatus;
};

export type MultiTrackSessionTrackSelection = {
  trackSlotId: MultiTrackControllerTrackSlot["id"];
  selectedTitle: string;
  selectedSource: string;
  status: MultiTrackStatus;
};

export type MultiTrackSessionFoundation = {
  health: MultiTrackSessionHealth;
  notes: MultiTrackSessionNote[];
  routes: MultiTrackSessionRouteStatus[];
  trackSelections: MultiTrackSessionTrackSelection[];
};