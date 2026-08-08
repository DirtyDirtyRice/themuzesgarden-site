import { describe, expect, it } from "vitest";
import {
  detectTimelineDawPrivateLaneCrossfades,
  parseTimelineDawPrivateLaneFade,
  timelineDawEqualPowerEnvelope,
} from "../../lib/timeline/TimelineDawPrivateLaneFadePolicy";

describe("private lane fade policy", () => {
  it("normalizes fades to frames and rejects envelopes longer than the arranged source", () => {
    expect(parseTimelineDawPrivateLaneFade({ fadeInSeconds: 0.10001, fadeOutSeconds: 0.2 }, 48_000, 48_000)).toEqual({
      inSeconds: 0.1, outSeconds: 0.2, inFrames: 4_800, outFrames: 9_600,
    });
    expect(() => parseTimelineDawPrivateLaneFade({ fadeInSeconds: 0.6, fadeOutSeconds: 0.5 }, 48_000, 48_000))
      .toThrow("fit within the arranged source duration");
  });

  it("uses complementary equal-power curves at transition edges", () => {
    expect(timelineDawEqualPowerEnvelope(0, 2, 1, 0)).toBe(0);
    expect(timelineDawEqualPowerEnvelope(0.5, 2, 1, 0)).toBeCloseTo(Math.SQRT1_2);
    expect(timelineDawEqualPowerEnvelope(1.5, 2, 0, 1)).toBeCloseTo(Math.SQRT1_2);
    expect(timelineDawEqualPowerEnvelope(2, 2, 0, 1)).toBe(0);
  });

  it("detects only compatible adjacent edge overlaps", () => {
    const lane = (id: string, start: number, duration: number, sampleRate = 48_000) => ({
      id, timelineStartSeconds: start, sourceInSeconds: 0, sourceOutSeconds: duration,
      audio: { sampleRate, channelCount: 2 },
    });
    expect(detectTimelineDawPrivateLaneCrossfades([lane("a", 0, 2), lane("b", 1.5, 2), lane("c", 4, 1)]))
      .toEqual([{ outgoingLaneId: "a", incomingLaneId: "b", startSeconds: 1.5, endSeconds: 2, durationSeconds: 0.5 }]);
    expect(detectTimelineDawPrivateLaneCrossfades([lane("a", 0, 2), lane("b", 1.5, 2, 44_100)])).toEqual([]);
  });
});
