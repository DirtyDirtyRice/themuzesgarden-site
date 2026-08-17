import { describe, expect, it } from "vitest";
import { resolveTimelineDawMusicianTrackTrim } from "../../lib/timeline/TimelineDawMusicianTrackTrim";

const track = {
  timelineStartSeconds: 10,
  sourceInSeconds: 2,
  sourceOutSeconds: 12,
  sampleRate: 48_000,
  stretchRatio: 1,
  transformBypassed: false,
};

describe("TimelineDawMusicianTrackTrim", () => {
  it("trims the beginning to the play position without changing musical sync", () => {
    expect(resolveTimelineDawMusicianTrackTrim({ ...track, edge: "beginning", playPositionSeconds: 13 })).toEqual({
      timelineStartSeconds: 13,
      sourceInSeconds: 5,
      sourceOutSeconds: 12,
    });
  });

  it("trims the end and respects a stretched track", () => {
    expect(resolveTimelineDawMusicianTrackTrim({ ...track, edge: "end", playPositionSeconds: 15 })).toEqual({
      timelineStartSeconds: 10,
      sourceInSeconds: 2,
      sourceOutSeconds: 7,
    });
    expect(resolveTimelineDawMusicianTrackTrim({ ...track, edge: "end", playPositionSeconds: 15, stretchRatio: 2 })).toEqual({
      timelineStartSeconds: 10,
      sourceInSeconds: 2,
      sourceOutSeconds: 4.5,
    });
  });

  it("rejects a play position outside the audible track", () => {
    expect(() => resolveTimelineDawMusicianTrackTrim({ ...track, edge: "end", playPositionSeconds: 9 })).toThrow(/inside this track/);
    expect(() => resolveTimelineDawMusicianTrackTrim({ ...track, edge: "beginning", playPositionSeconds: 20 })).toThrow(/inside this track/);
  });
});
