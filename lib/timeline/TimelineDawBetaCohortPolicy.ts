import { createHash } from "node:crypto";

export const TIMELINE_DAW_BETA_COHORT_STATUSES = ["invited", "enrolled", "released", "actively-testing", "blocked", "completed"] as const;
export type TimelineDawBetaCohortStatus = (typeof TIMELINE_DAW_BETA_COHORT_STATUSES)[number];

export type TimelineDawBetaTesterEvidence = {
  enrollmentState: string;
  acknowledged: boolean;
  environmentReady: boolean;
  released: boolean;
  allowedAccessCount: number;
  reportCount: number;
  unresolvedMajorOrBlocking: number;
  replyNeededCount: number;
  testAgainCount: number;
  completedTestAgainCount: number;
  workflowComplete: boolean;
  exportReady: boolean;
};

export function deriveTimelineDawBetaCohortStatus(evidence: TimelineDawBetaTesterEvidence): TimelineDawBetaCohortStatus {
  if (evidence.unresolvedMajorOrBlocking > 0 || evidence.replyNeededCount > 0 || evidence.testAgainCount > evidence.completedTestAgainCount) return "blocked";
  const hasTested = evidence.allowedAccessCount > 0 || evidence.reportCount > 0;
  if (evidence.released && hasTested && evidence.workflowComplete && evidence.exportReady) return "completed";
  if (evidence.released && hasTested) return "actively-testing";
  if (evidence.released) return "released";
  return "enrolled";
}

export type TimelineDawBetaCandidateInput = {
  minimumCompletedTesters: number;
  completedTesterCount: number;
  unresolvedMajorOrBlocking: number;
  integrityBlockers: number;
  workflowComplete: boolean;
  exportReady: boolean;
};

export function evaluateTimelineDawBetaCandidate(input: TimelineDawBetaCandidateInput) {
  if (!Number.isInteger(input.minimumCompletedTesters) || input.minimumCompletedTesters < 1 || input.minimumCompletedTesters > 100) throw new Error("Minimum completed testers must be a whole number from 1 to 100.");
  const blockers: string[] = [];
  if (input.completedTesterCount < input.minimumCompletedTesters) blockers.push(`${input.minimumCompletedTesters - input.completedTesterCount} more completed tester(s) required.`);
  if (input.unresolvedMajorOrBlocking > 0) blockers.push(`${input.unresolvedMajorOrBlocking} major or blocking report(s) remain unresolved.`);
  if (input.integrityBlockers > 0) blockers.push(`${input.integrityBlockers} integrity incident(s) require resolution.`);
  if (!input.workflowComplete) blockers.push("The beta workflow is incomplete.");
  if (!input.exportReady) blockers.push("A verified export is not ready.");
  return { ready: blockers.length === 0, blockers, ...input };
}

export function createTimelineDawBetaCandidateChecksum(input: Record<string, unknown>) {
  return `sha256:${createHash("sha256").update(JSON.stringify(input)).digest("hex")}`;
}
