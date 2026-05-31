"use client";

import { useCallback } from "react";
import type {
  MultiTrackAdapterResult,
} from "../adapters/multiTrackAdapterTypes";
import { createHistoryItemFromAdapterResult } from "../adapters/multiTrackSelectionAdapter";
import { useMultiTrackSelectionHistory } from "./useMultiTrackSelectionHistory";

export function useMultiTrackSelectionCoordinator() {
  const {
    addHistoryItem,
    history,
    trackALoads,
    trackBLoads,
  } = useMultiTrackSelectionHistory();

  const recordAdapterSelection = useCallback(
    (
      source: "finder" | "library" | "metadata",
      result: MultiTrackAdapterResult,
    ) => {
      addHistoryItem(
        createHistoryItemFromAdapterResult(result, source),
      );

      return result;
    },
    [addHistoryItem],
  );

  return {
    history,
    recordAdapterSelection,
    trackALoads,
    trackBLoads,
  };
}