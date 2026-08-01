import { describe, expect, it } from "vitest";
import { analyzeTimelineDawInputLevel } from "../../lib/timeline/TimelineDawInputLevel";

describe("TimelineDawInputLevel", () => {
  it("reports multichannel peak level and clipping", () => {
    const safe = analyzeTimelineDawInputLevel([
      new Float32Array([0, 0.5, -0.25]),
      new Float32Array([0.1, -0.75, 0]),
    ]);
    expect(safe.peakAmplitude).toBeCloseTo(0.75);
    expect(safe.peakDbfs).toBeCloseTo(-2.4988, 3);
    expect(safe.clipped).toBe(false);
    expect(analyzeTimelineDawInputLevel([new Float32Array([1])]).clipped).toBe(true);
  });

  it("uses a stable silence floor and rejects invalid evidence", () => {
    expect(analyzeTimelineDawInputLevel([new Float32Array([0, 0])]).peakDbfs).toBe(-96);
    expect(() => analyzeTimelineDawInputLevel([])).toThrow(/channel count/);
    expect(() => analyzeTimelineDawInputLevel([
      new Float32Array([0]),
      new Float32Array([0, 0]),
    ])).toThrow(/matching/);
    expect(() => analyzeTimelineDawInputLevel([new Float32Array([Number.NaN])])).toThrow(/sample/);
  });
});
