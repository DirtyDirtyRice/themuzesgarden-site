import { describe, expect, it } from "vitest";
import { createTimelineDawMusicianTempoKeyMatch } from "../../lib/timeline/TimelineDawMusicianTempoKeyMatch";

const current = { stretchRatio: 1, pitchSemitones: 0, algorithm: "resample" as const, quality: "draft" as const, bypassed: true };

describe("musician exact BPM and key matching", () => {
  it("speeds a track to the requested BPM while preserving pitch", () => {
    expect(createTimelineDawMusicianTempoKeyMatch({ current, sourceBpm: 100, targetBpm: 125, sourceKey: "C", targetKey: "C" })).toEqual({ stretchRatio: 0.8, pitchSemitones: 0, algorithm: "preserve-pitch", quality: "high", bypassed: false });
  });
  it("uses the shortest musical key movement and accepts flats", () => {
    expect(createTimelineDawMusicianTempoKeyMatch({ current, sourceBpm: 120, targetBpm: 120, sourceKey: "Bb", targetKey: "C" }).pitchSemitones).toBe(2);
    expect(createTimelineDawMusicianTempoKeyMatch({ current, sourceBpm: 120, targetBpm: 120, sourceKey: "C", targetKey: "B" }).pitchSemitones).toBe(-1);
  });
  it("rejects invalid BPM, keys, and unsafe changes", () => {
    expect(() => createTimelineDawMusicianTempoKeyMatch({ current, sourceBpm: 0, targetBpm: 120, sourceKey: "C", targetKey: "D" })).toThrow("Current BPM");
    expect(() => createTimelineDawMusicianTempoKeyMatch({ current, sourceBpm: 120, targetBpm: 120, sourceKey: "H", targetKey: "D" })).toThrow("Current key");
    expect(() => createTimelineDawMusicianTempoKeyMatch({ current, sourceBpm: 400, targetBpm: 20, sourceKey: "C", targetKey: "D" })).toThrow("safe");
  });
});
