import { describe, expect, it } from "vitest";
import {
  createTimelineDawMusicianPreset,
  summarizeTimelineDawMusicianMixHealth,
} from "../../lib/timeline/TimelineDawMusicianMixPolicy";

describe("TimelineDawMusicianMixPolicy", () => {
  it("creates bounded, reversible musician effect chains", () => {
    expect(createTimelineDawMusicianPreset("clean")).toEqual([]);
    expect(createTimelineDawMusicianPreset("vocal")).toEqual([
      { slot: 1, effect: "filter", bypassed: false, parameters: { frequency: 14000, q: 0.7 } },
      { slot: 2, effect: "compressor", bypassed: false, parameters: { threshold: -18, ratio: 3 } },
    ]);
    expect(createTimelineDawMusicianPreset("punch").every((insert) => insert.slot >= 0 && insert.slot <= 3)).toBe(true);
  });

  it("reports safe, hot, clipped, latency, and processing-load states", () => {
    expect(summarizeTimelineDawMusicianMixHealth({ peakDbfs: -12, clipped: false, activeInsertCount: 2, latencySamples: 48, sampleRate: 48000 })).toMatchObject({ status: "safe", latencyMs: 1, processingLoad: "light" });
    expect(summarizeTimelineDawMusicianMixHealth({ peakDbfs: -1, clipped: false, activeInsertCount: 4, latencySamples: 0, sampleRate: 48000 }).status).toBe("hot");
    expect(summarizeTimelineDawMusicianMixHealth({ peakDbfs: 0, clipped: true, activeInsertCount: 9, latencySamples: 2400, sampleRate: 48000 })).toMatchObject({ status: "clip", latencyMs: 50, processingLoad: "high" });
  });
});
