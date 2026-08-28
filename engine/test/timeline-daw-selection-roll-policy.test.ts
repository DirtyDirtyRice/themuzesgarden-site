import { describe, expect, it } from "vitest";
import { planTimelineDawSelectionRoll } from "../../lib/timeline/TimelineDawSelectionRollPolicy";

describe("timeline DAW selection roll policy", () => {
  it("adds bounded pre-roll and post-roll around a selected range", () => {
    expect(planTimelineDawSelectionRoll({
      selectionStartTick: 7_680,
      selectionEndTick: 15_360,
      preRollBars: 1,
      postRollBars: 2,
      ppq: 960,
      signatureMap: [{ tick: 0, numerator: 4, denominator: 4 }],
    })).toEqual({
      selectionStartTick: 7_680,
      selectionEndTick: 15_360,
      playbackStartTick: 3_840,
      playbackEndTick: 23_040,
      preRollTicks: 3_840,
      postRollTicks: 7_680,
    });
  });

  it("clamps pre-roll at the beginning of the timeline", () => {
    expect(planTimelineDawSelectionRoll({
      selectionStartTick: 1_920,
      selectionEndTick: 3_840,
      preRollBars: 2,
      postRollBars: 0,
      ppq: 960,
      signatureMap: [{ tick: 0, numerator: 4, denominator: 4 }],
    }).playbackStartTick).toBe(0);
  });

  it("uses the active meter independently at each selection boundary", () => {
    expect(planTimelineDawSelectionRoll({
      selectionStartTick: 12_000,
      selectionEndTick: 20_000,
      preRollBars: 1,
      postRollBars: 1,
      ppq: 960,
      signatureMap: [
        { tick: 0, numerator: 4, denominator: 4 },
        { tick: 10_000, numerator: 3, denominator: 4 },
        { tick: 18_000, numerator: 6, denominator: 8 },
      ],
    })).toMatchObject({
      playbackStartTick: 9_120,
      playbackEndTick: 22_880,
      preRollTicks: 2_880,
      postRollTicks: 2_880,
    });
  });

  it("rejects invalid ranges and roll lengths", () => {
    expect(() => planTimelineDawSelectionRoll({
      selectionStartTick: 4_000,
      selectionEndTick: 4_000,
      preRollBars: 1,
      postRollBars: 1,
      ppq: 960,
      signatureMap: [],
    })).toThrow("Selection end must be after selection start.");
    expect(() => planTimelineDawSelectionRoll({
      selectionStartTick: 0,
      selectionEndTick: 4_000,
      preRollBars: 9,
      postRollBars: 1,
      ppq: 960,
      signatureMap: [],
    })).toThrow("Pre-roll must be between 0 and 8 whole bars.");
  });
});
