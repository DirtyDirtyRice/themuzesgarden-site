import { describe, expect, it } from "vitest";
import { createTimelineDawElasticPlan, parseTimelineDawPrivateLaneTransform, transformTimelineDawPrivateLanePcm } from "../../lib/timeline/TimelineDawPrivateLaneTransformPolicy";

const transform = { stretchRatio: 2, pitchSemitones: 0, algorithm: "preserve-pitch" as const, quality: "balanced" as const, bypassed: false };

describe("anchor-aware elastic rendering", () => {
  it("maps protected attacks and selects quality windows", () => {
    const draft = createTimelineDawElasticPlan(1000, 48000, { ...transform, quality: "draft" }, [250]);
    const high = createTimelineDawElasticPlan(1000, 48000, { ...transform, quality: "high" }, [250]);
    expect(draft.anchors[1]).toEqual({ sourceFrame: 250, outputFrame: 500 });
    expect(high.windowFrames).toBeGreaterThan(draft.windowFrames);
  });

  it("preserves protected attack samples while stretching between anchors", () => {
    const source = new Float32Array(16); source[5] = 0.875;
    const output = transformTimelineDawPrivateLanePcm([source], transform, [5], 48000)[0];
    expect(output).toHaveLength(32);
    expect(output[10]).toBeCloseTo(0.875);
    expect(source[5]).toBeCloseTo(0.875);
  });

  it("rejects unknown quality modes", () => {
    expect(() => parseTimelineDawPrivateLaneTransform({ ...transform, quality: "ultra" })).toThrow(/quality/i);
  });
});
