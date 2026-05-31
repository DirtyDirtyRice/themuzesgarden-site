"use client";

import { useMemo, useReducer } from "react";
import type {
  MultiTrackControllerTrackSlot,
  MultiTrackControllerView,
} from "./multiTrackControllerTypes";
import {
  createMultiTrackSessionFoundation,
} from "../session/multiTrackSessionHelpers";
import {
  createDefaultMultiTrackSessionSnapshot,
  reduceMultiTrackSessionSnapshot,
} from "../session/multiTrackSessionState";

export function useMultiTrackSession() {
  const [snapshot, dispatch] = useReducer(
    reduceMultiTrackSessionSnapshot,
    undefined,
    createDefaultMultiTrackSessionSnapshot,
  );

  const foundation = useMemo(
    () => createMultiTrackSessionFoundation(snapshot),
    [snapshot],
  );

  function setActiveView(view: MultiTrackControllerView) {
    dispatch({
      type: "set-view",
      view,
    });
  }

  function setActiveTrackSlot(
    trackSlotId: MultiTrackControllerTrackSlot["id"],
  ) {
    dispatch({
      type: "set-active-track-slot",
      trackSlotId,
    });
  }

  const activeTrackSlot = useMemo(
    () =>
      snapshot.trackSlots.find(
        (trackSlot) => trackSlot.id === snapshot.activeTrackSlot,
      ) ?? snapshot.trackSlots[0],
    [snapshot.activeTrackSlot, snapshot.trackSlots],
  );

  const activeViewPanels = useMemo(
    () =>
      snapshot.activeView === "overview"
        ? snapshot.panelSummaries
        : snapshot.panelSummaries.filter(
            (panel) => panel.view === snapshot.activeView,
          ),
    [snapshot.activeView, snapshot.panelSummaries],
  );

  return {
    activeTrackSlot,
    activeViewPanels,
    dispatch,
    foundation,
    setActiveTrackSlot,
    setActiveView,
    snapshot,
  };
}