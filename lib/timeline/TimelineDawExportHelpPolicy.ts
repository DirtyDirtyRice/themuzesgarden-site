export const TIMELINE_DAW_EXPORT_HELP_STEPS = [
  { title: "Create the delivery", instruction: "Choose the export settings, upload or select the private sources, then choose Validate & Save Render and Render PCM WAV or Render Stem ZIP." },
  { title: "Download the completed file", instruction: "In Saved render history, open the completed render and choose its private WAV or stem ZIP download link." },
  { title: "Verify the downloaded file", instruction: "Beside that completed render, choose Verify downloaded file and select the WAV or ZIP you just downloaded." },
  { title: "Save the verification receipt", instruction: "After Verified local download appears, choose Download Verification Receipt and keep the JSON beside the delivered audio." },
  { title: "Recheck the delivery later", instruction: "Choose Verify Receipt File, open the saved JSON, then choose Match Download to Receipt and select the WAV or ZIP." },
] as const;

export function timelineDawExportHelpStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 200) throw new Error("DAW session ID is invalid.");
  return `the-muzes-garden:daw-export-help:${normalized}`;
}

export function normalizeTimelineDawExportHelpStep(value: unknown) {
  const step = typeof value === "number" ? value : Number(value);
  return Number.isInteger(step) && step >= 0 && step < TIMELINE_DAW_EXPORT_HELP_STEPS.length ? step : 0;
}
