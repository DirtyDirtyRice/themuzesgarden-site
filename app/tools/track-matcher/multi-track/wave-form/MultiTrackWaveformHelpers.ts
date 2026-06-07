import { multiTrackWaveformSeed } from "./MultiTrackWaveformSeed";
import type {
  MultiTrackWaveformLane,
  MultiTrackWaveformReadiness,
  MultiTrackWaveformStatus,
} from "./MultiTrackWaveformTypes";

export function getMultiTrackWaveformWorkspace() {
  return multiTrackWaveformSeed;
}

export function getWaveformStatusLabel(status: MultiTrackWaveformStatus) {
  if (status === "ready") return "Ready";
  if (status === "waiting") return "Waiting";
  return "Future";
}

export function getWaveformReadinessLabel(readiness: MultiTrackWaveformReadiness) {
  if (readiness === "ready") return "Ready";
  if (readiness === "partial") return "Partial";
  return "Future";
}

export function getWaveformLaneReadyCount(lane: MultiTrackWaveformLane) {
  return lane.checkpoints.filter((checkpoint) => checkpoint.status === "ready").length;
}

export function getWaveformLaneTotalCount(lane: MultiTrackWaveformLane) {
  return lane.checkpoints.length;
}

export function getWaveformLaneReadinessPercent(lane: MultiTrackWaveformLane) {
  const total = getWaveformLaneTotalCount(lane);

  if (total === 0) {
    return 0;
  }

  return Math.round((getWaveformLaneReadyCount(lane) / total) * 100);
}

export function getWaveformDurationWidth(lane: MultiTrackWaveformLane) {
  if (lane.durationSeconds <= 0) {
    return "8%";
  }

  const cappedSeconds = Math.min(lane.durationSeconds, 480);
  const percent = Math.max(8, Math.round((cappedSeconds / 480) * 100));

  return `${percent}%`;
}

export function getWaveformBooleanLabel(value: boolean) {
  return value ? "Ready" : "Future";
}