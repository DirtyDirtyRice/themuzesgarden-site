import {
  DEFAULT_MULTI_TRACK_SESSION_NOTES,
} from "./multiTrackSessionSeed";
import {
  MULTI_TRACK_SAVE_ROUTE_OPTIONS,
} from "./multiTrackSaveSeed";
import type {
  MultiTrackSaveDestination,
  MultiTrackSaveReadiness,
  MultiTrackSaveRecordPreview,
  MultiTrackSaveRouteOption,
} from "./multiTrackSaveTypes";
import type {
  MultiTrackDecisionRecord,
} from "./multiTrackDecisionTypes";
import type {
  MultiTrackSelectionHistoryItem,
} from "./multiTrackSelectionHistory";

function getLatestSelectionForSlot(
  history: MultiTrackSelectionHistoryItem[],
  trackSlotId: "track-a" | "track-b",
): MultiTrackSelectionHistoryItem | null {
  return history.find((item) => item.trackSlotId === trackSlotId) ?? null;
}

export function getMultiTrackSaveRouteOptions(): MultiTrackSaveRouteOption[] {
  return MULTI_TRACK_SAVE_ROUTE_OPTIONS.map((option) => ({
    ...option,
  }));
}

export function createMultiTrackSaveReadiness({
  decision,
  trackASelection,
  trackBSelection,
}: {
  decision: MultiTrackDecisionRecord;
  trackASelection: MultiTrackSelectionHistoryItem | null;
  trackBSelection: MultiTrackSelectionHistoryItem | null;
}): MultiTrackSaveReadiness[] {
  return [
    {
      label: "Track A",
      detail: trackASelection
        ? `${trackASelection.title} is selected for Track A.`
        : "Track A still needs a selected source.",
      status: trackASelection ? "foundation" : "planned",
    },
    {
      label: "Track B",
      detail: trackBSelection
        ? `${trackBSelection.title} is selected for Track B.`
        : "Track B still needs a selected source.",
      status: trackBSelection ? "foundation" : "planned",
    },
    {
      label: "Decision",
      detail:
        decision.kind === "undecided"
          ? "A Match, Reference, Hybrid, or Reject decision is still needed."
          : `${decision.label} decision is ready for save preview.`,
      status: decision.kind === "undecided" ? "planned" : "foundation",
    },
    {
      label: "Notes",
      detail: "Session notes are available for the future saved record.",
      status: "foundation",
    },
  ];
}

export function createMultiTrackSaveRecordPreview({
  decision,
  destination,
  history,
}: {
  decision: MultiTrackDecisionRecord;
  destination: MultiTrackSaveDestination;
  history: MultiTrackSelectionHistoryItem[];
}): MultiTrackSaveRecordPreview {
  const trackASelection = getLatestSelectionForSlot(history, "track-a");
  const trackBSelection = getLatestSelectionForSlot(history, "track-b");

  return {
    id: `save-preview-${destination}`,
    title: `${decision.label} / ${destination}`,
    destination,
    status: decision.kind === "undecided" ? "planned" : "foundation",
    trackASelection,
    trackBSelection,
    decision,
    notes: DEFAULT_MULTI_TRACK_SESSION_NOTES.map((note) => ({
      ...note,
    })),
    readiness: createMultiTrackSaveReadiness({
      decision,
      trackASelection,
      trackBSelection,
    }),
  };
}