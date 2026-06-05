import { multiTrackDspOwnershipSeed } from "./MultiTrackDspOwnershipSeed";
import type {
  MultiTrackDspOwner,
  MultiTrackDspOwnershipItem,
  MultiTrackDspOwnershipLane,
  MultiTrackDspOwnershipStatus,
  MultiTrackDspProcessKind,
} from "./MultiTrackDspOwnershipTypes";

export function getMultiTrackDspOwnershipWorkspace() {
  return multiTrackDspOwnershipSeed;
}

export function getDspOwnershipStatusLabel(
  status: MultiTrackDspOwnershipStatus,
) {
  if (status === "ready") return "Ready";
  if (status === "waiting") return "Waiting";

  return "Future";
}

export function getDspProcessKindLabel(kind: MultiTrackDspProcessKind) {
  if (kind === "gain") return "Gain";
  if (kind === "pitch") return "Pitch";
  if (kind === "tempo") return "Tempo";
  if (kind === "stretch") return "Stretch";
  if (kind === "sync") return "Sync";
  if (kind === "filter") return "Filter";
  if (kind === "eq") return "EQ";
  if (kind === "compressor") return "Compressor";
  if (kind === "limiter") return "Limiter";
  if (kind === "stem") return "Stem";

  return "Render";
}

export function getDspOwnerLabel(owner: MultiTrackDspOwner) {
  if (owner === "browser") return "Browser";
  if (owner === "web-audio") return "Web Audio";
  if (owner === "granular") return "Granular";
  if (owner === "waveform") return "Waveform";
  if (owner === "stem") return "Stem";
  if (owner === "analysis") return "Analysis";

  return "Future";
}

export function getDspOwnershipBooleanLabel(value: boolean) {
  return value ? "Ready" : "Future";
}

export function getDspOwnershipReadyCount(
  processes: MultiTrackDspOwnershipItem[],
) {
  return processes.filter((process) => process.status === "ready").length;
}

export function getDspOwnershipWaitingCount(
  processes: MultiTrackDspOwnershipItem[],
) {
  return processes.filter((process) => process.status === "waiting").length;
}

export function getDspOwnershipFutureCount(
  processes: MultiTrackDspOwnershipItem[],
) {
  return processes.filter((process) => process.status === "future").length;
}

export function getDspOwnershipLaneSummary(
  lane: MultiTrackDspOwnershipLane,
) {
  const ready = getDspOwnershipReadyCount(lane.processes);
  const waiting = getDspOwnershipWaitingCount(lane.processes);
  const future = getDspOwnershipFutureCount(lane.processes);

  return `${ready} ready / ${waiting} waiting / ${future} future`;
}

export function getDspOwnershipReadinessPercent(
  lane: MultiTrackDspOwnershipLane,
) {
  if (lane.processes.length === 0) {
    return 0;
  }

  return Math.round(
    (getDspOwnershipReadyCount(lane.processes) / lane.processes.length) * 100,
  );
}

export function getDspOwnershipFuturePercent(
  lane: MultiTrackDspOwnershipLane,
) {
  if (lane.processes.length === 0) {
    return 0;
  }

  return Math.round(
    (getDspOwnershipFutureCount(lane.processes) / lane.processes.length) * 100,
  );
}