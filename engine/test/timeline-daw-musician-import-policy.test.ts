import { describe, expect, it } from "vitest";
import {
  createTimelineDawMusicianImportPlan,
  filterTimelineDawExistingProjectSongs,
  timelineDawMusicianImportDescription,
  toggleTimelineDawExistingProjectSong,
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

  it("layers alternate versions at the same start when requested", () => {
    expect(createTimelineDawMusicianImportPlan({
      kind: "alternate-versions",
      placement: "layered",
      files: [
        { name: "Version A.mp3", size: 100 },
        { name: "Version B.mp3", size: 100 },
        { name: "Version C.mp3", size: 100 },
      ],
    }).laneMode).toBe("aligned");
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

describe("existing project song picker", () => {
  const songs = [
    { id: "hard", title: "Out of Tune 1 Hard", path: "private/out of tune1 hard.mp3" },
    { id: "soft", title: "Out of Tune 1 Soft", path: "private/out of tune1 soft.mp3" },
    { id: "other", title: "Another Song", path: "public/another.mp3" },
  ];

  it("finds project songs using all title or path words", () => {
    expect(filterTimelineDawExistingProjectSongs(songs, "out tune").map((song) => song.id)).toEqual(["hard", "soft"]);
    expect(filterTimelineDawExistingProjectSongs(songs, "private soft").map((song) => song.id)).toEqual(["soft"]);
  });

  it("selects and removes songs while enforcing the three-song limit", () => {
    expect(toggleTimelineDawExistingProjectSong(["hard"], "soft")).toEqual(["hard", "soft"]);
    expect(toggleTimelineDawExistingProjectSong(["hard", "soft"], "hard")).toEqual(["soft"]);
    expect(() => toggleTimelineDawExistingProjectSong(["a", "b", "c"], "d")).toThrow("no more than 3");
  });
});
