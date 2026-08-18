import { describe, expect, it } from "vitest";
import { parseTimelineDawPrivateLaneSplit } from "../../lib/timeline/TimelineDawPrivateLaneSplitPolicy";

describe("private lane split policy", () => {
  it("aligns the timeline and source boundary to the same exact sample frame", () => {
    expect(parseTimelineDawPrivateLaneSplit({ timelineSplitSeconds: 12.100009 }, 48_000, 12, 0.25, 2.25, 0.05, 0.1)).toEqual({
      timelineSplitSeconds: 12.1,
      sourceSplitSeconds: 0.35,
      leftFrameCount: 4_800,
      rightFrameCount: 91_200,
    });
  });

  it("rejects endpoints and splits that would truncate an outer fade", () => {
    expect(() => parseTimelineDawPrivateLaneSplit({ timelineSplitSeconds: 5 }, 48_000, 5, 0, 2, 0, 0)).toThrow(/one source frame/);
    expect(() => parseTimelineDawPrivateLaneSplit({ timelineSplitSeconds: 5.1 }, 48_000, 5, 0, 2, 0.2, 0)).toThrow(/outside the existing edge fades/);
    expect(() => parseTimelineDawPrivateLaneSplit({ timelineSplitSeconds: 6.9 }, 48_000, 5, 0, 2, 0, 0.2)).toThrow(/outside the existing edge fades/);
  });

  it("preserves source-to-timeline continuity at the normalized boundary", () => {
    const split = parseTimelineDawPrivateLaneSplit({ timelineSplitSeconds: 8.33334 }, 44_100, 8, 1, 3, 0, 0);
    expect(split.timelineSplitSeconds - 8).toBeCloseTo(split.sourceSplitSeconds - 1, 12);
    expect(split.leftFrameCount + split.rightFrameCount).toBe(88_200);
  });

  it("cuts a stretched track at the place the musician hears", () => {
    const split = parseTimelineDawPrivateLaneSplit(
      { timelineSplitSeconds: 14 }, 48_000, 10, 2, 8, 0, 0, 2, false,
    );
    expect(split).toEqual({
      timelineSplitSeconds: 14,
      sourceSplitSeconds: 4,
      leftFrameCount: 96_000,
      rightFrameCount: 192_000,
    });
  });

  it("uses normal timing when a saved stretch is bypassed", () => {
    const split = parseTimelineDawPrivateLaneSplit(
      { timelineSplitSeconds: 12 }, 48_000, 10, 2, 8, 0, 0, 2, true,
    );
    expect(split.sourceSplitSeconds).toBe(4);
    expect(split.timelineSplitSeconds).toBe(12);
  });
});
