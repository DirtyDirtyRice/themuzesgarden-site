import { timelineDawBabyStepHelpStorageKey } from "./TimelineDawBabyStepHelpPolicy";

export const TIMELINE_DAW_IMPORT_HELP_STEPS = [
  { title: "Choose where the music comes from", instruction: "Use Choose songs already in this project for linked Library songs. Use the file controls below only for WAV or MP3 audio on this computer." },
  { title: "Choose the import type", instruction: "Choose Full Song for one complete mix, Stems for synchronized separate parts, or Alternate Versions for different performances or mixes." },
  { title: "Choose the music", instruction: "Select one project song or file for a Full Song. For Stems or Alternate Versions, select the related files or up to three linked project songs." },
  { title: "Choose how versions begin", instruction: "For two or more project songs, choose Layer Together when they should all start at 0:00, or One After Another when each should follow the previous song." },
  { title: "Give the group a clear name", instruction: "Enter a short song or session name when the automatic filename would be confusing. This names the protected arrangement family, not the original Library song." },
  { title: "Import into the arrangement", instruction: "Choose Place Selected Songs or Import Into Arrangement once. Wait for the progress count; do not refresh Chrome while files are uploading." },
  { title: "Handle a problem safely", instruction: "Choose Stop safely if the wrong files were selected. Completed protected copies remain saved, duplicates are held, and original Library songs are never moved or overwritten." },
  { title: "Verify the imported tracks", instruction: "Find the new lanes below, audition them, and confirm the intended start positions. Only continue editing after the correct music is present and aligned." },
] as const;

export function timelineDawImportHelpStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for import help.");
  return timelineDawBabyStepHelpStorageKey("import", normalized);
}
