import { timelineDawBabyStepHelpStorageKey } from "./TimelineDawBabyStepHelpPolicy";

export const TIMELINE_DAW_HYBRID_EDIT_HELP_STEPS = [
  { title: "Find the source riffs first", instruction: "Select the song versions and press Analyze Selected Tracks. Track 4 — Hybrid Edit appears only after at least one matching riff family is found across every selected version." },
  { title: "Choose the best source version", instruction: "Use the Hear riff buttons or Hear Across All Selected Tracks before copying. Decide which performance supplies the timing, tone, and feel you want for that position in the hybrid." },
  { title: "Copy a riff into Track 4", instruction: "Press Copy Riff from the chosen song version. This adds a reference to that protected source region at the end of Track 4; it does not cut, move, or duplicate the original recording." },
  { title: "Check one copied clip", instruction: "Click the riff-and-track name inside the Track 4 list to audition that one copied clip. Use this check before deciding its order or repeating it." },
  { title: "Put the hybrid in song order", instruction: "Press Move Earlier or Move Later until the numbered Track 4 list follows the intended musical sequence. The list order is the playback order." },
  { title: "Repeat or remove an idea", instruction: "Press Duplicate when a copied riff should play again. Press Cut from Hybrid to remove only that Track 4 recipe item; the source version and its detected riff remain preserved." },
  { title: "Hear the complete edit", instruction: "Press Play Hybrid Edit to audition every listed clip from top to bottom. Stop Riff Comparison ends the audition safely; revise the order and replay until transitions make musical sense." },
  { title: "Clear only when intentional", instruction: "Press Clear Hybrid Track only when you want to discard the complete Track 4 recipe. Clearing the hybrid never deletes, publishes, replaces, or edits the three source songs, private recordings, arrangement tracks, or Global Library records." },
] as const;

export function timelineDawHybridEditHelpStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for hybrid edit help.");
  return timelineDawBabyStepHelpStorageKey("hybrid-edit", normalized);
}
