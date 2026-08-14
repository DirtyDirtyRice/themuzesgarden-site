import { describe, expect, it } from "vitest";
import { evaluateTimelineDawTechnicalTest } from "../../lib/timeline/TimelineDawTechnicalTestPolicy";
import { buildTimelineDawOwnerTestReport, type TimelineDawReportObservation } from "../../lib/timeline/TimelineDawOwnerTestReportPolicy";

const completeEvidence = { audioSourceCount: 1, editCount: 1, mixControlCount: 1, snapshotCount: 1, completedExportCount: 1 };
const observation = (step: TimelineDawReportObservation["step"], outcome: TimelineDawReportObservation["outcome"]): TimelineDawReportObservation => ({ id: step, step, outcome, notes: "", clickCount: 2, excessiveSteps: false, screenshotDataUrl: null, failureContext: {}, createdAt: "2026-08-15T07:00:00.000Z" });

describe("TimelineDawOwnerTestReportPolicy", () => {
  it("keeps technical proof separate from missing human judgment", () => {
    const report = buildTimelineDawOwnerTestReport({ generatedAt: "2026-08-15T08:00:00.000Z", technicalResults: evaluateTimelineDawTechnicalTest(completeEvidence).results, observations: [] });
    expect(report.verifiedCount).toBe(0);
    expect(report.humanRequiredCount).toBe(7);
    expect(report.findings.find((item) => item.step === "import")?.technical?.status).toBe("verified");
  });

  it("marks a failed musician observation for attention", () => {
    const report = buildTimelineDawOwnerTestReport({ generatedAt: "2026-08-15T08:00:00.000Z", technicalResults: evaluateTimelineDawTechnicalTest(completeEvidence).results, observations: [observation("audition", "fail")] });
    expect(report.attentionRequiredCount).toBe(1);
    expect(report.findings.find((item) => item.step === "audition")?.status).toBe("attention-required");
  });

  it("verifies a finding only when machine proof and the human pass agree", () => {
    const report = buildTimelineDawOwnerTestReport({ generatedAt: "2026-08-15T08:00:00.000Z", technicalResults: evaluateTimelineDawTechnicalTest(completeEvidence).results, observations: [observation("import", "pass")] });
    expect(report.findings.find((item) => item.step === "import")?.status).toBe("verified");
    expect(report.findings.find((item) => item.step === "audition")?.status).toBe("human-required");
  });
});
