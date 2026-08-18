import { describe, expect, it } from "vitest";
import { resolveTimelineDawMusicianTrackPlacement } from "../../lib/timeline/TimelineDawMusicianTrackPlacement";

const target = {
  id: "chorus",
  timelineStartSeconds: 12,
  sourceInSeconds: 2,
  sourceOutSeconds: 10,
  stretchRatio: 1.5,
  transformBypassed: false,
};

describe("musician track-to-track placement", () => {
  it("aligns one track with another track's starting point", () => {
    expect(resolveTimelineDawMusicianTrackPlacement({ movingTrackId: "vocal", targetTrack: target, mode: "same-start" })).toBe(12);
  });

  it("places a track after the target's audible stretched ending", () => {
    expect(resolveTimelineDawMusicianTrackPlacement({ movingTrackId: "vocal", targetTrack: target, mode: "after-track" })).toBe(24);
    expect(resolveTimelineDawMusicianTrackPlacement({ movingTrackId: "vocal", targetTrack: { ...target, transformBypassed: true }, mode: "after-track" })).toBe(20);
  });

  it("rejects the same track and unsafe target timing", () => {
    expect(() => resolveTimelineDawMusicianTrackPlacement({ movingTrackId: "chorus", targetTrack: target, mode: "same-start" })).toThrow(/different track/);
    expect(() => resolveTimelineDawMusicianTrackPlacement({ movingTrackId: "vocal", targetTrack: { ...target, sourceOutSeconds: 1 }, mode: "after-track" })).toThrow(/safe song position/);
  });
});
