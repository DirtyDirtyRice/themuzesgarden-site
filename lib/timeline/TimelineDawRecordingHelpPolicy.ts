import { timelineDawBabyStepHelpStorageKey } from "./TimelineDawBabyStepHelpPolicy";

export const TIMELINE_DAW_RECORDING_HELP_STEPS = [
  { title: "Choose the input", instruction: "Select the microphone or audio-interface input and give the take a clear name. Keep WAV master selected unless you also need an MP3 copy." },
  { title: "Test the input level", instruction: "Choose Test Input Level, then sing or play at performance volume for two seconds. Adjust the hardware gain until Ready to record appears." },
  { title: "Choose the recording plan", instruction: "Use Normal for a full take, Punch for one range, or Loop for repeated passes. Set count-in and monitoring before starting." },
  { title: "Record and save", instruction: "Choose Start Recording, perform, then choose Stop & Save. Wait for the private upload to finish before leaving Studio." },
  { title: "Review the saved take", instruction: "Audition the saved take, add review notes if needed, and choose Use as Preferred when it is the take you want to keep working with." },
] as const;

export function timelineDawRecordingHelpStorageKey(sessionId: string) {
  return timelineDawBabyStepHelpStorageKey("recording", sessionId);
}
