import { describe, expect, test } from "vitest";
import { createTimelineDawRiffAudition, createTimelineDawRiffAuditionSequence, findTimelineDawRiffMatches } from "../../lib/timeline/TimelineDawMusicianRiffMatch";

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

test("keeps selected-track order when preparing a back-to-back riff comparison", () => {
  const sequence = createTimelineDawRiffAuditionSequence([
    { laneId: "version-1", sourceInSeconds: 0, regionStartSeconds: 2, regionEndSeconds: 4, stretchRatio: 1, transformBypassed: true, playbackRate: 1 },
    { laneId: "version-2", sourceInSeconds: 5, regionStartSeconds: 3, regionEndSeconds: 6, stretchRatio: 1.2, transformBypassed: false, playbackRate: 0.9 },
  ]);
  expect(sequence.map((item) => item.laneId)).toEqual(["version-1", "version-2"]);
  expect(sequence[1]).toMatchObject({ sourceStartSeconds: 8, stopAfterMilliseconds: 3600 });
  expect(sequence[1].durationSeconds).toBeCloseTo(3.6);
});

test("repeats the complete selected-track riff comparison three times in order", () => {
  const sequence = createTimelineDawRiffAuditionSequence([
    { laneId: "version-1", sourceInSeconds: 0, regionStartSeconds: 2, regionEndSeconds: 4, stretchRatio: 1, transformBypassed: true, playbackRate: 1 },
    { laneId: "version-2", sourceInSeconds: 0, regionStartSeconds: 3, regionEndSeconds: 5, stretchRatio: 1, transformBypassed: true, playbackRate: 1 },
  ], 3);
  expect(sequence.map((item) => `${item.passIndex}:${item.laneId}`)).toEqual([
    "0:version-1", "0:version-2", "1:version-1", "1:version-2", "2:version-1", "2:version-2",
  ]);
});
});
