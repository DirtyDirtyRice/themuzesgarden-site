import { describe, expect, it } from "vitest";
import { TimelineLoopSequencingEngine } from "../../lib/timeline/TimelineLoopSequencingEngine";
import type { TimelineGrooveMappingRecord } from "../../lib/timeline/TimelineGrooveMappingEngine";
import type { TimelineSliceMapRecord } from "../../lib/timeline/TimelineSliceMapEngine";

function sliceMap(): TimelineSliceMapRecord {
  const boundary = { boundaryId: "b", kind: "transient" as const, confidence: 1 };
  return {
    id: "slice-map-1", sourceArtifactId: "artifact-1",
    sourceFingerprint: "sha256-1", decodeEvidenceId: "decode-1",
    transientAnalysisId: "transient-1", tempoKeyAnalysisId: "tempo-1",
    sampleRate: 1_000, frameCount: 1_000, durationSeconds: 1,
    configuration: {
      minimumSliceMilliseconds: 20, includeSilenceEdges: true,
      minimumBoundaryConfidence: 0.25, beatsPerBar: 4,
    },
    tempo: { bpm: 120, confidence: 0.9, supportingIntervals: 8 },
    key: null,
    slices: ["kick", "snare"].map((name, index) => ({
      id: name, index, startFrame: index * 500, endFrame: (index + 1) * 500,
      startSeconds: index * 0.5, endSeconds: (index + 1) * 0.5,
      durationSeconds: 0.5, startBeat: index, endBeat: index + 1,
      bar: 1, beatInBar: index + 1,
      openingBoundary: boundary, closingBoundary: boundary,
    })),
    discardedBoundaryIds: [], createdAt: "2026-07-26T00:00:00.000Z",
    createdBy: "member-1",
  };
}

function groove(): TimelineGrooveMappingRecord {
  return {
    id: "groove-1", sourceArtifactId: "artifact-1",
    sourceFingerprint: "sha256-1", sliceMapId: "slice-map-1", bpm: 120,
    configuration: {
      subdivisionsPerBeat: 2, maximumTimingOffsetMilliseconds: 125,
      minimumSlices: 4, accentNormalization: "uniform",
    },
    steps: [],
    template: {
      subdivisionsPerBeat: 2, cycleBeats: 4,
      offsets: [0, 0.1, 0, 0.1], accents: [1, 0.8, 1, 0.8],
      swingRatio: 1.2,
    },
    timingSpreadMilliseconds: 10, confidence: 0.8, ambiguous: false,
    createdAt: "2026-07-26T00:00:00.000Z", createdBy: "member-1",
  };
}

const pattern = [
  { sliceId: "kick" },
  { sliceId: "snare", accent: 0.5 },
  { sliceId: null },
  { sliceId: "kick", repeat: 2 },
];

describe("TimelineLoopSequencingEngine", () => {
  it("creates an editable grooved sequence with rests and repeats", () => {
    const result = new TimelineLoopSequencingEngine(
      () => new Date("2026-07-26T05:00:00.000Z"),
    ).create({
      sliceMap: sliceMap(), grooveMapping: groove(), pattern,
      configuration: { beatsPerBar: 2, subdivisionsPerBeat: 2, seed: 9 },
      createdBy: "member-1",
    });
    expect(result.accepted).toBe(true);
    expect(result.sequence).toMatchObject({
      id: "timeline-loop-sequence-1", bpm: 120, durationSeconds: 1,
      grooveMappingId: "groove-1", createdAt: "2026-07-26T05:00:00.000Z",
    });
    expect(result.sequence!.events).toHaveLength(4);
    expect(result.sequence!.skippedStepIds).toContain(
      "timeline-loop-sequence-1-step-3",
    );
    expect(result.sequence!.steps[1]).toMatchObject({
      beat: 1, subdivision: 1, grooveOffsetSeconds: 0.025, accent: 0.4,
    });
    expect(result.sequence!.events.at(-1)).toMatchObject({
      sliceId: "kick", repeat: 1, durationSeconds: 0.125,
    });
  });

  it("uses a stored seed for deterministic probability decisions", () => {
    const probabilistic = pattern.map((step) => ({ ...step, probability: 0.5 }));
    const first = new TimelineLoopSequencingEngine().create({
      sliceMap: sliceMap(), pattern: probabilistic,
      configuration: { beatsPerBar: 2, subdivisionsPerBeat: 2, seed: 42 },
      createdBy: "member-1",
    });
    const second = new TimelineLoopSequencingEngine().create({
      sliceMap: sliceMap(), pattern: probabilistic,
      configuration: { beatsPerBar: 2, subdivisionsPerBeat: 2, seed: 42 },
      createdBy: "member-1",
    });
    expect(first.sequence!.events.map((event) => ({
      sliceId: event.sliceId, roll: event.probabilityRoll,
    }))).toEqual(second.sequence!.events.map((event) => ({
      sliceId: event.sliceId, roll: event.probabilityRoll,
    })));
  });

  it("rejects patterns that do not fill the configured bars", () => {
    const result = new TimelineLoopSequencingEngine().create({
      sliceMap: sliceMap(), pattern: pattern.slice(0, 3),
      configuration: { beatsPerBar: 2, subdivisionsPerBeat: 2 },
      createdBy: "member-1",
    });
    expect(result.accepted).toBe(false);
    expect(result.issues[0].code).toBe("pattern-length-invalid");
  });

  it("rejects unknown slices, invalid steps, and foreign groove evidence", () => {
    const foreign = groove();
    foreign.sliceMapId = "other-map";
    const result = new TimelineLoopSequencingEngine().create({
      sliceMap: sliceMap(), grooveMapping: foreign,
      pattern: [
        { sliceId: "missing", probability: 2 },
        { sliceId: null }, { sliceId: null }, { sliceId: null },
      ],
      configuration: { beatsPerBar: 2, subdivisionsPerBeat: 2 },
      createdBy: "member-1",
    });
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "step-invalid", "slice-not-found", "groove-mismatch",
    ]);
  });

  it("restores archives without reusing sequence identities", () => {
    const original = new TimelineLoopSequencingEngine();
    original.create({
      sliceMap: sliceMap(), pattern,
      configuration: { beatsPerBar: 2, subdivisionsPerBeat: 2 },
      createdBy: "member-1",
    });
    const restored = new TimelineLoopSequencingEngine();
    restored.restoreArchive(original.exportArchive());
    const next = restored.create({
      sliceMap: sliceMap(), pattern,
      configuration: { beatsPerBar: 2, subdivisionsPerBeat: 2 },
      createdBy: "member-1",
    });
    expect(next.sequence?.id).toBe("timeline-loop-sequence-2");
    expect(() => restored.restoreArchive({
      sequences: [original.list()[0], original.list()[0]],
    })).toThrow("Duplicate sequence id");
  });
});
