"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_MULTI_TRACK_SELECTION_HISTORY,
  createSelectionHistoryItem,
  type MultiTrackSelectionHistoryItem,
} from "../session/multiTrackSelectionHistory";

export function useMultiTrackSelectionHistory() {
  const [history, setHistory] = useState<MultiTrackSelectionHistoryItem[]>(
    DEFAULT_MULTI_TRACK_SELECTION_HISTORY,
  );

  function addHistoryItem(
    item: Omit<MultiTrackSelectionHistoryItem, "createdAt">,
  ) {
    setHistory((current) => [
      createSelectionHistoryItem(item),
      ...current,
    ]);
  }

  const trackALoads = useMemo(
    () => history.filter((item) => item.trackSlotId === "track-a"),
    [history],
  );

  const trackBLoads = useMemo(
    () => history.filter((item) => item.trackSlotId === "track-b"),
    [history],
  );

  return {
    addHistoryItem,
    history,
    trackALoads,
    trackBLoads,
  };
}