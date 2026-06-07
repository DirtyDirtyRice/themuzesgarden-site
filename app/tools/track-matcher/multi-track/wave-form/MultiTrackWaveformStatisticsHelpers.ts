import { multiTrackWaveformStatisticsSeed } from "./MultiTrackWaveformStatisticsSeed";

export function getMultiTrackWaveformStatisticsWorkspace() {
  return multiTrackWaveformStatisticsSeed;
}

export function getWaveformStatisticStatusLabel(
  status: "ready" | "waiting" | "future",
) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "waiting") {
    return "Waiting";
  }

  return "Future";
}