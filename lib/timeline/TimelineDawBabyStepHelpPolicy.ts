export function timelineDawBabyStepHelpStorageKey(workflow: string, sessionId: string) {
  const scope = segment(workflow, "Help workflow");
  const session = segment(sessionId, "DAW session ID");
  return `the-muzes-garden:daw-${scope}-help:${session}`;
}

export function normalizeTimelineDawBabyStepHelpStep(value: unknown, stepCount: number) {
  if (!Number.isSafeInteger(stepCount) || stepCount < 1 || stepCount > 50) throw new Error("Help step count is invalid.");
  const step = typeof value === "number" ? value : Number(value);
  return Number.isInteger(step) && step >= 0 && step < stepCount ? step : 0;
}

function segment(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 200 || !/^[a-zA-Z0-9_-]+$/.test(normalized)) throw new Error(`${label} is invalid.`);
  return normalized;
}
