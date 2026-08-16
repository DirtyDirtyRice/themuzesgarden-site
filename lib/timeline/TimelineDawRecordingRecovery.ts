export const TIMELINE_DAW_MAX_RECOVERABLE_RECORDINGS = 1;

export function createTimelineDawRecordingRecoveryView(input: {
  hasRecovery: boolean;
  uploading: boolean;
  uploadedSourceAvailable: boolean;
}): { startHeld: boolean; retryLabel: string; privacy: string } {
  return {
    startHeld: input.hasRecovery,
    retryLabel: input.uploadedSourceAvailable ? "Retry Take Registration" : "Retry Private Save",
    privacy: "This recovery WAV remains in this browser tab until private saving succeeds or you delete it. Download it before closing the tab.",
  };
}
