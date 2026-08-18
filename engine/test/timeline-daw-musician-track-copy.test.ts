import { describe, expect, it } from "vitest";
import { resolveTimelineDawMusicianTrackCopyPosition } from "../../lib/timeline/TimelineDawMusicianTrackCopy";

describe("TimelineDawMusicianTrackCopy", () => {
  it("places a copied track at the musician's play position", () => {
    expect(resolveTimelineDawMusicianTrackCopyPosition({
      originalStartSeconds: 10,
      sourceInSeconds: 2,
      sourceOutSeconds: 7,
      playPositionSeconds: 42.3456,
    })).toBe(42.346);
  });

  it("keeps the existing after-this-track placement when no play position is requested", () => {
    expect(resolveTimelineDawMusicianTrackCopyPosition({
      originalStartSeconds: 10,
      sourceInSeconds: 2,
      sourceOutSeconds: 7,
    })).toBe(15);
  });

  it("repeats after the audible ending of slowed, sped-up, and bypassed tracks", () => {
    expect(resolveTimelineDawMusicianTrackCopyPosition({
      originalStartSeconds: 10, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 1.5,
    })).toBe(17.5);
    expect(resolveTimelineDawMusicianTrackCopyPosition({
      originalStartSeconds: 10, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 0.5,
    })).toBe(12.5);
    expect(resolveTimelineDawMusicianTrackCopyPosition({
      originalStartSeconds: 10, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 1.5, transformBypassed: true,
    })).toBe(15);
  });

  it("rejects tracks without a safe audible repeat length", () => {
    expect(() => resolveTimelineDawMusicianTrackCopyPosition({
      originalStartSeconds: 10, sourceInSeconds: 7, sourceOutSeconds: 2,
    })).toThrow(/safe repeat length/);
  });

  it("rejects a requested position outside the song timeline", () => {
    expect(() => resolveTimelineDawMusicianTrackCopyPosition({
      originalStartSeconds: 0,
      sourceInSeconds: 0,
      sourceOutSeconds: 5,
      playPositionSeconds: -1,
    })).toThrow(/inside the song timeline/);
  });
});
