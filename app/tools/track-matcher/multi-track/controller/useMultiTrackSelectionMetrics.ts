"use client";

import { useMemo } from "react";
import { createSelectionMetrics } from "../session/multiTrackSelectionMetrics";
import { useMultiTrackSelectionHistory } from "./useMultiTrackSelectionHistory";

export function useMultiTrackSelectionMetrics() {
  const { history } = useMultiTrackSelectionHistory();

  const metrics = useMemo(
    () => createSelectionMetrics(history),
    [history],
  );

  return metrics;
}