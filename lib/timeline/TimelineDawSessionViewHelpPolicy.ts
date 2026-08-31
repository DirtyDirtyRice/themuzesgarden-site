import { timelineDawBabyStepHelpStorageKey } from "./TimelineDawBabyStepHelpPolicy";

export const TIMELINE_DAW_SESSION_VIEW_HELP_STEPS = [
  { title: "Build scenes from Named Regions", instruction: "Create useful Named Regions on the tracks first. Session View groups regions with matching names into one scene row, while unmatched tracks remain Empty slots; the linear arrangement is unchanged." },
  { title: "Set the launch timing", instruction: "Open Session View and confirm Session BPM, Beats per bar, Beat unit, and Launch quantization. Choose Immediate, Next Beat, Next 2 Beats, or Next Bar before launching clips or scenes." },
  { title: "Choose individual clip behavior", instruction: "Set Individual clip launch to One-Shot or Loop Until Stopped, then use each slot's Clip behavior, Clip quantization, and Plays before Stop overrides when one region needs different behavior." },
  { title: "Launch one clip", instruction: "Click a Named Region slot to queue or launch only that track's clip. Use Launch Now or Cancel queued launch when waiting for a musical boundary, then use Previous Pass, Replay Clip, Pause Clip, Resume Clip, or Stop Clip during playback." },
  { title: "Plan each scene's follow action", instruction: "Reorder scenes with the up and down arrows. For each scene choose After this scene, Plays before Stop/Next, and Launch Next target; use Live Set Flow Check to confirm stops, loops, unreachable scenes, and the planned route." },
  { title: "Launch and navigate scenes", instruction: "Press Launch followed by the scene name to play every populated slot in that row. During playback use Previous Scene, Replay Scene, Next Scene, Pause Scene, Resume Scene, or Stop Scene." },
  { title: "Stop at the right boundary", instruction: "Use Stop Session Audio for an immediate stop or the quantized Stop control to stop at the selected musical boundary. A queued stop or launch can be applied now or cancelled before it changes playback." },
  { title: "Save the performance, not source edits", instruction: "Use Save Take Lane or Download Arrangement Plan when you want to keep the launch performance. Session View playback and follow actions never move, trim, delete, replace, publish, or rewrite the linear arrangement, private recordings, or Global Library songs." },
] as const;

export function timelineDawSessionViewHelpStorageKey(sessionId: string) {
  const normalized = sessionId.trim();
  if (!normalized || normalized.length > 160) throw new Error("A valid session is required for Session View help.");
  return timelineDawBabyStepHelpStorageKey("session-view", normalized);
}
