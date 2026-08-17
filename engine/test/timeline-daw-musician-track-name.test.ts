import { describe, expect, it } from "vitest";
import { parseTimelineDawMusicianTrackName } from "../../lib/timeline/TimelineDawMusicianTrackName";

describe("TimelineDawMusicianTrackName", () => {
  it("creates a clear saved musician label", () => {
    expect(parseTimelineDawMusicianTrackName("  Lead   Vocal  ")).toBe("Lead Vocal");
    expect(parseTimelineDawMusicianTrackName("Harmony 2")).toBe("Harmony 2");
  });

  it("rejects empty or oversized names", () => {
    expect(() => parseTimelineDawMusicianTrackName("   ")).toThrow(/Enter a track name/);
    expect(() => parseTimelineDawMusicianTrackName("x".repeat(121))).toThrow(/120 characters/);
  });
});
