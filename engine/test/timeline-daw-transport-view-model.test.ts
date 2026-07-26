import { describe, expect, it } from "vitest";
import {
  secondsToTimelineTick,
  timelineTickToPosition,
} from "../../lib/timeline/TimelineDawTransportViewModel";

describe("TimelineDawTransportViewModel", () => {
  it("maps browser audio time onto the musical transport grid", () => {
    expect(secondsToTimelineTick(2, 120, 960)).toBe(3_840);
    expect(timelineTickToPosition(3_840, 960)).toEqual({
      bar: 2,
      beat: 1,
      tick: 0,
      label: "2:1:0",
    });
    expect(timelineTickToPosition(5_280, 960).label).toBe("2:2:480");
  });

  it("rejects invalid transport measurements", () => {
    expect(() => secondsToTimelineTick(-1, 120, 960)).toThrow();
    expect(() => timelineTickToPosition(0, 0)).toThrow();
  });
});
