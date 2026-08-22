import { describe, expect, it } from "vitest";
import { parseTimelineDawTrackColors, setTimelineDawTrackColor, TIMELINE_DAW_TRACK_COLORS } from "../../lib/timeline/TimelineDawTrackColorPolicy";

describe("DAW track color policy", () => {
  it("restores only allowlisted colors for current session lanes", () => {
    expect(parseTimelineDawTrackColors('{"lane-a":"rose","lane-b":"invented","foreign":"cyan"}', ["lane-a", "lane-b"])).toEqual({ "lane-a": "rose" });
    expect(parseTimelineDawTrackColors("broken", ["lane-a"])).toEqual({});
  });

  it("sets one lane color without changing another lane", () => {
    const colors = setTimelineDawTrackColor({ "lane-a": "cyan" }, "lane-b", "amber");
    expect(colors).toEqual({ "lane-a": "cyan", "lane-b": "amber" });
    expect(TIMELINE_DAW_TRACK_COLORS[colors["lane-b"]]).toBe("#fcd34d");
  });
});
