import { createHash } from "node:crypto";

export const TIMELINE_DAW_BETA_OPERATIONS = ["pause", "resume", "complete", "revoke"] as const;
export type TimelineDawBetaOperation = (typeof TIMELINE_DAW_BETA_OPERATIONS)[number];
export type TimelineDawBetaEnrollmentState = "active" | "paused" | "completed" | "revoked";

export function transitionTimelineDawBetaEnrollment(current: TimelineDawBetaEnrollmentState, operation: TimelineDawBetaOperation) {
  const transitions: Record<TimelineDawBetaEnrollmentState, Partial<Record<TimelineDawBetaOperation, TimelineDawBetaEnrollmentState>>> = {
    active: { pause: "paused", complete: "completed", revoke: "revoked" },
    paused: { resume: "active", complete: "completed", revoke: "revoked" },
    completed: { resume: "active", revoke: "revoked" },
    revoked: {},
  };
  const next = transitions[current][operation];
  if (!next) throw new Error(`Tester operation ${operation} is not allowed from ${current}.`);
  return next;
}

export function parseTimelineDawBetaOperation(input: Record<string, unknown>) {
  const operation = String(input.operation ?? "") as TimelineDawBetaOperation;
  if (!TIMELINE_DAW_BETA_OPERATIONS.includes(operation)) throw new Error("Tester operation is invalid.");
  const reason = String(input.reason ?? "").trim();
  if (reason.length < 5 || reason.length > 500) throw new Error("Operation reason must contain 5-500 characters.");
  return { operation, reason };
}

export function evaluateTimelineDawBetaPackage(input: { candidateReady: boolean; workflowComplete: boolean; auditionPublished: boolean; activeOrCompletedTesters: number }) {
  const blockers = [
    ...(!input.candidateReady ? ["The latest release-candidate gate has not passed."] : []),
    ...(!input.workflowComplete ? ["The guided beta workflow is incomplete."] : []),
    ...(!input.auditionPublished ? ["No approved audition master is published."] : []),
    ...(input.activeOrCompletedTesters < 1 ? ["At least one active or completed tester is required."] : []),
  ];
  return { ready: blockers.length === 0, blockers, ...input };
}

export function createTimelineDawBetaPackageChecksum(input: Record<string, unknown>) { return `sha256:${createHash("sha256").update(JSON.stringify(input)).digest("hex")}`; }

export function renderTimelineDawBetaCompatibilitySummary(input: { generatedAt: string; sessionId: string; testerCount: number; environmentReady: number; released: number; completed: number; workflowPercent: number; auditionRevision: number | null; packageReady: boolean }) {
  return [`THE MUZES GARDEN - DAW BETA COMPATIBILITY SUMMARY`, `Generated: ${input.generatedAt}`, `Session: ${input.sessionId}`, `Testers: ${input.testerCount}`, `Environment ready: ${input.environmentReady}`, `Released: ${input.released}`, `Completed: ${input.completed}`, `Workflow: ${input.workflowPercent}%`, `Audition revision: ${input.auditionRevision ?? "not published"}`, `Release package: ${input.packageReady ? "READY" : "HELD"}`, `Private project data and storage paths are intentionally excluded.`].join("\n");
}
