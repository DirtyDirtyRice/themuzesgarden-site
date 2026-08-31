import { timelineDawBabyStepHelpStorageKey } from "./TimelineDawBabyStepHelpPolicy";

export const TIMELINE_DAW_REGION_HELP_STEPS = [
  { title: "Choose the correct track", instruction: "Find the track that contains the Verse, Chorus, Bridge, Solo, or other section you want to mark. Choose Hear This Track Alone when you need to identify it without changing the saved Solo, Mute, or mix settings." },
  { title: "Place the beginning", instruction: "Play or seek to the exact beginning of the musical section, then press Set Region Start in that track's Named Regions panel. This stores a temporary boundary; it does not cut or change the audio." },
  { title: "Name and save the ending", instruction: "Enter a useful Region name, move the play position forward to the end of the section, and press Save Region End. The end must be later than the saved start and remain inside that track." },
  { title: "Hear the saved region", instruction: "Press Hear Region for one audition. Press Loop Region when you need to check the boundary repeatedly, then press Stop Loop before editing another region." },
  { title: "Correct either boundary", instruction: "Place the play position at the corrected boundary. Press Move Start Here or Move End Here, then audition again so an attack, lyric, pickup, or ringing tail is not cut off." },
  { title: "Rename without rebuilding", instruction: "Change Saved region name and press Save Region Name. Renaming keeps the same start, end, track, color, and protected source audio." },
  { title: "Use regions in the song", instruction: "Keep consistent names such as Verse 1, Chorus, Bridge, and Solo. Session View can group matching Named Regions into launchable scenes without changing the linear arrangement." },
  { title: "Remove only the label", instruction: "Press Remove Label only when the saved marker is no longer useful. Removing a Named Region deletes the label, not the track, private recording, arrangement clip, or Global Library song." },
] as const;

export function timelineDawRegionHelpStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for region help.");
  return timelineDawBabyStepHelpStorageKey("region", normalized);
}
