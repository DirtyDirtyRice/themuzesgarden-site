import { describe, expect, it } from "vitest";
import { createTimelineDawBetaCandidateChecksum, deriveTimelineDawBetaCohortStatus, evaluateTimelineDawBetaCandidate, type TimelineDawBetaTesterEvidence } from "../../lib/timeline/TimelineDawBetaCohortPolicy";

const evidence: TimelineDawBetaTesterEvidence = { enrollmentState: "active", acknowledged: true, environmentReady: true, released: true, allowedAccessCount: 2, reportCount: 1, unresolvedMajorOrBlocking: 0, replyNeededCount: 0, testAgainCount: 1, completedTestAgainCount: 1, workflowComplete: true, exportReady: true };

describe("DAW beta cohort policy", () => {
  it("distinguishes enrollment, release, testing, blocking, and completion", () => {
    expect(deriveTimelineDawBetaCohortStatus({ ...evidence, released: false, allowedAccessCount: 0, reportCount: 0 })).toBe("enrolled");
    expect(deriveTimelineDawBetaCohortStatus({ ...evidence, allowedAccessCount: 0, reportCount: 0 })).toBe("released");
    expect(deriveTimelineDawBetaCohortStatus({ ...evidence, workflowComplete: false })).toBe("actively-testing");
    expect(deriveTimelineDawBetaCohortStatus({ ...evidence, unresolvedMajorOrBlocking: 1 })).toBe("blocked");
    expect(deriveTimelineDawBetaCohortStatus({ ...evidence, enrollmentState: "paused" })).toBe("blocked");
    expect(deriveTimelineDawBetaCohortStatus({ ...evidence, enrollmentState: "completed", released: false, allowedAccessCount: 0, reportCount: 0 })).toBe("completed");
    expect(deriveTimelineDawBetaCohortStatus(evidence)).toBe("completed");
  });
  it("holds a candidate until tester, severity, integrity, workflow, and export gates pass", () => {
    expect(evaluateTimelineDawBetaCandidate({ minimumCompletedTesters: 2, completedTesterCount: 2, unresolvedMajorOrBlocking: 0, integrityBlockers: 0, workflowComplete: true, exportReady: true })).toMatchObject({ ready: true, blockers: [] });
    const held = evaluateTimelineDawBetaCandidate({ minimumCompletedTesters: 2, completedTesterCount: 1, unresolvedMajorOrBlocking: 1, integrityBlockers: 1, workflowComplete: false, exportReady: false });
    expect(held.ready).toBe(false);
    expect(held.blockers).toHaveLength(5);
  });
  it("creates deterministic checksum-protected candidate evidence", () => {
    const input = { sessionId: "session-1", observedAt: "2026-08-14T00:00:00.000Z", ready: true };
    expect(createTimelineDawBetaCandidateChecksum(input)).toBe(createTimelineDawBetaCandidateChecksum(input));
    expect(createTimelineDawBetaCandidateChecksum(input)).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});
