import type { TimelineDawRecordingPreflightStatus } from "./TimelineDawRecordingPreflight";

export type TimelineDawRecordingSetup = {
  deviceId: string;
  outputFormat: "wav" | "mp3";
  recordingMode: "normal" | "punch" | "loop";
  countInBars: number;
  bpm: number;
  beatsPerBar: number;
};

export type TimelineDawRecordingEvidence = {
  deviceId: string;
  deviceLabel: string;
  peakDbfs: number;
  status: TimelineDawRecordingPreflightStatus;
  ready: boolean;
  observedAt: string;
};

export function timelineDawRecordingSetupKey(sessionId: string): string {
  return `muzes:daw:recording-setup:${encodeURIComponent(sessionId)}`;
}

export function parseTimelineDawRecordingSetup(value: unknown): TimelineDawRecordingSetup | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const outputFormat = row.outputFormat === "mp3" ? "mp3" : "wav";
  const recordingMode = ["normal", "punch", "loop"].includes(String(row.recordingMode))
    ? row.recordingMode as TimelineDawRecordingSetup["recordingMode"] : "normal";
  const bounded = (raw: unknown, min: number, max: number, fallback: number) => {
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : fallback;
  };
  return {
    deviceId: String(row.deviceId ?? ""), outputFormat, recordingMode,
    countInBars: bounded(row.countInBars, 0, 8, 0),
    bpm: bounded(row.bpm, 20, 400, 120),
    beatsPerBar: bounded(row.beatsPerBar, 1, 32, 4),
  };
}

export function getTimelineDawRestoredDeviceWarning(
  restoredDeviceId: string,
  availableDeviceIds: Iterable<string>,
): string | null {
  if (!restoredDeviceId) return null;
  return new Set(availableDeviceIds).has(restoredDeviceId)
    ? null
    : "The previously selected recording input is missing or changed. Choose an input and run a fresh level check.";
}
