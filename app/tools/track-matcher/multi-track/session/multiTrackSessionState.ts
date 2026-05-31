import {
  DEFAULT_MULTI_TRACK_CONTROLLER_SNAPSHOT,
} from "../controller/multiTrackControllerConstants";
import type {
  MultiTrackControllerAction,
  MultiTrackControllerSnapshot,
} from "../controller/multiTrackControllerTypes";

export function createDefaultMultiTrackSessionSnapshot(): MultiTrackControllerSnapshot {
  return {
    ...DEFAULT_MULTI_TRACK_CONTROLLER_SNAPSHOT,
    trackSlots: DEFAULT_MULTI_TRACK_CONTROLLER_SNAPSHOT.trackSlots.map((slot) => ({
      ...slot,
    })),
    panelSummaries: DEFAULT_MULTI_TRACK_CONTROLLER_SNAPSHOT.panelSummaries.map((panel) => ({
      ...panel,
    })),
  };
}

export function reduceMultiTrackSessionSnapshot(
  snapshot: MultiTrackControllerSnapshot,
  action: MultiTrackControllerAction,
): MultiTrackControllerSnapshot {
  if (action.type === "set-view") {
    return {
      ...snapshot,
      activeView: action.view,
    };
  }

  if (action.type === "set-active-track-slot") {
    return {
      ...snapshot,
      activeTrackSlot: action.trackSlotId,
    };
  }

  return snapshot;
}

export function getMultiTrackSessionReadinessLabel(
  snapshot: MultiTrackControllerSnapshot,
): string {
  const foundationCount = snapshot.panelSummaries.filter(
    (panel) => panel.status === "foundation",
  ).length;
  const readyCount = snapshot.panelSummaries.filter(
    (panel) => panel.status === "ready",
  ).length;
  const plannedCount = snapshot.panelSummaries.filter(
    (panel) => panel.status === "planned",
  ).length;

  return `${foundationCount} foundation / ${readyCount} ready / ${plannedCount} planned`;
}