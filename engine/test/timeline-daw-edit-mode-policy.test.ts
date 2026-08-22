import { describe, expect, it } from "vitest";
import {
  applyTimelineDawEditModeMove,
  parseTimelineDawEditMode,
} from "../../lib/timeline/TimelineDawEditModePolicy";
import type { TimelineDawClipState } from "../../lib/timeline/TimelineDawMultitrackViewModel";

const clip = (id: string, start: number, end: number, selected = false): TimelineDawClipState => ({
  id, trackId: "track-1", timelineStartSeconds: start, timelineEndSeconds: end,
  sourceStartSeconds: start, sourceEndSeconds: end, selected, parentClipId: null,
  archived: false, fadeInSeconds: 0, fadeOutSeconds: 0,
});

describe("TimelineDawEditModePolicy", () => {
  it("allows only the four professional edit modes", () => {
    expect(parseTimelineDawEditMode("slip")).toBe("slip");
    expect(parseTimelineDawEditMode("shuffle")).toBe("shuffle");
    expect(parseTimelineDawEditMode("spot")).toBe("spot");
    expect(parseTimelineDawEditMode("invented")).toBe("grid");
  });

  it("snaps Grid moves and gives Spot exact placement", () => {
    const clips = [clip("a", 2.2, 4.2, true)];
    expect(applyTimelineDawEditModeMove(clips, {
      mode: "grid", deltaSeconds: 1.1, gridSeconds: 1,
    })[0].timelineStartSeconds).toBe(3);
    expect(applyTimelineDawEditModeMove(clips, {
      mode: "spot", deltaSeconds: 0, gridSeconds: 1, spotSeconds: 8.35,
    })[0].timelineStartSeconds).toBe(8.35);
  });

  it("slips source audio without moving the timeline clip", () => {
    const slipped = applyTimelineDawEditModeMove([clip("a", 4, 8, true)], {
      mode: "slip", deltaSeconds: 1.5, gridSeconds: 1,
    })[0];
    expect(slipped).toMatchObject({
      timelineStartSeconds: 4, timelineEndSeconds: 8,
      sourceStartSeconds: 5.5, sourceEndSeconds: 9.5,
    });
  });

  it("shuffles surrounding clips when moving a selected clip", () => {
    const shuffled = applyTimelineDawEditModeMove([
      clip("a", 0, 2), clip("b", 2, 4, true), clip("c", 4, 6), clip("d", 6, 8),
    ], { mode: "shuffle", deltaSeconds: 4, gridSeconds: 1 });
    expect(shuffled.map((item) => [item.id, item.timelineStartSeconds])).toEqual([
      ["a", 0], ["b", 6], ["c", 2], ["d", 4],
    ]);
  });
});
