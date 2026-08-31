import { timelineDawBabyStepHelpStorageKey } from "./TimelineDawBabyStepHelpPolicy";

export const TIMELINE_DAW_ARRANGEMENT_HELP_STEPS = [
  { title: "Choose one clip", instruction: "Click the audio clip you want to change. Use multi-selection only when the same move, duplicate, archive, or placement action should affect every selected clip." },
  { title: "Choose the editing behavior", instruction: "Use Grid for snapped placement, Slip for free movement, Shuffle when neighboring clips should close or make room, or Spot when placing at an exact time." },
  { title: "Move or align the clip", instruction: "Use Move -1s, Move +1s, the selected-track movement controls, or the 0.01-second nudges. Use Align Starts, Align Endings, or Place One After Another for several selected clips." },
  { title: "Trim without deleting the source", instruction: "Move the playhead to the intended boundary, then choose Trim Start or Trim End. Trimming changes the clip window; the private source recording remains preserved." },
  { title: "Split, copy, or repeat", instruction: "Use Split at Playhead to make two editable clips, Duplicate for an immediate copy, or Copy and Paste for another position. Use Repeat only after confirming the selected clip and loop range." },
  { title: "Smooth the boundaries", instruction: "Use the fade controls at the clip edges and audition the transition. Overlapping clips create a speed-aware crossfade; confirm it does not cut off an important attack or tail." },
  { title: "Protect and organize", instruction: "Lock finished tracks against accidental edits, choose useful colors, and place related tracks in a collapsible folder. Folder removal must preserve every member track." },
  { title: "Listen and recover", instruction: "Audition the edited section, turn off unintended Solo or Mute states, and use Undo immediately when the musical result is wrong. Capture a recovery checkpoint before a large arrangement change." },
] as const;

export function timelineDawArrangementHelpStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for arrangement help.");
  return timelineDawBabyStepHelpStorageKey("arrangement", normalized);
}
