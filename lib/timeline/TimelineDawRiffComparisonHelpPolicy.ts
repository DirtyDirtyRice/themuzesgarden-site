import { timelineDawBabyStepHelpStorageKey } from "./TimelineDawBabyStepHelpPolicy";

export const TIMELINE_DAW_RIFF_COMPARISON_HELP_STEPS = [
  { title: "Prepare three versions", instruction: "Add the three complete song versions to Recorded and promoted audio. Confirm each track plays correctly and has finished preparing its waveform before comparing riffs." },
  { title: "Select only the three versions", instruction: "Check the selection box on each of the three version tracks. Clear unrelated track selections so every reported riff family must match across the intended A, B, and C versions." },
  { title: "Find the matching riffs", instruction: "Press Analyze Selected Tracks. The DAW compares real waveform and attack shapes and colors only riff regions that meet the 90% match requirement across every selected version." },
  { title: "Hear one exact match", instruction: "Click a colored region or its Hear riff button to audition only that riff in one version. Playback stops automatically at the detected end so the comparison stays focused." },
  { title: "Compare A, B, and C", instruction: "Press Hear Across All Selected Tracks to hear the same riff family once in each version. Watch Now hearing and Track 1 of 3 so you always know which version is playing." },
  { title: "Repeat difficult decisions", instruction: "Press Repeat Comparison 3 Times when differences are subtle. Use Previous Riff Track, Replay Current Riff, Skip to Next Track, Pause Riff Comparison, and Resume Riff Comparison as needed." },
  { title: "Review every matching riff", instruction: "Use Play All Matching Riffs for one chosen version to hear its colored matches in song order. A no-match result means nothing reached the strict threshold across all three selected versions; it does not mean the songs contain no similar ideas." },
  { title: "Stop without changing sources", instruction: "Press Stop Riff Comparison before leaving or changing selections. Analysis and audition do not edit, publish, replace, or duplicate any private recording, arrangement track, or Global Library song." },
] as const;

export function timelineDawRiffComparisonHelpStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for riff comparison help.");
  return timelineDawBabyStepHelpStorageKey("riff-comparison", normalized);
}
