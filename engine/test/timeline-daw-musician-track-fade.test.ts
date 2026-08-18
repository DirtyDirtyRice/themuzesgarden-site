import { describe, expect, it } from "vitest";
import { resolveTimelineDawMusicianTrackFade } from "../../lib/timeline/TimelineDawMusicianTrackFade";

const track = {
  timelineStartSeconds: 10,
  sourceInSeconds: 2,
  sourceOutSeconds: 8,
  stretchRatio: 1,
  transformBypassed: false,
  currentFadeInSeconds: 0,
  currentFadeOutSeconds: 0,
};

describe("TimelineDawMusicianTrackFade", () => {
  it("creates fade-in and fade-out lengths from the play position", () => {
    expect(resolveTimelineDawMusicianTrackFade({ ...track, playPositionSeconds: 12, edge: "in" }))
      .toEqual({ inSeconds: 2, outSeconds: 0 });
    expect(resolveTimelineDawMusicianTrackFade({ ...track, playPositionSeconds: 14, edge: "out" }))
      .toEqual({ inSeconds: 0, outSeconds: 2 });
  });

  it("uses the audible timeline length of a stretched track", () => {
    expect(resolveTimelineDawMusicianTrackFade({
      ...track, stretchRatio: 2, playPositionSeconds: 14, edge: "in",
    })).toEqual({ inSeconds: 4, outSeconds: 0 });
  });

  it("rejects a play position outside the track and overlapping fades", () => {
    expect(() => resolveTimelineDawMusicianTrackFade({ ...track, playPositionSeconds: 10, edge: "in" }))
      .toThrow(/inside this track/);
    expect(() => resolveTimelineDawMusicianTrackFade({
      ...track, currentFadeOutSeconds: 5, playPositionSeconds: 12, edge: "in",
    })).toThrow(/overlap/);
  });
});
