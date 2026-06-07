import { multiTrackWaveformIntelligenceSeed } from "./MultiTrackWaveformIntelligenceSeed";

export function getMultiTrackWaveformIntelligenceWorkspace() {
  return multiTrackWaveformIntelligenceSeed;
}

export function getWaveformIntelligenceBooleanLabel(
  value: boolean,
) {
  return value ? "Ready" : "Future";
}

export function getWaveformIntelligenceReadyCount(
  count: number,
) {
  return count;
}