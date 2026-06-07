import { multiTrackTransientSeed } from "./MultiTrackTransientSeed";
import type { MultiTrackTransientStatus } from "./MultiTrackTransientTypes";

export function getMultiTrackTransientWorkspace() {
  return multiTrackTransientSeed;
}

export function getTransientStatusLabel(
  status: MultiTrackTransientStatus,
) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "waiting") {
    return "Waiting";
  }

  return "Future";
}

export function getTransientBooleanLabel(
  value: boolean,
) {
  return value ? "Ready" : "Future";
}