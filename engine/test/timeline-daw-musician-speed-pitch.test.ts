import { describe, expect, it } from "vitest";
import { adjustTimelineDawMusicianSpeedPitch } from "../../lib/timeline/TimelineDawMusicianSpeedPitch";

const original = {
  stretchRatio: 1,
  pitchSemitones: 0,
  algorithm: "preserve-pitch" as const,
  quality: "balanced" as const,
  bypassed: false,
};

describe("musician speed and pitch controls", () => {
  it("slows down and speeds up in small practical steps", () => {
    const slower = adjustTimelineDawMusicianSpeedPitch(original, "slower");
    expect(slower.stretchRatio).toBe(1.1);
    expect(adjustTimelineDawMusicianSpeedPitch(slower, "faster").stretchRatio).toBe(1);
  });

  it("raises and lowers pitch by one semitone", () => {
    expect(adjustTimelineDawMusicianSpeedPitch(original, "lower").pitchSemitones).toBe(-1);
    expect(adjustTimelineDawMusicianSpeedPitch(original, "raise").pitchSemitones).toBe(1);
  });

  it("keeps safe limits and preserves the selected quality", () => {
    expect(adjustTimelineDawMusicianSpeedPitch({ ...original, stretchRatio: 4 }, "slower").stretchRatio).toBe(4);
    expect(adjustTimelineDawMusicianSpeedPitch({ ...original, pitchSemitones: 24, quality: "high" }, "raise")).toMatchObject({ pitchSemitones: 24, quality: "high" });
  });

  it("returns to original speed and pitch without changing the audio source", () => {
    expect(adjustTimelineDawMusicianSpeedPitch({ ...original, stretchRatio: 1.8, pitchSemitones: -7, algorithm: "resample", bypassed: true }, "reset"))
      .toEqual({ ...original, quality: "balanced" });
  });
});
