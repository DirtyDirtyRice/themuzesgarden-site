import { describe, expect, it } from "vitest";
import { resolveTimelineDawMusicianTrackEndPlacement } from "../../lib/timeline/TimelineDawMusicianTrackEndPlacement";

describe("musician track ending placement", () => {
  it("places a normal trimmed track so it ends at the play position", () => {
    expect(resolveTimelineDawMusicianTrackEndPlacement({
      playPositionSeconds: 20, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 1, transformBypassed: false,
    })).toBe(15);
  });

  it("uses the audible duration for active and bypassed speed changes", () => {
    expect(resolveTimelineDawMusicianTrackEndPlacement({
      playPositionSeconds: 20, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 1.5, transformBypassed: false,
    })).toBe(12.5);
    expect(resolveTimelineDawMusicianTrackEndPlacement({
      playPositionSeconds: 20, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 1.5, transformBypassed: true,
    })).toBe(15);
  });

  it("rejects a play position that would push the track before song start", () => {
    expect(() => resolveTimelineDawMusicianTrackEndPlacement({
      playPositionSeconds: 4, sourceInSeconds: 2, sourceOutSeconds: 7, stretchRatio: 1, transformBypassed: false,
    })).toThrow(/earlier than this track/);
  });
});
