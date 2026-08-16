export const TIMELINE_DAW_MAX_RECOVERABLE_RECORDINGS = 1;

export function createTimelineDawRecordingRecoveryView(input: {
  hasRecovery: boolean;
  uploading: boolean;
  uploadedSourceAvailable: boolean;
}): { startHeld: boolean; retryLabel: string; privacy: string } {
  return {
    startHeld: input.hasRecovery,
    retryLabel: input.uploadedSourceAvailable ? "Retry Take Registration" : "Retry Private Save",
    privacy: "This recovery WAV stays in private browser storage for this exact DAW session until saving succeeds or you delete it. It is never published or synchronized to public storage.",
  };
}
