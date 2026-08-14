import { createHash, randomBytes } from "node:crypto";

export type TimelineDawBetaEnvironment = { secureContext: boolean; supportedBrowser: boolean; audioInput: boolean; audioOutput: boolean; localStorage: boolean; fileApi: boolean; supportedAudioTypes: boolean };
export type TimelineDawBetaReleaseInput = { enrolled: boolean; acknowledged: boolean; environment: TimelineDawBetaEnvironment; workflowPercent: number; workflowComplete: boolean; exportReady: boolean; blockingFeedback: number; unresolvedFeedback: number; integrityBlockers: number };
export const TIMELINE_DAW_BETA_ACKNOWLEDGEMENT_VERSION = "2026-08-14-v1";

export function createTimelineDawBetaInviteCode() { return randomBytes(18).toString("base64url"); }
export function hashTimelineDawBetaInviteCode(code: string) { return `sha256:${createHash("sha256").update(code.trim()).digest("hex")}`; }

export function parseTimelineDawBetaEnvironment(input: unknown): TimelineDawBetaEnvironment {
  if (!input || typeof input !== "object") throw new Error("Environment check is required.");
  const value = input as Record<string, unknown>, keys: Array<keyof TimelineDawBetaEnvironment> = ["secureContext", "supportedBrowser", "audioInput", "audioOutput", "localStorage", "fileApi", "supportedAudioTypes"];
  for (const key of keys) if (typeof value[key] !== "boolean") throw new Error(`Environment result ${key} is invalid.`);
  return Object.fromEntries(keys.map((key) => [key, value[key]])) as TimelineDawBetaEnvironment;
}

export function evaluateTimelineDawBetaRelease(input: TimelineDawBetaReleaseInput) {
  const environmentFailures = Object.entries(input.environment).filter(([, ready]) => !ready).map(([name]) => name);
  const blockers = [
    ...(!input.enrolled ? ["Tester enrollment is not active."] : []),
    ...(!input.acknowledged ? ["Privacy and beta-risk acknowledgement is required."] : []),
    ...environmentFailures.map((name) => `Environment check failed: ${name}.`),
    ...(input.workflowPercent < 100 || !input.workflowComplete ? ["Guided workflow is incomplete."] : []),
    ...(!input.exportReady ? ["A verified export is not ready."] : []),
    ...(input.blockingFeedback ? [`${input.blockingFeedback} blocking feedback report(s) remain unresolved.`] : []),
    ...(input.integrityBlockers ? [`${input.integrityBlockers} integrity blocker(s) require review.`] : []),
  ];
  return { ready: blockers.length === 0, blockers, warnings: input.unresolvedFeedback > input.blockingFeedback ? [`${input.unresolvedFeedback - input.blockingFeedback} non-blocking report(s) remain open.`] : [], environmentFailures };
}

export function createTimelineDawBetaOnboardingReceipt(input: Record<string, unknown>) {
  const body = { schema: "the-muzes-garden/daw-beta-onboarding/v1", ...input };
  return { ...body, checksum: `sha256:${createHash("sha256").update(JSON.stringify(body)).digest("hex")}` };
}
