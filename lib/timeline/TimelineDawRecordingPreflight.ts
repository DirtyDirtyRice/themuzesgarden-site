export type TimelineDawRecordingPreflightStatus =
  | "silent"
  | "low"
  | "ready"
  | "hot"
  | "clipping";

export type TimelineDawRecordingPreflightResult = {
  status: TimelineDawRecordingPreflightStatus;
  peakDbfs: number;
  ready: boolean;
  guidance: string;
};

export function assessTimelineDawRecordingPreflight(
  peakDbfs: number,
): TimelineDawRecordingPreflightResult {
  const peak = Number.isFinite(peakDbfs) ? Math.max(-96, Math.min(0, peakDbfs)) : -96;
  if (peak >= -1) return { status: "clipping", peakDbfs: peak, ready: false, guidance: "Lower the interface or microphone gain before recording." };
  if (peak > -6) return { status: "hot", peakDbfs: peak, ready: false, guidance: "Lower the input gain slightly so louder notes have headroom." };
  if (peak >= -30) return { status: "ready", peakDbfs: peak, ready: true, guidance: "Input level is ready. Keep the same performance distance and gain." };
  if (peak >= -60) return { status: "low", peakDbfs: peak, ready: false, guidance: "Raise the input gain or move closer to the microphone." };
  return { status: "silent", peakDbfs: peak, ready: false, guidance: "No useful input was detected. Check the selected input, cable, and interface." };
}
