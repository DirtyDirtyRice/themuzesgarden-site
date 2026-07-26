import { describe, expect, it } from "vitest";
import {
  secondsToTimelineTick,
  shouldCheckpointTransport,
  timelineTickToSeconds,
  timelineTickToPosition,
} from "../../lib/timeline/TimelineDawTransportViewModel";

describe("TimelineDawTransportViewModel", () => {
  it("maps browser audio time onto the musical transport grid", () => {
    expect(secondsToTimelineTick(2, 120, 960)).toBe(3_840);
    expect(timelineTickToSeconds(3_840, 120, 960)).toBe(2);
    expect(timelineTickToPosition(3_840, 960)).toEqual({
      bar: 2,
      beat: 1,
      tick: 0,
      label: "2:1:0",
    });
    expect(timelineTickToPosition(5_280, 960).label).toBe("2:2:480");
  });

  it("checkpoints only after playback advances by at least one quarter note", () => {
    expect(shouldCheckpointTransport(959, 0, 960)).toBe(false);
    expect(shouldCheckpointTransport(960, 0, 960)).toBe(true);
    expect(shouldCheckpointTransport(1_920, 2_880, 960)).toBe(true);
    expect(() => shouldCheckpointTransport(-1, 0, 960)).toThrow(/whole numbers/i);
  });

  it("rejects invalid transport measurements", () => {
    expect(() => secondsToTimelineTick(-1, 120, 960)).toThrow();
    expect(() => timelineTickToPosition(0, 0)).toThrow();
  });
});
