import { describe, expect, test } from "vitest";
import { createTimelineDawRiffAudition, createTimelineDawRiffAuditionNextIndex, createTimelineDawRiffAuditionPreviousIndex, createTimelineDawRiffAuditionProgress, createTimelineDawRiffAuditionRemainingMilliseconds, createTimelineDawRiffAuditionReplayIndex, createTimelineDawRiffAuditionSequence, cutTimelineDawHybridRiffClip, duplicateTimelineDawHybridRiffClip, findTimelineDawRiffMatches, isTimelineDawRiffAuditionCurrent, moveTimelineDawHybridRiffClip, pasteTimelineDawHybridRiffClip } from "../../lib/timeline/TimelineDawMusicianRiffMatch";

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

test("automatically advances through every matching riff in one song", () => {
  const sequence = createTimelineDawRiffAuditionSequence([
    { laneId: "version-1", sourceInSeconds: 0, regionStartSeconds: 2, regionEndSeconds: 4, stretchRatio: 1, transformBypassed: true, playbackRate: 1 },
    { laneId: "version-1", sourceInSeconds: 0, regionStartSeconds: 12, regionEndSeconds: 15, stretchRatio: 1, transformBypassed: true, playbackRate: 1 },
    { laneId: "version-1", sourceInSeconds: 0, regionStartSeconds: 24, regionEndSeconds: 26, stretchRatio: 1, transformBypassed: true, playbackRate: 1 },
  ]);
  expect(sequence.map((item) => [item.laneId, item.sourceStartSeconds])).toEqual([
    ["version-1", 2], ["version-1", 12], ["version-1", 24],
  ]);
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

test("prevents a delayed riff from restarting after the musician presses stop", () => {
  expect(isTimelineDawRiffAuditionCurrent(4, 4)).toBe(true);
  expect(isTimelineDawRiffAuditionCurrent(4, 5)).toBe(false);
});

test("reports the current track and pass during a repeated three-track comparison", () => {
  expect(createTimelineDawRiffAuditionProgress(4, 3, 3)).toEqual({
    trackNumber: 2, trackCount: 3, passNumber: 2, passCount: 3,
  });
});

test("moves to the next comparison track and stops after the final track", () => {
  expect(createTimelineDawRiffAuditionNextIndex(0, 3)).toBe(1);
  expect(createTimelineDawRiffAuditionNextIndex(1, 3)).toBe(2);
  expect(createTimelineDawRiffAuditionNextIndex(2, 3)).toBeNull();
});

test("moves back to the previous comparison track but not before the first", () => {
  expect(createTimelineDawRiffAuditionPreviousIndex(2)).toBe(1);
  expect(createTimelineDawRiffAuditionPreviousIndex(1)).toBe(0);
  expect(createTimelineDawRiffAuditionPreviousIndex(0)).toBeNull();
});

test("replays the current comparison track without leaving the prepared sequence", () => {
  expect(createTimelineDawRiffAuditionReplayIndex(1, 3)).toBe(1);
  expect(createTimelineDawRiffAuditionReplayIndex(8, 3)).toBe(2);
  expect(createTimelineDawRiffAuditionReplayIndex(0, 0)).toBeNull();
});

test("preserves the remaining riff time while a comparison is paused", () => {
  expect(createTimelineDawRiffAuditionRemainingMilliseconds(4000, 1250)).toBe(2750);
  expect(createTimelineDawRiffAuditionRemainingMilliseconds(4000, 5000)).toBe(1);
});

test("builds a protected hybrid track from copied riff regions", () => {
  const first = pasteTimelineDawHybridRiffClip([], {
    riffId: "riff-1", color: "#2563eb", laneId: "version-1", laneName: "Version 1",
    startSeconds: 12, endSeconds: 16,
  });
  const second = pasteTimelineDawHybridRiffClip(first, {
    riffId: "riff-2", color: "#16a34a", laneId: "version-3", laneName: "Version 3",
    startSeconds: 30, endSeconds: 34,
  });
  expect(second.map((clip) => clip.id)).toEqual(["hybrid-riff:1", "hybrid-riff:2"]);
  expect(second.map((clip) => clip.laneId)).toEqual(["version-1", "version-3"]);
});

test("reorders, duplicates, and cuts hybrid clips without changing source references", () => {
  const clips = [
    { id: "hybrid-riff:1", riffId: "riff-1", color: "#2563eb", laneId: "a", laneName: "A", startSeconds: 1, endSeconds: 3 },
    { id: "hybrid-riff:2", riffId: "riff-2", color: "#16a34a", laneId: "b", laneName: "B", startSeconds: 5, endSeconds: 8 },
  ];
  const moved = moveTimelineDawHybridRiffClip(clips, "hybrid-riff:2", -1);
  expect(moved.map((clip) => clip.id)).toEqual(["hybrid-riff:2", "hybrid-riff:1"]);
  const duplicated = duplicateTimelineDawHybridRiffClip(moved, "hybrid-riff:2");
  expect(duplicated[2]).toMatchObject({ id: "hybrid-riff:3", laneId: "b", startSeconds: 5, endSeconds: 8 });
  expect(cutTimelineDawHybridRiffClip(duplicated, "hybrid-riff:1").map((clip) => clip.id)).toEqual(["hybrid-riff:2", "hybrid-riff:3"]);
});
});
