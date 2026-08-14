import { createHash } from "node:crypto";

export type TimelineDawBetaLaunchState = "active" | "paused" | "closed";
export type TimelineDawBetaLaunchOperation = "pause" | "resume" | "close";
export type TimelineDawBetaTelemetry = { portalEntries: number; allowedAuthorizations: number; auditionCompleted: boolean; workflowPercent: number; feedbackEvents: number; testerCompleted: boolean; lastActivityAt: string | null };

export function transitionTimelineDawBetaLaunch(state: TimelineDawBetaLaunchState, operation: TimelineDawBetaLaunchOperation): TimelineDawBetaLaunchState {
  const transitions: Record<TimelineDawBetaLaunchState, Partial<Record<TimelineDawBetaLaunchOperation, TimelineDawBetaLaunchState>>> = { active: { pause: "paused", close: "closed" }, paused: { resume: "active", close: "closed" }, closed: {} };
  const next = transitions[state][operation]; if (!next) throw Error(`Launch operation ${operation} is not allowed from ${state}.`); return next;
}
export function parseTimelineDawBetaLaunchReason(value: unknown) { const reason = String(value ?? "").trim(); if (reason.length < 5 || reason.length > 500) throw Error("Launch reason must contain 5-500 characters."); return reason; }
export function evaluateTimelineDawBetaTesterActivity(input: { telemetry: TimelineDawBetaTelemetry; now: string; launchedAt: string; stalledAfterHours?: number }) {
  const last = input.telemetry.lastActivityAt ?? input.launchedAt, elapsedHours = Math.max(0, (Date.parse(input.now) - Date.parse(last)) / 3_600_000), threshold = input.stalledAfterHours ?? 72;
  const complete = input.telemetry.testerCompleted, stalled = !complete && elapsedHours >= threshold;
  const nextAction = complete ? "Tester completed the beta path." : stalled ? "Contact the tester or pause their launch access." : input.telemetry.allowedAuthorizations < 1 ? "Tester should open the permitted session." : !input.telemetry.auditionCompleted ? "Tester should complete the published audition." : input.telemetry.feedbackEvents < 1 ? "Tester should submit or confirm feedback." : "Tester should finish the guided workflow.";
  return { complete, stalled, elapsedHours: Math.round(elapsedHours * 10) / 10, nextAction };
}
export function createTimelineDawBetaLaunchChecksum(input: Record<string, unknown>) { return `sha256:${createHash("sha256").update(JSON.stringify(input)).digest("hex")}`; }
