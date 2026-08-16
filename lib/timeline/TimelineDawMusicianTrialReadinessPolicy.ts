export const TIMELINE_DAW_MUSICIAN_TRIAL_STEPS = [
  { key: "access", label: "Sign in and open the permitted session", capability: "session:read" },
  { key: "play", label: "Play the approved session audio", capability: "transport:read" },
  { key: "record", label: "Record a new take", capability: "recording:create" },
  { key: "edit", label: "Make a reversible arrangement edit", capability: "arrangement:edit" },
  { key: "save", label: "Save and reopen the work", capability: "session:write" },
  { key: "export", label: "Create and download a test export", capability: "export:create" },
  { key: "feedback", label: "Report what worked or failed", capability: "feedback:create" },
] as const;

export function evaluateTimelineDawMusicianTrialReadiness(capabilities: Iterable<string>) {
  const granted = new Set(capabilities);
  const steps = TIMELINE_DAW_MUSICIAN_TRIAL_STEPS.map((step) => ({ ...step, ready: granted.has(step.capability) }));
  const blockers = steps.filter((step) => !step.ready).map((step) => step.label);
  return { ready: blockers.length === 0, completed: steps.length - blockers.length, required: steps.length, steps, blockers };
}
