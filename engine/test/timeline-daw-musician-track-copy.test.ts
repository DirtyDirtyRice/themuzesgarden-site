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

  it("rejects a requested position outside the song timeline", () => {
    expect(() => resolveTimelineDawMusicianTrackCopyPosition({
      originalStartSeconds: 0,
      sourceInSeconds: 0,
      sourceOutSeconds: 5,
      playPositionSeconds: -1,
    })).toThrow(/inside the song timeline/);
  });
});
