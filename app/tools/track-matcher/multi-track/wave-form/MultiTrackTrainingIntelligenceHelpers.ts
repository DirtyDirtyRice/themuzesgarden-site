import { multiTrackTrainingIntelligenceSeed } from "./MultiTrackTrainingIntelligenceSeed";
import type {
  MultiTrackTrainingCategory,
  MultiTrackTrainingItem,
  MultiTrackTrainingLane,
  MultiTrackTrainingOwner,
  MultiTrackTrainingStatus,
} from "./MultiTrackTrainingIntelligenceTypes";

export function getMultiTrackTrainingIntelligenceWorkspace() {
  return multiTrackTrainingIntelligenceSeed;
}

export function getTrainingStatusLabel(status: MultiTrackTrainingStatus) {
  if (status === "ready") return "Ready";
  if (status === "waiting") return "Waiting";

  return "Future";
}

export function getTrainingCategoryLabel(category: MultiTrackTrainingCategory) {
  if (category === "pattern") return "Pattern";
  if (category === "phrase") return "Phrase";
  if (category === "hook") return "Hook";
  if (category === "arrangement") return "Arrangement";
  if (category === "energy") return "Energy";
  if (category === "comparison") return "Comparison";
  if (category === "ai") return "AI";
  if (category === "hybrid") return "Hybrid";
  if (category === "confidence") return "Confidence";

  return "Memory";
}

export function getTrainingOwnerLabel(owner: MultiTrackTrainingOwner) {
  if (owner === "waveform") return "Waveform";
  if (owner === "statistics") return "Statistics";
  if (owner === "detection") return "Detection";
  if (owner === "marker") return "Marker";
  if (owner === "cue") return "Cue";
  if (owner === "stem") return "Stem";
  if (owner === "dsp") return "DSP";
  if (owner === "insight") return "Insight";

  return "Future";
}

export function getTrainingBooleanLabel(value: boolean) {
  return value ? "Ready" : "Future";
}

export function getTrainingReadyCount(items: MultiTrackTrainingItem[]) {
  return items.filter((item) => item.status === "ready").length;
}

export function getTrainingWaitingCount(items: MultiTrackTrainingItem[]) {
  return items.filter((item) => item.status === "waiting").length;
}

export function getTrainingFutureCount(items: MultiTrackTrainingItem[]) {
  return items.filter((item) => item.status === "future").length;
}

export function getTrainingLaneSummary(lane: MultiTrackTrainingLane) {
  const ready = getTrainingReadyCount(lane.trainingItems);
  const waiting = getTrainingWaitingCount(lane.trainingItems);
  const future = getTrainingFutureCount(lane.trainingItems);

  return `${ready} ready / ${waiting} waiting / ${future} future`;
}

export function getTrainingReadinessPercent(lane: MultiTrackTrainingLane) {
  if (lane.trainingItems.length === 0) {
    return 0;
  }

  return Math.round(
    (getTrainingReadyCount(lane.trainingItems) / lane.trainingItems.length) *
      100,
  );
}

export function getTrainingFuturePercent(lane: MultiTrackTrainingLane) {
  if (lane.trainingItems.length === 0) {
    return 0;
  }

  return Math.round(
    (getTrainingFutureCount(lane.trainingItems) / lane.trainingItems.length) *
      100,
  );
}