import { describe, expect, it } from "vitest";
import { evaluateTimelineDawTechnicalTest } from "../../lib/timeline/TimelineDawTechnicalTestPolicy";
import type { TimelineDawOwnerTestEvidence } from "../../lib/timeline/TimelineDawOwnerMusicianTestPolicy";

const empty: TimelineDawOwnerTestEvidence = {
  audioSourceCount: 0,
  editCount: 0,
  mixControlCount: 0,
  snapshotCount: 0,
  completedExportCount: 0,
};

describe("TimelineDawTechnicalTestPolicy", () => {
  it("keeps listening judgment separate from technical proof", () => {
    const evaluation = evaluateTimelineDawTechnicalTest(empty);
    expect(evaluation.results).toHaveLength(7);
    expect(evaluation.results.find((item) => item.step === "audition")?.status).toBe(
      "human-required",
    );
    expect(evaluation.humanRequiredCount).toBe(1);
  });

  it("holds every missing durable technical requirement", () => {
    const evaluation = evaluateTimelineDawTechnicalTest(empty);
    expect(evaluation.verifiedCount).toBe(0);
    expect(evaluation.heldCount).toBe(6);
    expect(evaluation.readyForHuman).toBe(false);
  });

  it("becomes ready for a short human audition when all technical evidence exists", () => {
    const evaluation = evaluateTimelineDawTechnicalTest({
      audioSourceCount: 2,
      editCount: 1,
      mixControlCount: 3,
      snapshotCount: 1,
      completedExportCount: 1,
    });
    expect(evaluation.verifiedCount).toBe(6);
    expect(evaluation.heldCount).toBe(0);
    expect(evaluation.readyForHuman).toBe(true);
    expect(
      evaluation.results.every((item) => Boolean(item.lessonId) && Boolean(item.anchor)),
    ).toBe(true);
  });
});
