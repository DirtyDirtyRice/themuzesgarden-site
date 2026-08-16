import { describe, expect, it } from "vitest";
import { createTimelineDawRecordingPasses, parseTimelineDawRecordingPlan, timelineDawCountInFrames } from "../../lib/timeline/TimelineDawPunchLoopRecordingPolicy";

describe("punch and loop recording policy", () => {
  it("does not trim count-in frames when capture begins after the audible cue", () => {
    const plan = parseTimelineDawRecordingPlan({ mode: "normal", sampleRate: 48_000, countInBars: 2, beatsPerBar: 4, bpm: 120, rangeStartFrame: 0, countInCaptured: false });
    expect(timelineDawCountInFrames(plan)).toBe(0);
    expect(createTimelineDawRecordingPasses(plan, 48_000)[0].sourceInFrame).toBe(0);
  });
  it("builds a tempo-aware count-in without recording over the target", () => {
    const plan = parseTimelineDawRecordingPlan({ mode: "punch", sampleRate: 48_000, countInBars: 2, beatsPerBar: 4, bpm: 120, rangeStartFrame: 96_000, rangeEndFrame: 144_000 });
    expect(timelineDawCountInFrames(plan)).toBe(192_000);
    expect(createTimelineDawRecordingPasses(plan, 240_000)[0]).toMatchObject({ timelineStartFrame: 96_000, sourceInFrame: 192_000, sourceOutFrame: 240_000 });
  });

  it("splits loop capture into numbered, sample-accurate passes", () => {
    const plan = parseTimelineDawRecordingPlan({ mode: "loop", sampleRate: 48_000, countInBars: 0, bpm: 120, beatsPerBar: 4, rangeStartFrame: 10, rangeEndFrame: 110, loopPasses: 3, groupId: "vocal-chorus" });
    expect(createTimelineDawRecordingPasses(plan, 300)).toEqual([
      { passNumber: 1, captureStartFrame: 0, captureEndFrame: 100, timelineStartFrame: 10, sourceInFrame: 0, sourceOutFrame: 100 },
      { passNumber: 2, captureStartFrame: 100, captureEndFrame: 200, timelineStartFrame: 10, sourceInFrame: 100, sourceOutFrame: 200 },
      { passNumber: 3, captureStartFrame: 200, captureEndFrame: 300, timelineStartFrame: 10, sourceInFrame: 200, sourceOutFrame: 300 },
    ]);
  });

  it("rejects unsafe ranges and incomplete passes", () => {
    expect(() => parseTimelineDawRecordingPlan({ mode: "punch", sampleRate: 48_000, rangeStartFrame: 100, rangeEndFrame: 100 })).toThrow(/ordered range/);
    const plan = parseTimelineDawRecordingPlan({ mode: "loop", sampleRate: 48_000, rangeStartFrame: 0, rangeEndFrame: 1_000, loopPasses: 2 });
    expect(() => createTimelineDawRecordingPasses(plan, 999)).toThrow(/complete/);
  });
});
