import { describe, expect, it } from "vitest";
import { TimelineSliceTransformationEngine } from "../../lib/timeline/TimelineSliceTransformationEngine";
import type { TimelineSliceMapRecord } from "../../lib/timeline/TimelineSliceMapEngine";

function createSliceMap(durationSeconds = 0.5): TimelineSliceMapRecord {
  const sampleRate = 8_000;
  const endFrame = Math.round(durationSeconds * sampleRate);
  const boundary = (id: string) => ({ boundaryId: id, kind: "start" as const, confidence: 1 });
  return {
    id: "slice-map-1", sourceArtifactId: "audio-1", sourceFingerprint: "fingerprint-1",
    decodeEvidenceId: "decode-1", transientAnalysisId: "transients-1", tempoKeyAnalysisId: "tempo-key-1",
    sampleRate, frameCount: endFrame, durationSeconds,
    configuration: { minimumSliceMilliseconds: 20, includeSilenceEdges: true, minimumBoundaryConfidence: 0.25, beatsPerBar: 4 },
    tempo: null, key: null,
    slices: [{
      id: "slice-1", index: 0, startFrame: 0, endFrame, startSeconds: 0,
      endSeconds: durationSeconds, durationSeconds, startBeat: null, endBeat: null,
      bar: null, beatInBar: null, openingBoundary: boundary("start"),
      closingBoundary: { boundaryId: "end", kind: "end", confidence: 1 },
    }],
    discardedBoundaryIds: [], createdAt: "2026-07-25T12:00:00.000Z", createdBy: "tester",
  };
}

describe("TimelineSliceTransformationEngine", () => {
  it("creates an ordered non-destructive recipe for every supported transformation", () => {
    const result = new TimelineSliceTransformationEngine().create({
      sliceMap: createSliceMap(), sliceId: "slice-1", createdBy: "tester",
      operations: [
        { type: "reverse" }, { type: "gain", decibels: -3 },
        { type: "fade", fadeInMilliseconds: 50, fadeOutMilliseconds: 100 },
        { type: "pitch-shift", semitones: 7 }, { type: "time-stretch", ratio: 2 },
        { type: "filter", kind: "low-pass", frequencyHz: 2_000, resonance: 0.8 },
        { type: "envelope", attackMilliseconds: 50, decayMilliseconds: 50, sustain: 0.7, releaseMilliseconds: 100 },
      ],
    });
    expect(result.accepted).toBe(true);
    expect(result.recipe?.operations.map((operation) => operation.type)).toEqual([
      "reverse", "gain", "fade", "pitch-shift", "time-stretch", "filter", "envelope",
    ]);
    expect(result.recipe?.operations.map((operation) => operation.order)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(result.recipe?.operations.map((operation) => operation.id)).toEqual([
      "timeline-slice-transformation-1-operation-1", "timeline-slice-transformation-1-operation-2",
      "timeline-slice-transformation-1-operation-3", "timeline-slice-transformation-1-operation-4",
      "timeline-slice-transformation-1-operation-5", "timeline-slice-transformation-1-operation-6",
      "timeline-slice-transformation-1-operation-7",
    ]);
    expect(result.recipe?.outputDurationSeconds).toBe(1);
    expect(result.recipe?.renderRequired).toBe(true);
    expect(result.recipe).not.toHaveProperty("audio");
  });

  it("keeps lightweight reverse, gain, and fade transformations render-free", () => {
    const result = new TimelineSliceTransformationEngine().create({
      sliceMap: createSliceMap(), sliceId: "slice-1", createdBy: "tester",
      operations: [{ type: "reverse" }, { type: "gain", decibels: 2 },
        { type: "fade", fadeInMilliseconds: 100, fadeOutMilliseconds: 100 }],
    });
    expect(result.accepted).toBe(true);
    expect(result.recipe?.renderRequired).toBe(false);
    expect(result.recipe?.outputDurationSeconds).toBe(0.5);
  });

  it("reports invalid operations at their exact operation indices", () => {
    const result = new TimelineSliceTransformationEngine().create({
      sliceMap: createSliceMap(), sliceId: "slice-1", createdBy: "tester",
      operations: [
        { type: "gain", decibels: 30 },
        { type: "fade", fadeInMilliseconds: 400, fadeOutMilliseconds: 200 },
        { type: "pitch-shift", semitones: 60 },
        { type: "filter", kind: "high-pass", frequencyHz: 4_000, resonance: 1 },
        { type: "envelope", attackMilliseconds: 200, decayMilliseconds: 200, sustain: 0.5, releaseMilliseconds: 200 },
      ],
    });
    expect(result.accepted).toBe(false);
    expect(result.issues.map((issue) => issue.operationIndex)).toEqual([0, 1, 2, 3, 4]);
  });

  it("rejects unknown slices and unsafe chained output durations", () => {
    const engine = new TimelineSliceTransformationEngine();
    const missing = engine.create({ sliceMap: createSliceMap(), sliceId: "missing", createdBy: "tester", operations: [{ type: "reverse" }] });
    const unsafe = engine.create({
      sliceMap: createSliceMap(1_000), sliceId: "slice-1", createdBy: "tester",
      operations: [{ type: "time-stretch", ratio: 8 }, { type: "time-stretch", ratio: 8 }],
    });
    expect(missing.issues.some((issue) => issue.code === "slice-not-found")).toBe(true);
    expect(unsafe.accepted).toBe(false);
    expect(unsafe.issues.some((issue) => issue.code === "duration-invalid")).toBe(true);
  });

  it("restores archives, rejects duplicates, and continues stable identifiers", () => {
    const source = new TimelineSliceTransformationEngine();
    const first = source.create({ sliceMap: createSliceMap(), sliceId: "slice-1", createdBy: "tester", operations: [{ type: "reverse" }] });
    const archive = source.exportArchive();
    const restored = new TimelineSliceTransformationEngine();
    restored.restoreArchive(archive);
    expect(restored.list()).toEqual([first.recipe]);
    expect(() => restored.restoreArchive({ recipes: [...archive.recipes, ...archive.recipes] })).toThrow(/duplicate/i);
    const next = restored.create({ sliceMap: createSliceMap(), sliceId: "slice-1", createdBy: "tester", operations: [{ type: "gain", decibels: -6 }] });
    expect(next.recipe?.id).toBe("timeline-slice-transformation-2");
    expect(next.recipe?.operations[0]?.id).toBe("timeline-slice-transformation-2-operation-1");
  });
});
