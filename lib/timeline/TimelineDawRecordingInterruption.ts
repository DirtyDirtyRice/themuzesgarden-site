export type TimelineDawRecordingInterruptionReason =
  | "input-ended"
  | "input-muted"
  | "stream-inactive";

export const TIMELINE_DAW_INPUT_MUTE_GRACE_MS = 5_000;

export type TimelineDawRecordingInterruptionDecision = {
  shouldStop: boolean;
  canRecoverAudio: boolean;
  notice: string;
};

export function assessTimelineDawRecordingInterruption(input: {
  reason: TimelineDawRecordingInterruptionReason;
  recordingActive: boolean;
  stopAlreadyStarted: boolean;
  interruptionAlreadyHandled: boolean;
  capturedFrames: number;
}): TimelineDawRecordingInterruptionDecision {
  if (!input.recordingActive || input.stopAlreadyStarted || input.interruptionAlreadyHandled) {
    return { shouldStop: false, canRecoverAudio: false, notice: "" };
  }
  const canRecoverAudio = Number.isFinite(input.capturedFrames) && input.capturedFrames > 0;
  const cause = input.reason === "input-ended"
    ? "The selected microphone disconnected or stopped sending audio."
    : input.reason === "input-muted"
      ? "The selected microphone stayed muted for five seconds."
      : "The browser reported that the microphone stream ended.";
  return {
    shouldStop: true,
    canRecoverAudio,
    notice: canRecoverAudio
      ? `${cause} Recording stopped automatically. The captured audio is being finalized through the normal private-save and Local Recovery path.`
      : `${cause} Recording stopped automatically before any audio could be captured. Reconnect the input, rescan inputs, and start a new take.`,
  };
}
