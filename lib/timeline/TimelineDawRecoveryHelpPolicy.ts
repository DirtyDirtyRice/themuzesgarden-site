import { normalizeTimelineDawBabyStepHelpStep, timelineDawBabyStepHelpStorageKey } from "./TimelineDawBabyStepHelpPolicy";

export const TIMELINE_DAW_RECOVERY_HELP_STEPS = [
  { title: "Stop and identify what needs protection", instruction: "Stop playback or recording first. Decide whether you need an unsaved recording, a saved take, or the complete session returned to an earlier checkpoint." },
  { title: "Protect an unsaved recording", instruction: "In Record audio, use Download Recovery WAV before leaving Studio. If a private save failed, choose Retry Private Save while the recovery WAV is still available." },
  { title: "Confirm saved takes", instruction: "In Record audio, check the Saved Takes count. Choose Reload Saved Takes only when the saved list is missing or uncertain, then audition the take you expect." },
  { title: "Name a session checkpoint", instruction: "Before a risky edit or restore, enter a recognizable checkpoint name here and choose Capture Checkpoint. Wait for the fingerprinted checkpoint confirmation." },
  { title: "Review the restore target", instruction: "Read the checkpoint name, workspace revision, date, and last-restored status. Choose only the exact checkpoint you intend to restore." },
  { title: "Restore with explicit confirmation", instruction: "Choose Verify & Restore, read the replacement warning, and confirm only when current changes after that checkpoint may be replaced. Undo is for recent edits; checkpoint restore is for the durable session." },
  { title: "Verify the recovered music", instruction: "After Studio reloads, open playback, recording, tracks, and mixing as needed. Confirm the expected take, play position, arrangement, and sound before continuing." },
  { title: "Keep the protected source", instruction: "Do not delete recovery WAVs or older checkpoints until the restored session has played correctly and a fresh checkpoint has been captured. Recovery never requires publishing private audio." },
] as const;

export function timelineDawRecoveryHelpStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for recovery help.");
  return timelineDawBabyStepHelpStorageKey("recovery", normalized);
}

export function normalizeTimelineDawRecoveryHelpStep(value: unknown) {
  return normalizeTimelineDawBabyStepHelpStep(value, TIMELINE_DAW_RECOVERY_HELP_STEPS.length);
}
