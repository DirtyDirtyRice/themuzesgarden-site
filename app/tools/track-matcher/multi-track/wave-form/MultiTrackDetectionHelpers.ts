import { multiTrackDetectionSeed } from "./MultiTrackDetectionSeed";
import type {
  MultiTrackDetectionConfidence,
  MultiTrackDetectionItem,
  MultiTrackDetectionKind,
  MultiTrackDetectionLane,
  MultiTrackDetectionOwner,
  MultiTrackDetectionStatus,
} from "./MultiTrackDetectionTypes";

export function getMultiTrackDetectionWorkspace() {
  return multiTrackDetectionSeed;
}

export function getDetectionStatusLabel(status: MultiTrackDetectionStatus) {
  if (status === "ready") return "Ready";
  if (status === "waiting") return "Waiting";
  return "Future";
}

export function getDetectionConfidenceLabel(
  confidence: MultiTrackDetectionConfidence,
) {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  if (confidence === "low") return "Low confidence";

  return "No confidence yet";
}

export function getDetectionKindLabel(kind: MultiTrackDetectionKind) {
  if (kind === "tempo") return "Tempo";
  if (kind === "key") return "Key";
  if (kind === "transient") return "Transient";
  if (kind === "downbeat") return "Downbeat";
  if (kind === "section") return "Section";
  if (kind === "loop") return "Loop";
  if (kind === "stem") return "Stem";
  if (kind === "sync") return "Sync";
  if (kind === "energy") return "Energy";

  return "Silence";
}

export function getDetectionOwnerLabel(owner: MultiTrackDetectionOwner) {
  if (owner === "waveform") return "Waveform";
  if (owner === "statistics") return "Statistics";
  if (owner === "transient") return "Transient";
  if (owner === "cue") return "Cue";
  if (owner === "marker") return "Marker";
  if (owner === "timeline") return "Timeline";
  if (owner === "analysis") return "Analysis";
  if (owner === "dsp") return "DSP";

  return "Future";
}

export function getDetectionBooleanLabel(value: boolean) {
  return value ? "Ready" : "Future";
}

export function getDetectionReadyCount(detections: MultiTrackDetectionItem[]) {
  return detections.filter((detection) => detection.status === "ready").length;
}

export function getDetectionWaitingCount(detections: MultiTrackDetectionItem[]) {
  return detections.filter((detection) => detection.status === "waiting").length;
}

export function getDetectionFutureCount(detections: MultiTrackDetectionItem[]) {
  return detections.filter((detection) => detection.status === "future").length;
}

export function getDetectionLaneSummary(lane: MultiTrackDetectionLane) {
  const ready = getDetectionReadyCount(lane.detections);
  const waiting = getDetectionWaitingCount(lane.detections);
  const future = getDetectionFutureCount(lane.detections);

  return `${ready} ready / ${waiting} waiting / ${future} future`;
}

export function getDetectionLaneReadinessPercent(lane: MultiTrackDetectionLane) {
  if (lane.detections.length === 0) {
    return 0;
  }

  return Math.round(
    (getDetectionReadyCount(lane.detections) / lane.detections.length) * 100,
  );
}

export function getDetectionLaneFuturePercent(lane: MultiTrackDetectionLane) {
  if (lane.detections.length === 0) {
    return 0;
  }

  return Math.round(
    (getDetectionFutureCount(lane.detections) / lane.detections.length) * 100,
  );
}

export function getDetectionPrimaryValue(detection: MultiTrackDetectionItem) {
  if (detection.valueLabel.trim().length === 0) {
    return "Not available";
  }

  return detection.valueLabel;
}

export function getDetectionTimingLabel(detection: MultiTrackDetectionItem) {
  if (detection.timeLabel.trim().length === 0) {
    return "No timing";
  }

  return detection.timeLabel;
}