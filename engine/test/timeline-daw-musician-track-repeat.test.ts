import { describe, expect, it } from "vitest";
import { resolveTimelineDawMusicianTrackRepeatPositions } from "../../lib/timeline/TimelineDawMusicianTrackRepeat";

const track = {
  originalStartSeconds: 10,
  sourceInSeconds: 2,
  sourceOutSeconds: 7,
  stretchRatio: 1.5,
  transformBypassed: false,
};

describe("musician multi-repeat placement", () => {
  it("creates consecutive audible positions for two and four repeats", () => {
    expect(resolveTimelineDawMusicianTrackRepeatPositions({ ...track, repeatCount: 2 })).toEqual([17.5, 25]);
    expect(resolveTimelineDawMusicianTrackRepeatPositions({ ...track, repeatCount: 4 })).toEqual([17.5, 25, 32.5, 40]);
  });

  it("uses original duration when speed processing is bypassed", () => {
    expect(resolveTimelineDawMusicianTrackRepeatPositions({ ...track, transformBypassed: true, repeatCount: 2 })).toEqual([15, 20]);
  });

  it("rejects unsupported counts and unsafe song endings", () => {
    expect(() => resolveTimelineDawMusicianTrackRepeatPositions({ ...track, repeatCount: 3 })).toThrow(/two or four/);
    expect(() => resolveTimelineDawMusicianTrackRepeatPositions({ ...track, originalStartSeconds: 86_399, repeatCount: 2 })).toThrow(/song timeline/);
  });
});
