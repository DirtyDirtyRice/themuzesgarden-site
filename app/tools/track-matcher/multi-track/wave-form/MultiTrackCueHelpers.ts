import { multiTrackCueSeed } from "./MultiTrackCueSeed";
import type { MultiTrackCueStatus } from "./MultiTrackCueTypes";

export function getMultiTrackCueWorkspace() {
  return multiTrackCueSeed;
}

export function getCueStatusLabel(status: MultiTrackCueStatus) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "waiting") {
    return "Waiting";
  }

  return "Future";
}

export function getCueBooleanLabel(value: boolean) {
  return value ? "Ready" : "Future";
}