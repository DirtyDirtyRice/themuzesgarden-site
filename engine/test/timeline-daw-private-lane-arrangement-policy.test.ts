import { describe, expect, it } from "vitest";
import { parseTimelineDawPrivateLaneArrangement } from "../../lib/timeline/TimelineDawPrivateLaneArrangementPolicy";

describe("TimelineDawPrivateLaneArrangementPolicy", () => {
  it("normalizes source boundaries to exact sample frames", () => {
    expect(parseTimelineDawPrivateLaneArrangement({
      timelineStartSeconds: 4.2504,
      sourceInSeconds: 0.100009,
      sourceOutSeconds: 1.900009,
    }, 48_000, 96_000)).toEqual({
      timelineStartSeconds: 4.25,
      sourceInSeconds: 0.1,
      sourceOutSeconds: 1.9,
      sourceInFrame: 4_800,
      sourceOutFrame: 91_200,
    });
  });

  it("rejects invalid positions and source ranges", () => {
    expect(() => parseTimelineDawPrivateLaneArrangement({ timelineStartSeconds: -1, sourceInSeconds: 0, sourceOutSeconds: 1 }, 48_000, 96_000)).toThrow(/position/);
    expect(() => parseTimelineDawPrivateLaneArrangement({ timelineStartSeconds: 0, sourceInSeconds: 1, sourceOutSeconds: 1 }, 48_000, 96_000)).toThrow(/one frame/);
    expect(() => parseTimelineDawPrivateLaneArrangement({ timelineStartSeconds: 0, sourceInSeconds: 0, sourceOutSeconds: 2.1 }, 48_000, 96_000)).toThrow(/private master/);
  });
});
