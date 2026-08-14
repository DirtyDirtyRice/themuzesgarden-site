import { describe, expect, it } from "vitest";
import { createTimelineDawBetaFeedbackChecksum, deriveTimelineDawBetaReviewStatus, parseTimelineDawBetaFeedback, summarizeTimelineDawBetaFeedback, transitionTimelineDawBetaIssue } from "../../lib/timeline/TimelineDawBetaFeedbackPolicy";

describe("DAW beta feedback policy", () => {
  it("accepts structured checkpoint-bound feedback", () => expect(parseTimelineDawBetaFeedback({ stage: "edit", severity: "major", reproducibility: "always", summary: "Split moved the wrong clip", expectedBehavior: "Only the selected clip should move.", reproductionNotes: "Select lane one, split, then move the right region.", checkpointChecksum: `sha256:${"a".repeat(64)}` }).stage).toBe("edit"));
  it("enforces issue lifecycle transitions", () => { expect(transitionTimelineDawBetaIssue("open", "investigating")).toBe("investigating"); expect(() => transitionTimelineDawBetaIssue("resolved", "open")).toThrow(); });
  it("summarizes feedback without protected content", () => { const summary = summarizeTimelineDawBetaFeedback([{ stage: "mix", severity: "blocking", state: "open", reproducibility: "always" }], { percent: 67, blockers: ["failed"], complete: false, exportReady: false }); expect(summary).toMatchObject({ feedbackTotal: 1, openFeedback: 1, blockerCount: 1 }); expect(createTimelineDawBetaFeedbackChecksum(summary)).toMatch(/^sha256:/); });
  it("identifies reply-needed and test-again review states", () => { const events = [{ event: "responded", actorId: "tester", createdAt: "2026-08-14T22:00:00Z" }]; expect(deriveTimelineDawBetaReviewStatus("open", events, "owner")).toBe("reply-needed"); expect(deriveTimelineDawBetaReviewStatus("reopened", events, "tester")).toBe("test-again"); });
});
