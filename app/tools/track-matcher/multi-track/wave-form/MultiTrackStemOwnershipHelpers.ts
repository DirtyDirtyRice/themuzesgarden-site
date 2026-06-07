import { multiTrackStemOwnershipSeed } from "./MultiTrackStemOwnershipSeed";
import type {
  MultiTrackStemKind,
  MultiTrackStemOwner,
  MultiTrackStemOwnershipItem,
  MultiTrackStemOwnershipLane,
  MultiTrackStemOwnershipStatus,
} from "./MultiTrackStemOwnershipTypes";

export function getMultiTrackStemOwnershipWorkspace() {
  return multiTrackStemOwnershipSeed;
}

export function getStemOwnershipStatusLabel(
  status: MultiTrackStemOwnershipStatus,
) {
  if (status === "ready") return "Ready";
  if (status === "waiting") return "Waiting";

  return "Future";
}

export function getStemKindLabel(kind: MultiTrackStemKind) {
  if (kind === "vocal") return "Vocal";
  if (kind === "drums") return "Drums";
  if (kind === "bass") return "Bass";
  if (kind === "guitar") return "Guitar";
  if (kind === "keys") return "Keys";
  if (kind === "melody") return "Melody";
  if (kind === "harmony") return "Harmony";
  if (kind === "instrument") return "Instrument";
  if (kind === "hybrid") return "Hybrid";

  return "Reference";
}

export function getStemOwnerLabel(owner: MultiTrackStemOwner) {
  if (owner === "waveform") return "Waveform";
  if (owner === "detection") return "Detection";
  if (owner === "analysis") return "Analysis";
  if (owner === "comparison") return "Comparison";
  if (owner === "timeline") return "Timeline";
  if (owner === "dsp") return "DSP";

  return "Future";
}

export function getStemOwnershipBooleanLabel(value: boolean) {
  return value ? "Ready" : "Future";
}

export function getStemOwnershipReadyCount(
  stems: MultiTrackStemOwnershipItem[],
) {
  return stems.filter((stem) => stem.status === "ready").length;
}

export function getStemOwnershipWaitingCount(
  stems: MultiTrackStemOwnershipItem[],
) {
  return stems.filter((stem) => stem.status === "waiting").length;
}

export function getStemOwnershipFutureCount(
  stems: MultiTrackStemOwnershipItem[],
) {
  return stems.filter((stem) => stem.status === "future").length;
}

export function getStemOwnershipLaneSummary(
  lane: MultiTrackStemOwnershipLane,
) {
  const ready = getStemOwnershipReadyCount(lane.stems);
  const waiting = getStemOwnershipWaitingCount(lane.stems);
  const future = getStemOwnershipFutureCount(lane.stems);

  return `${ready} ready / ${waiting} waiting / ${future} future`;
}

export function getStemOwnershipReadinessPercent(
  lane: MultiTrackStemOwnershipLane,
) {
  if (lane.stems.length === 0) {
    return 0;
  }

  return Math.round(
    (getStemOwnershipReadyCount(lane.stems) / lane.stems.length) * 100,
  );
}

export function getStemOwnershipFuturePercent(
  lane: MultiTrackStemOwnershipLane,
) {
  if (lane.stems.length === 0) {
    return 0;
  }

  return Math.round(
    (getStemOwnershipFutureCount(lane.stems) / lane.stems.length) * 100,
  );
}