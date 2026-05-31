import type {
  MultiTrackControllerPanelId,
  MultiTrackControllerView,
} from "./multiTrackControllerTypes";
import type { MultiTrackStatus } from "../multiTrackTypes";

export type MultiTrackWorkspaceRegistryItem = {
  id: MultiTrackControllerPanelId;
  label: string;
  view: MultiTrackControllerView;
  status: MultiTrackStatus;
  detail: string;
};

export type MultiTrackWorkspaceRegistryGroup = {
  label: string;
  items: MultiTrackWorkspaceRegistryItem[];
};