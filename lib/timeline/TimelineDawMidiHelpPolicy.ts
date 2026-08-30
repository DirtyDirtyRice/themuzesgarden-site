import { normalizeTimelineDawBabyStepHelpStep, timelineDawBabyStepHelpStorageKey } from "./TimelineDawBabyStepHelpPolicy";

export const TIMELINE_DAW_MIDI_HELP_STEPS = [
  { title: "Choose how to begin", instruction: "Import an existing .mid file or choose New Clip. Work with one selected MIDI clip at a time." },
  { title: "Hear the clip", instruction: "Choose Audition Live, then Stop. Confirm the notes and instrument preview are audible before editing." },
  { title: "Place one note", instruction: "Set Pitch, Velocity, Tick, and Length, then choose Add Note. Click a displayed note only when you intend to remove it." },
  { title: "Correct the timing", instruction: "Use Quantize 1/16 only when the performance should follow that grid. Use Undo immediately if the musical feel becomes worse." },
  { title: "Choose the instrument", instruction: "Select a waveform or an Instrument Rack. Audition again before saving or changing the rack preset." },
  { title: "Add expression", instruction: "Add controller, pitch-bend, program, or automation events one kind at a time, then audition the result." },
  { title: "Create protected audio", instruction: "Choose Bounce WAV, audition the current bounce, and promote it only after it matches the editable MIDI source." },
  { title: "Finish safely", instruction: "Export MIDI or freeze the instrument only after playback, timing, instrument, and expression are correct. The private editable MIDI source remains preserved." },
] as const;

export function timelineDawMidiHelpStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for MIDI help.");
  return timelineDawBabyStepHelpStorageKey("midi", normalized);
}

export function normalizeTimelineDawMidiHelpStep(value: unknown) {
  return normalizeTimelineDawBabyStepHelpStep(value, TIMELINE_DAW_MIDI_HELP_STEPS.length);
}
