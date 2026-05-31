import type { MultiTrackDecisionRecord } from "./multiTrackDecisionTypes";
import type { MultiTrackSelectionHistoryItem } from "./multiTrackSelectionHistory";
import type { MultiTrackSessionNote } from "./multiTrackSessionTypes";
import type { MultiTrackStatus } from "../multiTrackTypes";

export type MultiTrackSaveDestination =
  | "project"
  | "library"
  | "metadata"
  | "finder"
  | "export";

export type MultiTrackSaveReadiness = {
  label: string;
  detail: string;
  status: MultiTrackStatus;
};

export type MultiTrackSaveRecordPreview = {
  id: string;
  title: string;
  destination: MultiTrackSaveDestination;
  status: MultiTrackStatus;
  trackASelection: MultiTrackSelectionHistoryItem | null;
  trackBSelection: MultiTrackSelectionHistoryItem | null;
  decision: MultiTrackDecisionRecord;
  notes: MultiTrackSessionNote[];
  readiness: MultiTrackSaveReadiness[];
};

export type MultiTrackSaveRouteOption = {
  destination: MultiTrackSaveDestination;
  label: string;
  detail: string;
  status: MultiTrackStatus;
};