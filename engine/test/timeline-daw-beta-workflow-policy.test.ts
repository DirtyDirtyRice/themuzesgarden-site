import { describe, expect, it } from "vitest";
import { createTimelineDawBetaWorkflowReceipt, evaluateTimelineDawBetaWorkflow } from "../../lib/timeline/TimelineDawBetaWorkflowPolicy";

const evidence = { sessionExists: true, audioSourceCount: 1, editCount: 1, mixControlCount: 1, snapshotCount: 1, completedExportCount: 0, failedJobCount: 0, unresolvedIntegrityCount: 0 };

describe("DAW beta workflow policy", () => {
  it("finds the exact next stage", () => {
    const result = evaluateTimelineDawBetaWorkflow(evidence);
    expect(result.completed).toBe(5);
    expect(result.next?.stage).toBe("export");
    expect(result.exportReady).toBe(true);
  });

  it("blocks delivery when durable failures remain", () => {
    const result = evaluateTimelineDawBetaWorkflow({ ...evidence, completedExportCount: 1, unresolvedIntegrityCount: 1 });
    expect(result.complete).toBe(false);
    expect(result.blockers[0]).toContain("integrity");
  });

  it("creates a checksum-protected resumable receipt", () => {
    const receipt = createTimelineDawBetaWorkflowReceipt({ sessionId: "session-1", evidence, observedAt: "2026-08-14T17:00:00.000Z" });
    expect(receipt.checksum).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(receipt.evaluation.percent).toBe(83);
  });
});
