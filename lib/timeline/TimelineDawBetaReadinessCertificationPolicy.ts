import { createHash } from "node:crypto";

export const TIMELINE_DAW_BETA_CERTIFICATION_CHECKS = ["enrollment", "release", "authorization", "audition", "workflow", "feedback", "operations"] as const;
export type TimelineDawBetaCertificationCheck = (typeof TIMELINE_DAW_BETA_CERTIFICATION_CHECKS)[number];
export type TimelineDawBetaCertificationEvidence = Record<TimelineDawBetaCertificationCheck, boolean>;

const labels: Record<TimelineDawBetaCertificationCheck, string> = {
  enrollment: "Tester enrollment is active and environment-ready.",
  release: "The owner release gate passed for this tester.",
  authorization: "A live session authorization was allowed.",
  audition: "An approved audition master is currently published.",
  workflow: "The durable six-stage beta workflow is complete.",
  feedback: "The tester feedback path has durable evidence.",
  operations: "The latest tester operation permits active access.",
};

export function evaluateTimelineDawBetaReadiness(evidence: TimelineDawBetaCertificationEvidence) {
  const checks = TIMELINE_DAW_BETA_CERTIFICATION_CHECKS.map(key => ({ key, passed: evidence[key], detail: labels[key] }));
  return { ready: checks.every(check => check.passed), checks, blockers: checks.filter(check => !check.passed).map(check => check.detail) };
}

export function createTimelineDawBetaCertificationChecksum(input: Record<string, unknown>) {
  return `sha256:${createHash("sha256").update(JSON.stringify(input)).digest("hex")}`;
}
