import { describe, expect, it } from "vitest";
import { resolveTimelineDawMusicianGroupMove } from "../../lib/timeline/TimelineDawMusicianGroupMove";

const tracks = [
  { id: "guitar", timelineStartSeconds: 3 },
  { id: "vocal", timelineStartSeconds: 5.5 },
];

describe("musician multi-track movement", () => {
  it("moves selected tracks earlier or later by one second", () => {
    expect(resolveTimelineDawMusicianGroupMove({ tracks, mode: "one-second-earlier" })).toBe(-1);
    expect(resolveTimelineDawMusicianGroupMove({ tracks, mode: "one-second-later" })).toBe(1);
  });

  it("fine-tunes selected tracks together by one tenth of a second", () => {
    expect(resolveTimelineDawMusicianGroupMove({ tracks, mode: "tenth-second-earlier" })).toBe(-0.1);
    expect(resolveTimelineDawMusicianGroupMove({ tracks, mode: "tenth-second-later" })).toBe(0.1);
  });

  it("fine-tunes selected tracks together by one hundredth of a second", () => {
    expect(resolveTimelineDawMusicianGroupMove({ tracks, mode: "hundredth-second-earlier" })).toBe(-0.01);
    expect(resolveTimelineDawMusicianGroupMove({ tracks, mode: "hundredth-second-later" })).toBe(0.01);
  });

  it("moves the earliest selected track to the play position and preserves spacing", () => {
    const delta = resolveTimelineDawMusicianGroupMove({ tracks, mode: "play-position", playPositionSeconds: 10 });
    expect(delta).toBe(7);
    expect(tracks.map((track) => track.timelineStartSeconds + delta)).toEqual([10, 12.5]);
  });

  it("requires two distinct tracks and keeps the group inside the song", () => {
    expect(() => resolveTimelineDawMusicianGroupMove({ tracks: [tracks[0]], mode: "one-second-later" })).toThrow(/two tracks/);
    expect(() => resolveTimelineDawMusicianGroupMove({ tracks: [{ id: "a", timelineStartSeconds: 0 }, { id: "b", timelineStartSeconds: 2 }], mode: "one-second-earlier" })).toThrow(/outside the song/);
  });

  it("rejects a no-change play-position move", () => {
    expect(() => resolveTimelineDawMusicianGroupMove({ tracks, mode: "play-position", playPositionSeconds: 3 })).toThrow(/already begin/);
  });
});
