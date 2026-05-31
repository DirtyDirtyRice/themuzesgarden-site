"use client";

import { useCallback } from "react";
import type {
  MultiTrackAdapterTrackCandidate,
} from "../adapters/multiTrackAdapterTypes";
import { adaptTrackCandidate } from "../adapters/multiTrackAdapterHelpers";
import { useMultiTrackSession } from "./useMultiTrackSession";

export function useMultiTrackTrackSelection() {
  const {
    setActiveTrackSlot,
    snapshot,
  } = useMultiTrackSession();

  const prepareTrackSelection = useCallback(
    (
      source: "finder" | "library" | "metadata",
      trackSlotId: "track-a" | "track-b",
      candidate: MultiTrackAdapterTrackCandidate,
    ) => {
      const result = adaptTrackCandidate(source, {
        trackSlotId,
        candidate,
      });

      setActiveTrackSlot(trackSlotId);

      return result;
    },
    [setActiveTrackSlot],
  );

  return {
    prepareTrackSelection,
    snapshot,
  };
}