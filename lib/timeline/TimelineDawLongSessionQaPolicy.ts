export type TimelineDawLongSessionQaReport = {
  status: "incomplete" | "needs-review" | "passed";
  durationMinutes: number;
  checks: { persistentStorage: boolean; captureCompleted: boolean; recoveryProtected: boolean; reloadPassed: boolean; playbackPassed: boolean; clipped: boolean; errorCount: number };
  issues: string[];
  productionEvidenceComplete: boolean;
};

export function assessTimelineDawLongSessionQa(input: { durationMinutes: unknown; persistentStorage: unknown; captureCompleted: unknown; recoveryProtected: unknown; reloadPassed: unknown; playbackPassed: unknown; clipped: unknown; errorCount: unknown }): TimelineDawLongSessionQaReport {
  const durationMinutes = Number(input.durationMinutes);
  const errorCount = Number(input.errorCount);
  if (!Number.isFinite(durationMinutes) || durationMinutes < 0 || durationMinutes > 30) throw new Error("Long-session duration must be between 0 and 30 minutes.");
  if (!Number.isInteger(errorCount) || errorCount < 0 || errorCount > 999) throw new Error("Error count must be a whole number from 0 to 999.");
  const checks = { persistentStorage: input.persistentStorage === true, captureCompleted: input.captureCompleted === true, recoveryProtected: input.recoveryProtected === true, reloadPassed: input.reloadPassed === true, playbackPassed: input.playbackPassed === true, clipped: input.clipped === true, errorCount };
  const issues: string[] = [];
  if (durationMinutes < 30) issues.push("A real 30-minute recording is required for production stability evidence.");
  if (!checks.persistentStorage) issues.push("Persistent recovery storage was not confirmed.");
  if (!checks.captureCompleted) issues.push("The bounded capture did not complete normally.");
  if (!checks.recoveryProtected) issues.push("The pre-upload recovery checkpoint was not confirmed.");
  if (!checks.reloadPassed) issues.push("The saved take did not pass page-reload verification.");
  if (!checks.playbackPassed) issues.push("The complete saved take did not pass playback review.");
  if (checks.clipped) issues.push("Clipping was detected during the long recording.");
  if (checks.errorCount > 0) issues.push(`${checks.errorCount} recording error${checks.errorCount === 1 ? " was" : "s were"} observed.`);
  const attempted = durationMinutes > 0 || Object.values(checks).some((value) => value === true) || errorCount > 0;
  return { status: issues.length === 0 ? "passed" : attempted ? "needs-review" : "incomplete", durationMinutes, checks, issues, productionEvidenceComplete: issues.length === 0 };
}
