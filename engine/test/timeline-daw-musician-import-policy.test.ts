import { describe, expect, it } from "vitest";
import {
  createTimelineDawMusicianImportPlan,
  timelineDawMusicianImportDescription,
} from "../../lib/timeline/TimelineDawMusicianImportPolicy";

describe("TimelineDawMusicianImportPolicy", () => {
  it("places a full song as one aligned finished source", () => {
    expect(createTimelineDawMusicianImportPlan({
      kind: "full-song",
      files: [{ name: "My New Song.wav", size: 2048 }],
    })).toEqual({
      familyName: "My New Song",
      role: "finished",
      laneMode: "aligned",
      fileNames: ["My New Song.wav"],
    });
  });

  it("places synchronized stems on aligned lanes", () => {
    const plan = createTimelineDawMusicianImportPlan({
      kind: "stems",
      requestedName: "Band Session",
      files: [
        { name: "Drums.wav", size: 1024 },
        { name: "Bass.mp3", size: 2048 },
      ],
    });
    expect(plan).toMatchObject({ familyName: "Band Session", role: "stem", laneMode: "aligned" });
    expect(timelineDawMusicianImportDescription("stems")).toContain("same start time");
  });

  it("places alternate versions sequentially for comparison", () => {
    expect(createTimelineDawMusicianImportPlan({
      kind: "alternate-versions",
      files: [
        { name: "Take 1.wav", size: 100 },
        { name: "Take 2.wav", size: 100 },
      ],
    }).laneMode).toBe("sequential");
  });

  it("holds incomplete or incompatible imports before upload", () => {
    expect(() => createTimelineDawMusicianImportPlan({ kind: "full-song", files: [] }))
      .toThrow("Choose at least one");
    expect(() => createTimelineDawMusicianImportPlan({
      kind: "full-song",
      files: [{ name: "one.wav", size: 1 }, { name: "two.wav", size: 1 }],
    })).toThrow("Choose Stems");
    expect(() => createTimelineDawMusicianImportPlan({
      kind: "stems",
      files: [{ name: "notes.pdf", size: 50 }],
    })).toThrow("WAV and MP3");
  });
});
