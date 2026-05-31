import type { MultiTrackStatus } from "../multiTrackTypes";

export type MultiTrackSelectionSource =
  | "finder"
  | "library"
  | "metadata"
  | "project"
  | "upload";

export type MultiTrackSelectionHistoryItem = {
  id: string;
  trackSlotId: "track-a" | "track-b";
  title: string;
  source: MultiTrackSelectionSource;
  detail: string;
  status: MultiTrackStatus;
  createdAt: string;
};

export const DEFAULT_MULTI_TRACK_SELECTION_HISTORY: MultiTrackSelectionHistoryItem[] =
  [
    {
      id: "foundation-track-a",
      trackSlotId: "track-a",
      title: "No track loaded",
      source: "finder",
      detail: "Placeholder selection history entry.",
      status: "foundation",
      createdAt: "foundation",
    },
    {
      id: "foundation-track-b",
      trackSlotId: "track-b",
      title: "No track loaded",
      source: "finder",
      detail: "Placeholder selection history entry.",
      status: "foundation",
      createdAt: "foundation",
    },
  ];

export function createSelectionHistoryItem(
  item: Omit<MultiTrackSelectionHistoryItem, "createdAt">,
): MultiTrackSelectionHistoryItem {
  return {
    ...item,
    createdAt: new Date().toISOString(),
  };
}