import { describe, expect, it } from "vitest";
import { evaluateTimelineDawExportPreflight } from "../../lib/timeline/TimelineDawExportReliabilityPolicy";

const job = {
  bitDepth: 24 as const,
  channels: 2,
  format: "wav" as const,
  sampleRate: 48_000,
  sourceIds: ["vocal", "guitar"],
  target: "stem" as const,
  totalFrames: 48_000 * 180,
};

describe("DAW export reliability preflight", () => {
  it("estimates every uncompressed stem plus ZIP structure", () => {
    expect(evaluateTimelineDawExportPreflight(job, 120 * 1024 * 1024)).toMatchObject({
      safe: true,
      outputCount: 2,
    });
  });

  it("blocks oversized stem packages with a bounded duration recommendation", () => {
    const result = evaluateTimelineDawExportPreflight(
      { ...job, sourceIds: Array.from({ length: 12 }, (_, index) => `stem-${index}`) },
      512 * 1024 * 1024,
    );
    expect(result.safe).toBe(false);
    expect(result.maximumSafeDurationSeconds).toBeLessThan(180);
    expect(result.message).toMatch(/12-stem ZIP|Reduce the export/);
  });

  it("keeps a normal full-mix render inside the same safety policy", () => {
    expect(evaluateTimelineDawExportPreflight({ ...job, target: "mix" }).safe).toBe(true);
  });
});
