import { describe, expect, it } from "vitest";
import { createTimelineDawTrackConsolidationPlan } from "../../lib/timeline/TimelineDawTrackConsolidationPolicy";

describe("DAW track consolidation policy", () => {
  it("creates a deterministic plan from two or more unique tracks", () => {
    expect(createTimelineDawTrackConsolidationPlan([" lane-1 ", "lane-2", "lane-1"])).toEqual({
      laneIds: ["lane-1", "lane-2"],
      busName: "Consolidated 2 Tracks",
    });
  });

  it("rejects unsafe consolidation selections", () => {
    expect(() => createTimelineDawTrackConsolidationPlan(["lane-1"])).toThrow(/at least two/i);
    expect(() => createTimelineDawTrackConsolidationPlan(Array.from({ length: 65 }, (_, index) => `lane-${index}`))).toThrow(/64/);
  });
});
