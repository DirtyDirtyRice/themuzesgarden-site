import type {
  MultiTrackSelectionHistoryItem,
} from "./multiTrackSelectionHistory";

export type MultiTrackSelectionMetrics = {
  totalSelections: number;
  trackALoadCount: number;
  trackBLoadCount: number;
};

export function createSelectionMetrics(
  history: MultiTrackSelectionHistoryItem[],
): MultiTrackSelectionMetrics {
  return {
    totalSelections: history.length,
    trackALoadCount: history.filter(
      (item) => item.trackSlotId === "track-a",
    ).length,
    trackBLoadCount: history.filter(
      (item) => item.trackSlotId === "track-b",
    ).length,
  };
}