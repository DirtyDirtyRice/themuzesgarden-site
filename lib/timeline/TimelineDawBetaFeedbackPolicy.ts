import { createHash } from "node:crypto";
import { TIMELINE_DAW_BETA_STAGES, type TimelineDawBetaStage } from "./TimelineDawBetaWorkflowPolicy";

export const TIMELINE_DAW_BETA_SEVERITIES = ["suggestion", "minor", "major", "blocking"] as const;
export const TIMELINE_DAW_BETA_REPRODUCIBILITY = ["once", "sometimes", "always", "not-tested"] as const;
export const TIMELINE_DAW_BETA_ISSUE_STATES = ["open", "investigating", "resolved", "reopened"] as const;
export type TimelineDawBetaSeverity = (typeof TIMELINE_DAW_BETA_SEVERITIES)[number];
export type TimelineDawBetaReproducibility = (typeof TIMELINE_DAW_BETA_REPRODUCIBILITY)[number];
export type TimelineDawBetaIssueState = (typeof TIMELINE_DAW_BETA_ISSUE_STATES)[number];

const clean = (value: unknown, name: string, minimum: number, maximum: number) => {
  if (typeof value !== "string") throw new Error(`${name} is required.`);
  const result = value.trim();
  if (result.length < minimum || result.length > maximum) throw new Error(`${name} must contain ${minimum}-${maximum} characters.`);
  return result;
};

export function parseTimelineDawBetaFeedback(input: Record<string, unknown>) {
  if (!TIMELINE_DAW_BETA_STAGES.includes(input.stage as TimelineDawBetaStage)) throw new Error("Feedback stage is invalid.");
  if (!TIMELINE_DAW_BETA_SEVERITIES.includes(input.severity as TimelineDawBetaSeverity)) throw new Error("Feedback severity is invalid.");
  if (!TIMELINE_DAW_BETA_REPRODUCIBILITY.includes(input.reproducibility as TimelineDawBetaReproducibility)) throw new Error("Feedback reproducibility is invalid.");
  const checkpointChecksum = clean(input.checkpointChecksum, "Checkpoint checksum", 71, 71);
  if (!/^sha256:[a-f0-9]{64}$/.test(checkpointChecksum)) throw new Error("Checkpoint checksum is invalid.");
  return { stage: input.stage as TimelineDawBetaStage, severity: input.severity as TimelineDawBetaSeverity, reproducibility: input.reproducibility as TimelineDawBetaReproducibility, summary: clean(input.summary, "Summary", 5, 160), expectedBehavior: clean(input.expectedBehavior, "Expected behavior", 5, 2000), reproductionNotes: clean(input.reproductionNotes, "Reproduction notes", 5, 4000), checkpointChecksum };
}

export function transitionTimelineDawBetaIssue(current: TimelineDawBetaIssueState, next: TimelineDawBetaIssueState) {
  const allowed: Record<TimelineDawBetaIssueState, TimelineDawBetaIssueState[]> = { open: ["investigating", "resolved"], investigating: ["resolved", "reopened"], resolved: ["reopened"], reopened: ["investigating", "resolved"] };
  if (!allowed[current].includes(next)) throw new Error(`Beta issue cannot move from ${current} to ${next}.`);
  return next;
}

export function createTimelineDawBetaFeedbackChecksum(input: Record<string, unknown>) {
  return `sha256:${createHash("sha256").update(JSON.stringify(input)).digest("hex")}`;
}

export function summarizeTimelineDawBetaFeedback(rows: Array<{ stage: string; severity: string; state: string; reproducibility: string }>, workflow: { percent: number; blockers: string[]; complete: boolean; exportReady: boolean }) {
  const count = (key: "stage" | "severity" | "state" | "reproducibility") => Object.fromEntries([...new Set(rows.map((row) => row[key]))].sort().map((value) => [value, rows.filter((row) => row[key] === value).length]));
  return { workflowPercent: workflow.percent, workflowComplete: workflow.complete, exportReady: workflow.exportReady, blockerCount: workflow.blockers.length, feedbackTotal: rows.length, openFeedback: rows.filter((row) => row.state !== "resolved").length, byStage: count("stage"), bySeverity: count("severity"), byState: count("state"), byReproducibility: count("reproducibility") };
}
