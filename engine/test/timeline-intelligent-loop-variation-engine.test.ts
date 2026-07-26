import { describe, expect, it } from "vitest";
import { TimelineIntelligentLoopVariationEngine } from "../../lib/timeline/TimelineIntelligentLoopVariationEngine";
import type { TimelineLoopSequenceRecord } from "../../lib/timeline/TimelineLoopSequencingEngine";

function sequence(
  overrides: Partial<TimelineLoopSequenceRecord> = {},
): TimelineLoopSequenceRecord {
  const steps = Array.from({ length: 16 }, (_, index) => ({
    id: `sequence-1-step-${index + 1}`,
    step: index,
    bar: 1,
    beat: Math.floor(index / 4) + 1,
    subdivision: index % 4,
    sliceId: index % 2 ? "slice-2" : "slice-1",
    probability: 1,
    accent: index % 4 === 0 ? 1.2 : 1,
    repeat: 1,
    grooveOffsetSeconds: 0,
  }));
  return {
    id: "sequence-1",
    sourceArtifactId: "audio-1",
    sourceFingerprint: "fingerprint-1",
    sliceMapId: "slice-map-1",
    grooveMappingId: "groove-1",
    bpm: 120,
    configuration: {
      beatsPerBar: 4,
      subdivisionsPerBeat: 4,
      bars: 1,
      seed: 10,
    },
    steps,
    events: [],
    durationSeconds: 2,
    skippedStepIds: [],
    createdAt: "2026-07-25T12:00:00.000Z",
    createdBy: "tester",
    ...overrides,
  };
}

describe("TimelineIntelligentLoopVariationEngine", () => {
  it("creates ranked, explained, deterministic alternatives without changing the source", () => {
    const source = sequence();
    const before = structuredClone(source);
    const input = {
      sequence: source,
      configuration: {
        variationCount: 3,
        seed: 99,
        goal: "balanced" as const,
        maximumChangedSteps: 6,
      },
      createdBy: "tester",
    };
    const first = new TimelineIntelligentLoopVariationEngine().create(input);
    const second = new TimelineIntelligentLoopVariationEngine().create(input);

    expect(first.accepted).toBe(true);
    expect(first.variation?.candidates).toEqual(second.variation?.candidates);
    expect(first.variation?.candidates).toHaveLength(3);
    expect(first.variation?.candidates.map((candidate) => candidate.rank)).toEqual([1, 2, 3]);
    expect(first.variation?.candidates.every((candidate) =>
      candidate.changes.length > 0 &&
      candidate.changes.every((change) => change.reason.length > 0)
    )).toBe(true);
    expect(source).toEqual(before);
  });

  it("preserves first-beat downbeats and obeys the maximum changed-step limit", () => {
    const result = new TimelineIntelligentLoopVariationEngine().create({
      sequence: sequence(),
      configuration: {
        variationCount: 8,
        seed: 42,
        goal: "bold",
        preserveDownbeats: true,
        maximumChangedSteps: 4,
      },
      createdBy: "tester",
    });

    expect(result.accepted).toBe(true);
    for (const candidate of result.variation?.candidates ?? []) {
      expect(candidate.changedStepCount).toBeLessThanOrEqual(4);
      expect(candidate.changes.some((change) => change.step === 0)).toBe(false);
      expect(candidate.pattern[0]).toEqual(sequence().steps[0]);
      expect(candidate.continuityScore + candidate.noveltyScore).toBe(1);
    }
  });

  it("keeps every generated slice inside the proven source vocabulary", () => {
    const result = new TimelineIntelligentLoopVariationEngine().create({
      sequence: sequence(),
      configuration: {
        variationCount: 12,
        seed: 7,
        goal: "bold",
        maximumChangedSteps: 12,
      },
      createdBy: "tester",
    });
    const allowed = new Set(["slice-1", "slice-2", null]);
    expect(result.variation?.candidates.every((candidate) =>
      candidate.pattern.every((step) => allowed.has(step.sliceId))
    )).toBe(true);
  });

  it("rejects malformed sequences, invalid settings, and loops that cannot vary", () => {
    const engine = new TimelineIntelligentLoopVariationEngine();
    const malformed = engine.create({
      sequence: sequence({ steps: sequence().steps.slice(0, 4) }),
      createdBy: "tester",
    });
    const invalid = engine.create({
      sequence: sequence(),
      configuration: { variationCount: 0, maximumChangedSteps: 100 },
      createdBy: "tester",
    });
    const impossibleSource = sequence();
    impossibleSource.steps = impossibleSource.steps.map((step) => ({
      ...step,
      sliceId: null,
    }));
    const impossible = engine.create({
      sequence: impossibleSource,
      createdBy: "tester",
    });

    expect(malformed.issues.some((issue) => issue.code === "sequence-invalid")).toBe(true);
    expect(invalid.issues.some((issue) => issue.code === "configuration-invalid")).toBe(true);
    expect(impossible.issues.some((issue) => issue.code === "variation-impossible")).toBe(true);
  });

  it("restores archives, rejects duplicates, and continues stable identities", () => {
    const source = new TimelineIntelligentLoopVariationEngine();
    const first = source.create({
      sequence: sequence(),
      configuration: { variationCount: 1 },
      createdBy: "tester",
    });
    const archive = source.exportArchive();
    const restored = new TimelineIntelligentLoopVariationEngine();
    restored.restoreArchive(archive);

    expect(restored.list()).toEqual([first.variation]);
    expect(() => restored.restoreArchive({
      variations: [...archive.variations, ...archive.variations],
    })).toThrow(/duplicate/i);

    const next = restored.create({
      sequence: sequence(),
      configuration: { variationCount: 1 },
      createdBy: "tester",
    });
    expect(next.variation?.id).toBe("timeline-loop-variation-2");
    expect(next.variation?.candidates[0]?.id).toBe(
      "timeline-loop-variation-2-candidate-1",
    );
  });
});
