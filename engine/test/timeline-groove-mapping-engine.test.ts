import { describe, expect, it } from "vitest";
import { TimelineGrooveMappingEngine } from "../../lib/timeline/TimelineGrooveMappingEngine";
import type { TimelineSliceMapRecord } from "../../lib/timeline/TimelineSliceMapEngine";

function sliceMap(
  offsetsMilliseconds = [0, 30, 0, 30, 0, 30, 0, 30],
): TimelineSliceMapRecord {
  const bpm = 120;
  const stepSeconds = 0.25;
  const sampleRate = 1_000;
  const starts = offsetsMilliseconds.map(
    (offset, index) => index * stepSeconds + offset / 1_000,
  );
  return {
    id: "timeline-slice-map-1",
    sourceArtifactId: "artifact-1",
    sourceFingerprint: "sha256-1",
    decodeEvidenceId: "decode-1",
    transientAnalysisId: "transient-1",
    tempoKeyAnalysisId: "tempo-key-1",
    sampleRate,
    frameCount: 2_000,
    durationSeconds: 2,
    configuration: {
      minimumSliceMilliseconds: 20,
      includeSilenceEdges: true,
      minimumBoundaryConfidence: 0.25,
      beatsPerBar: 4,
    },
    tempo: { bpm, confidence: 0.9, supportingIntervals: 8 },
    key: { tonic: "C", mode: "major", confidence: 0.8, correlation: 0.8 },
    slices: starts.map((start, index) => {
      const end = index === starts.length - 1 ? 2 : starts[index + 1];
      return {
        id: `slice-${index + 1}`,
        index,
        startFrame: Math.round(start * sampleRate),
        endFrame: Math.round(end * sampleRate),
        startSeconds: start,
        endSeconds: end,
        durationSeconds: end - start,
        startBeat: start * bpm / 60,
        endBeat: end * bpm / 60,
        bar: 1,
        beatInBar: start * bpm / 60 + 1,
        openingBoundary: {
          boundaryId: `boundary-${index}`,
          kind: index ? "transient" : "start",
          confidence: index % 2 ? 0.6 : 1,
        },
        closingBoundary: {
          boundaryId: `boundary-${index + 1}`,
          kind: index === starts.length - 1 ? "end" : "transient",
          confidence: index % 2 ? 1 : 0.6,
        },
      };
    }),
    discardedBoundaryIds: [],
    createdAt: "2026-07-26T02:00:00.000Z",
    createdBy: "member-1",
  };
}

describe("TimelineGrooveMappingEngine", () => {
  it("extracts timing offsets, accents, and a reusable groove template", () => {
    const engine = new TimelineGrooveMappingEngine(
      () => new Date("2026-07-26T03:00:00.000Z"),
    );
    const result = engine.create({
      sliceMap: sliceMap(),
      createdBy: "member-1",
    });
    expect(result.accepted).toBe(true);
    expect(result.groove).toMatchObject({
      id: "timeline-groove-1",
      bpm: 120,
      ambiguous: false,
      createdAt: "2026-07-26T03:00:00.000Z",
    });
    expect(result.groove!.steps.map((step) => step.offsetMilliseconds)).toEqual([
      0, 30, 0, 30, 0, 30, 0, 30,
    ]);
    expect(result.groove!.template.offsets.slice(0, 4)).toEqual([
      0, 0.12, 0, 0.12,
    ]);
    expect(result.groove!.timingSpreadMilliseconds).toBe(15);
  });

  it("marks short patterns ambiguous rather than overstating confidence", () => {
    const map = sliceMap([0, 20, 0, 20]);
    const result = new TimelineGrooveMappingEngine().create({
      sliceMap: map,
      createdBy: "member-1",
    });
    expect(result.accepted).toBe(true);
    expect(result.groove!.ambiguous).toBe(true);
    expect(result.groove!.confidence).toBeLessThan(0.5);
  });

  it("supports uniform accents and clamps implausible timing offsets", () => {
    const result = new TimelineGrooveMappingEngine().create({
      sliceMap: sliceMap([0, 180, 0, 180, 0, 180, 0, 180]),
      configuration: {
        maximumTimingOffsetMilliseconds: 50,
        accentNormalization: "uniform",
      },
      createdBy: "member-1",
    });
    expect(result.groove!.steps.every((step) => step.accent === 1)).toBe(true);
    expect(result.groove!.steps.every(
      (step) => Math.abs(step.offsetMilliseconds) <= 50,
    )).toBe(true);
    expect(result.groove!.ambiguous).toBe(true);
  });

  it("refuses untrusted tempo, malformed maps, and insufficient evidence", () => {
    const map = sliceMap([0, 0]);
    map.tempo = null;
    map.slices[1].startFrame = -1;
    const result = new TimelineGrooveMappingEngine().create({
      sliceMap: map,
      configuration: { minimumSlices: 4 },
      createdBy: "member-1",
    });
    expect(result.accepted).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "tempo-required", "slice-map-invalid", "insufficient-evidence",
    ]);
  });

  it("restores archives without reusing stable groove ids", () => {
    const original = new TimelineGrooveMappingEngine();
    original.create({ sliceMap: sliceMap(), createdBy: "member-1" });
    const restored = new TimelineGrooveMappingEngine();
    restored.restoreArchive(original.exportArchive());
    const next = restored.create({ sliceMap: sliceMap(), createdBy: "member-1" });
    expect(next.groove?.id).toBe("timeline-groove-2");
    expect(() => restored.restoreArchive({
      grooves: [original.list()[0], original.list()[0]],
    })).toThrow("Duplicate groove id");
  });
});
