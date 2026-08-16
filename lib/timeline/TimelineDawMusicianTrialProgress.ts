import { TIMELINE_DAW_MUSICIAN_TRIAL_STEPS } from "./TimelineDawMusicianTrialReadinessPolicy";

export type TimelineDawMusicianTrialStepKey = (typeof TIMELINE_DAW_MUSICIAN_TRIAL_STEPS)[number]["key"];
export type TimelineDawMusicianTrialProgress = Partial<Record<TimelineDawMusicianTrialStepKey, string>>;
const keys = new Set(TIMELINE_DAW_MUSICIAN_TRIAL_STEPS.map((step) => step.key));

export function parseTimelineDawMusicianTrialProgress(value: unknown): TimelineDawMusicianTrialProgress {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter(([key, observedAt]) => keys.has(key as TimelineDawMusicianTrialStepKey) && typeof observedAt === "string" && Number.isFinite(Date.parse(observedAt))));
}

export function completeTimelineDawMusicianTrialStep(progress: TimelineDawMusicianTrialProgress, key: TimelineDawMusicianTrialStepKey, observedAt: string) {
  if (!keys.has(key) || !Number.isFinite(Date.parse(observedAt))) throw new Error("Musician trial progress is invalid.");
  return { ...progress, [key]: progress[key] ?? observedAt };
}

export function summarizeTimelineDawMusicianTrialProgress(progress: TimelineDawMusicianTrialProgress) {
  const steps = TIMELINE_DAW_MUSICIAN_TRIAL_STEPS.map((step) => ({ ...step, complete: Boolean(progress[step.key]) }));
  return { steps, completed: steps.filter((step) => step.complete).length, required: steps.length, complete: steps.every((step) => step.complete) };
}
