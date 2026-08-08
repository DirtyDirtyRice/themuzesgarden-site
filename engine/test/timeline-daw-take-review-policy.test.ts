import { describe, expect, it } from "vitest";
import { parseTimelineDawTakeReview } from "../../lib/timeline/TimelineDawTakeReviewPolicy";

describe("TimelineDawTakeReviewPolicy", () => {
  it("normalizes a bounded take review", () => {
    expect(parseTimelineDawTakeReview({
      name: "  Lead   Vocal Take 3  ",
      notes: "  Best final chorus.  ",
      rating: 5,
    })).toEqual({
      name: "Lead Vocal Take 3",
      notes: "Best final chorus.",
      rating: 5,
    });
  });

  it("rejects invalid names, notes, and ratings", () => {
    expect(() => parseTimelineDawTakeReview({ name: "", notes: "", rating: 0 })).toThrow(/name/);
    expect(() => parseTimelineDawTakeReview({ name: "Take", notes: "x".repeat(1001), rating: 1 })).toThrow(/notes/);
    expect(() => parseTimelineDawTakeReview({ name: "Take", notes: "", rating: 4.5 })).toThrow(/integer/);
    expect(() => parseTimelineDawTakeReview({ name: "Take", notes: "", rating: 6 })).toThrow(/0 to 5/);
  });
});
