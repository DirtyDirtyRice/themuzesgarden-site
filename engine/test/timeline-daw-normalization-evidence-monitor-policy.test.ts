import { describe, expect, it } from "vitest";
import { assertTimelineDawNormalizationRecoveryPlan, classifyTimelineDawNormalizationEvidenceIssue, createTimelineDawNormalizationMonitoringCheckpoint, createTimelineDawNormalizationRecoveryPlan, createTimelineDawNormalizationRecoveryReceipt } from "../../lib/timeline/TimelineDawNormalizationEvidenceMonitorPolicy";

describe("normalization evidence monitoring", () => {
  it("classifies coverage and each integrity failure", () => {
    expect(classifyTimelineDawNormalizationEvidenceIssue({ complete: false, valid: true, reason: "valid" })).toBe("coverage-gap");
    expect(classifyTimelineDawNormalizationEvidenceIssue({ complete: true, valid: false, reason: "Previous hash does not match." })).toBe("previous-hash");
    expect(classifyTimelineDawNormalizationEvidenceIssue({ complete: true, valid: false, reason: "Chain hash does not match reconstructed event." })).toBe("chain-hash");
    expect(classifyTimelineDawNormalizationEvidenceIssue({ complete: true, valid: false, reason: "Subject checksum does not match." })).toBe("subject-checksum");
    expect(classifyTimelineDawNormalizationEvidenceIssue({ complete: true, valid: false, reason: "Chain chronology is invalid." })).toBe("chronology");
    expect(classifyTimelineDawNormalizationEvidenceIssue({ complete: true, valid: true, reason: "valid" })).toBe("healthy");
  });
  it("creates deterministic checkpoints and guarded recovery plans", () => {
    const checkpoint = createTimelineDawNormalizationMonitoringCheckpoint({ sessionId: "s", headHash: "h", linkCount: 2, coverage: { complete: false }, verification: { valid: true }, issue: "coverage-gap", observedAt: "2026-08-14T00:00:00.000Z" });
    expect(checkpoint.checksum).toMatch(/^sha256:/);
    const plan = createTimelineDawNormalizationRecoveryPlan({ checkpointChecksum: checkpoint.checksum, issue: "coverage-gap", coveragePlanChecksum: "p" });
    expect(() => assertTimelineDawNormalizationRecoveryPlan(plan, checkpoint.checksum)).not.toThrow();
    expect(() => assertTimelineDawNormalizationRecoveryPlan(plan, "new")).toThrow("stale");
  });
  it("quarantines corruption and checksum-protects receipts", () => {
    const plan = createTimelineDawNormalizationRecoveryPlan({ checkpointChecksum: "c", issue: "chain-hash" });
    expect(plan.actions).toEqual(["quarantine-chain", "manual-investigation"]);
    expect(() => assertTimelineDawNormalizationRecoveryPlan(plan, "c")).toThrow("manual investigation");
    expect(createTimelineDawNormalizationRecoveryReceipt({ incidentId: "i", result: "recovered" }).checksum).toMatch(/^sha256:/);
  });
});
