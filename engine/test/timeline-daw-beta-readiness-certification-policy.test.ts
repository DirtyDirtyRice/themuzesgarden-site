import { describe, expect, it } from "vitest";
import { createTimelineDawBetaCertificationChecksum, evaluateTimelineDawBetaReadiness } from "../../lib/timeline/TimelineDawBetaReadinessCertificationPolicy";

const complete = { enrollment: true, release: true, authorization: true, audition: true, workflow: true, feedback: true, operations: true };
describe("DAW beta readiness certification policy", () => {
  it("certifies only a complete end-to-end evidence chain", () => expect(evaluateTimelineDawBetaReadiness(complete)).toMatchObject({ ready: true, blockers: [] }));
  it("identifies every missing independent check", () => {
    const result = evaluateTimelineDawBetaReadiness({ ...complete, authorization: false, feedback: false });
    expect(result.ready).toBe(false); expect(result.blockers).toHaveLength(2); expect(result.checks.filter(check => !check.passed).map(check => check.key)).toEqual(["authorization", "feedback"]);
  });
  it("creates deterministic tamper-evident receipts", () => {
    expect(createTimelineDawBetaCertificationChecksum({ sessionId: "s1", complete })).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(createTimelineDawBetaCertificationChecksum({ sessionId: "s1", complete })).toBe(createTimelineDawBetaCertificationChecksum({ sessionId: "s1", complete }));
  });
});
