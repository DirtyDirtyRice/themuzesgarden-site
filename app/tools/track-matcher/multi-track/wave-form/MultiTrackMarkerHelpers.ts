import { multiTrackMarkerSeed } from "./MultiTrackMarkerSeed";
import type {
  MultiTrackMarkerConfidence,
  MultiTrackMarkerKind,
  MultiTrackMarkerLane,
  MultiTrackMarkerOwnership,
  MultiTrackMarkerPoint,
  MultiTrackMarkerStatus,
} from "./MultiTrackMarkerTypes";

export function getMultiTrackMarkerWorkspace() {
  return multiTrackMarkerSeed;
}

export function getMarkerStatusLabel(status: MultiTrackMarkerStatus) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "waiting") {
    return "Waiting";
  }

  return "Future";
}

export function getMarkerConfidenceLabel(
  confidence: MultiTrackMarkerConfidence,
) {
  if (confidence === "high") {
    return "High confidence";
  }

  if (confidence === "medium") {
    return "Medium confidence";
  }

  if (confidence === "low") {
    return "Low confidence";
  }

  return "No confidence yet";
}

export function getMarkerKindLabel(kind: MultiTrackMarkerKind) {
  if (kind === "intro") return "Intro";
  if (kind === "verse") return "Verse";
  if (kind === "chorus") return "Chorus";
  if (kind === "bridge") return "Bridge";
  if (kind === "outro") return "Outro";
  if (kind === "loop") return "Loop";
  if (kind === "drop") return "Drop";
  if (kind === "breakdown") return "Breakdown";

  return "Custom";
}

export function getMarkerOwnershipLabel(owner: MultiTrackMarkerOwnership) {
  if (owner === "waveform") return "Waveform";
  if (owner === "timeline") return "Timeline";
  if (owner === "cue") return "Cue";
  if (owner === "transient") return "Transient";
  if (owner === "analysis") return "Analysis";

  return "Future";
}

export function getMarkerBooleanLabel(value: boolean) {
  return value ? "Ready" : "Future";
}

export function getMarkerReadyCount(markers: MultiTrackMarkerPoint[]) {
  return markers.filter((marker) => marker.status === "ready").length;
}

export function getMarkerWaitingCount(markers: MultiTrackMarkerPoint[]) {
  return markers.filter((marker) => marker.status === "waiting").length;
}

export function getMarkerFutureCount(markers: MultiTrackMarkerPoint[]) {
  return markers.filter((marker) => marker.status === "future").length;
}

export function getMarkerLaneSummary(lane: MultiTrackMarkerLane) {
  const readyCount = getMarkerReadyCount(lane.markers);
  const waitingCount = getMarkerWaitingCount(lane.markers);
  const futureCount = getMarkerFutureCount(lane.markers);

  return `${readyCount} ready / ${waitingCount} waiting / ${futureCount} future`;
}

export function getMarkerLaneReadinessPercent(lane: MultiTrackMarkerLane) {
  if (lane.markers.length === 0) {
    return 0;
  }

  return Math.round((getMarkerReadyCount(lane.markers) / lane.markers.length) * 100);
}

export function getMarkerTimeLabel(marker: MultiTrackMarkerPoint) {
  if (marker.timeSeconds <= 0) {
    return marker.timeLabel;
  }

  const minutes = Math.floor(marker.timeSeconds / 60);
  const seconds = Math.floor(marker.timeSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}