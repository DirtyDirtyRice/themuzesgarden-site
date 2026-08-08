import { describe, expect, it } from "vitest";
import { parseTimelineDawTakeCompRecipe } from "../../lib/timeline/TimelineDawTakeCompPolicy";

const durations = new Map([
  ["take-a", 12],
  ["take-b", 9.5],
]);

describe("TimelineDawTakeCompPolicy", () => {
  it("normalizes a bounded, ordered multi-take recipe", () => {
    expect(parseTimelineDawTakeCompRecipe({
      name: "  Lead   Vocal Comp  ",
      regions: [
        { takeId: "take-a", startSeconds: 0, endSeconds: 4.25 },
        { takeId: "take-b", startSeconds: 4.25, endSeconds: 9.5 },
      ],
    }, durations)).toEqual({
      name: "Lead Vocal Comp",
      regions: [
        { takeId: "take-a", startSeconds: 0, endSeconds: 4.25 },
        { takeId: "take-b", startSeconds: 4.25, endSeconds: 9.5 },
      ],
    });
  });

  it("rejects unavailable, out-of-bounds, overlapping, and single-take recipes", () => {
    expect(() => parseTimelineDawTakeCompRecipe({
      name: "Comp",
      regions: [
        { takeId: "take-a", startSeconds: 0, endSeconds: 3 },
        { takeId: "missing", startSeconds: 3, endSeconds: 4 },
      ],
    }, durations)).toThrow(/unavailable/);
    expect(() => parseTimelineDawTakeCompRecipe({
      name: "Comp",
      regions: [
        { takeId: "take-a", startSeconds: 0, endSeconds: 13 },
        { takeId: "take-b", startSeconds: 0, endSeconds: 1 },
      ],
    }, durations)).toThrow(/duration/);
    expect(() => parseTimelineDawTakeCompRecipe({
      name: "Comp",
      regions: [
        { takeId: "take-a", startSeconds: 0, endSeconds: 4 },
        { takeId: "take-b", startSeconds: 0, endSeconds: 1 },
        { takeId: "take-a", startSeconds: 3, endSeconds: 5 },
      ],
    }, durations)).toThrow(/overlap/);
    expect(() => parseTimelineDawTakeCompRecipe({
      name: "Comp",
      regions: [
        { takeId: "take-a", startSeconds: 0, endSeconds: 3 },
        { takeId: "take-a", startSeconds: 3, endSeconds: 5 },
      ],
    }, durations)).toThrow(/two different takes/);
  });
});
