import type { MultiTrackStatus } from "../multiTrackTypes";
import type { MultiTrackSessionTrackSelection } from "../session/multiTrackSessionTypes";

export type MultiTrackAdapterSource =
  | "finder"
  | "library"
  | "project"
  | "upload"
  | "metadata"
  | "unknown";

export type MultiTrackAdapterTrackCandidate = {
  id: string;
  title: string;
  source: MultiTrackAdapterSource;
  sourceLabel: string;
  detail: string;
  status: MultiTrackStatus;
};

export type MultiTrackAdapterTrackSelectionInput = {
  trackSlotId: MultiTrackSessionTrackSelection["trackSlotId"];
  candidate: MultiTrackAdapterTrackCandidate;
};

export type MultiTrackAdapterResult = {
  selection: MultiTrackSessionTrackSelection;
  message: string;
};