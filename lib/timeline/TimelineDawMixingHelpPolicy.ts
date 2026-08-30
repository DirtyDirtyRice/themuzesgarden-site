export const TIMELINE_DAW_MIXING_HELP_STEPS = [
  { title: "Choose one track", instruction: "Pick one track in Quick Mix. Work on only that track until you can clearly hear what each change does." },
  { title: "Play the busiest section", instruction: "Start playback at a loud or crowded part of the song so your decisions also work when the arrangement is full." },
  { title: "Set the track level", instruction: "Move Gain slowly until the track is clear without covering the other important parts. Avoid red clipping warnings." },
  { title: "Place it left or right", instruction: "Move Pan only if the track needs its own space. Keep bass, kick, lead vocal, and other foundations centered unless you intend otherwise." },
  { title: "Check mute and solo", instruction: "Use Solo to hear the track closely, then turn Solo off. Briefly use Mute to judge what the track contributes to the complete mix." },
  { title: "Compare the sound", instruction: "Try one Clean, Vocal, Punch, or Warm starting sound, then use A/B Effects to compare it with the untreated track at a similar loudness." },
  { title: "Choose output and sends", instruction: "Leave Output on Master unless you intentionally use a bus. Add one parallel send only when you can name the purpose, such as shared reverb." },
  { title: "Listen to the whole mix", instruction: "Turn every Solo off, play the full section, and confirm the meters stay safe, the important parts remain clear, and the source recording is unchanged." },
] as const;

export function timelineDawMixingHelpStorageKey(sessionId: string): string {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for mixing help.");
  return `muzes:daw:mixing-help:v1:${normalized}`;
}
