"use client";

import { useMemo, useState } from "react";
import {
  createMultiTrackSaveRecordPreview,
  getMultiTrackSaveRouteOptions,
} from "../session/multiTrackSaveHelpers";
import type {
  MultiTrackSaveDestination,
} from "../session/multiTrackSaveTypes";
import type {
  MultiTrackDecisionRecord,
} from "../session/multiTrackDecisionTypes";
import type {
  MultiTrackSelectionHistoryItem,
} from "../session/multiTrackSelectionHistory";

export function useMultiTrackSavePreview({
  decision,
  history,
}: {
  decision: MultiTrackDecisionRecord;
  history: MultiTrackSelectionHistoryItem[];
}) {
  const [destination, setDestination] =
    useState<MultiTrackSaveDestination>("project");

  const routeOptions = useMemo(
    () => getMultiTrackSaveRouteOptions(),
    [],
  );

  const savePreview = useMemo(
    () =>
      createMultiTrackSaveRecordPreview({
        decision,
        destination,
        history,
      }),
    [decision, destination, history],
  );

  return {
    destination,
    routeOptions,
    savePreview,
    setDestination,
  };
}