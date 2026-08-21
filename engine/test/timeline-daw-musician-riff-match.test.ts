import { describe, expect, test } from "vitest";
import { createTimelineDawRiffAudition, findTimelineDawRiffMatches } from "../../lib/timeline/TimelineDawMusicianRiffMatch";

describe("musician riff matching", () => {
test("colors a repeated real waveform shape only when every track reaches 90 percent", () => {
  const riff = [0.1, 0.8, 0.2, 0.9, 0.3, 0.7, 0.15, 0.85, 0.25, 0.75, 0.2, 0.9, 0.1, 0.8, 0.2, 0.7];
  const matches = findTimelineDawRiffMatches([
    { laneId: "a", name: "A", peaks: [...riff, ...new Array(16).fill(0.05)], durationSeconds: 32 },
    { laneId: "b", name: "B", peaks: [...new Array(8).fill(0.02), ...riff, ...new Array(8).fill(0.03)], durationSeconds: 32 },
    { laneId: "c", name: "C", peaks: riff.map((value) => value * 0.98), durationSeconds: 16 },
  ], { threshold: 0.9, windowBins: 16, stepBins: 8 });
  expect(matches).toHaveLength(1);
  expect(matches[0].regions).toHaveLength(3);
  expect(matches[0].similarity).toBeGreaterThanOrEqual(0.9);
  expect(matches[0].color).toMatch(/^#/);
});

test("does not report a family when one selected track is unlike the others", () => {
  const matches = findTimelineDawRiffMatches([
    { laneId: "a", name: "A", peaks: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], durationSeconds: 16 },
    { laneId: "b", name: "B", peaks: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], durationSeconds: 16 },
  ], { threshold: 0.9, windowBins: 16 });
  expect(matches).toHaveLength(0);
});

test("auditions exactly one matched region and honors the saved track speed", () => {
  expect(createTimelineDawRiffAudition({
    sourceInSeconds: 12,
    regionStartSeconds: 4,
    regionEndSeconds: 7,
    stretchRatio: 1.25,
    transformBypassed: false,
    playbackRate: 0.8,
  })).toEqual({ sourceStartSeconds: 16, playbackRate: 0.8, durationSeconds: 3.75, stopAfterMilliseconds: 3750 });
});
});
