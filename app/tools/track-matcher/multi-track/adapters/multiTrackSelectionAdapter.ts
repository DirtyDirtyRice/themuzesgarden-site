import type {
  MultiTrackAdapterResult,
} from "./multiTrackAdapterTypes";
import type {
  MultiTrackSelectionHistoryItem,
} from "../session/multiTrackSelectionHistory";

export function createHistoryItemFromAdapterResult(
  result: MultiTrackAdapterResult,
  source: "finder" | "library" | "metadata",
): Omit<MultiTrackSelectionHistoryItem, "createdAt"> {
  return {
    id: `${source}-${result.selection.trackSlotId}-${result.selection.selectedTitle}`,
    trackSlotId: result.selection.trackSlotId,
    title: result.selection.selectedTitle,
    source,
    detail: result.message,
    status: result.selection.status,
  };
}