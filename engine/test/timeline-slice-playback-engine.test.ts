import { describe, expect, it } from "vitest";
import { TimelineSlicePlaybackEngine } from "../../lib/timeline/TimelineSlicePlaybackEngine";
import type { TimelineSliceMapRecord } from "../../lib/timeline/TimelineSliceMapEngine";

function sliceMap(): TimelineSliceMapRecord {
  const boundary = (id: string) => ({
    boundaryId: id,
    kind: "transient" as const,
    confidence: 0.9,
  });
  return {
    id: "slice-map-1",
    sourceArtifactId: "artifact-1",
    sourceFingerprint: "sha256-1",
    decodeEvidenceId: "decode-1",
    transientAnalysisId: "transient-1",
    tempoKeyAnalysisId: "tempo-key-1",
    sampleRate: 1_000,
    frameCount: 1_000,
    durationSeconds: 1,
    configuration: {
      minimumSliceMilliseconds: 20,
      includeSilenceEdges: true,
      minimumBoundaryConfidence: 0.25,
      beatsPerBar: 4,
    },
    tempo: { bpm: 120, confidence: 0.9, supportingIntervals: 8 },
    key: null,
    slices: [
      {
        id: "slice-1", index: 0, startFrame: 0, endFrame: 400,
        startSeconds: 0, endSeconds: 0.4, durationSeconds: 0.4,
        startBeat: 0, endBeat: 0.8, bar: 1, beatInBar: 1,
        openingBoundary: boundary("b0"), closingBoundary: boundary("b1"),
      },
      {
        id: "slice-2", index: 1, startFrame: 400, endFrame: 1_000,
        startSeconds: 0.4, endSeconds: 1, durationSeconds: 0.6,
        startBeat: 0.8, endBeat: 2, bar: 1, beatInBar: 1.8,
        openingBoundary: boundary("b1"), closingBoundary: boundary("b2"),
      },
    ],
    discardedBoundaryIds: [],
    createdAt: "2026-07-26T02:00:00.000Z",
    createdBy: "member-1",
  };
}

describe("TimelineSlicePlaybackEngine", () => {
  it("schedules deterministic one-shot playback without copying audio", () => {
    const engine = new TimelineSlicePlaybackEngine(
      () => new Date("2026-07-26T04:00:00.000Z"),
    );
    const result = engine.schedule({
      sliceMap: sliceMap(),
      sliceIds: ["slice-2", "slice-1"],
      configuration: { startAtSeconds: 2, gain: 0.75 },
      createdBy: "member-1",
    });
    expect(result.accepted).toBe(true);
    expect(result.plan).toMatchObject({
      id: "timeline-slice-playback-1",
      totalDurationSeconds: 1,
      createdAt: "2026-07-26T04:00:00.000Z",
    });
    expect(result.plan!.instructions).toMatchObject([
      {
        sliceId: "slice-2", timelineStartSeconds: 2,
        timelineEndSeconds: 2.6, sourceStartFrame: 400, gain: 0.75,
      },
      {
        sliceId: "slice-1", timelineStartSeconds: 2.6,
        timelineEndSeconds: 3, sourceStartFrame: 0, gain: 0.75,
      },
    ]);
    expect(result.plan).not.toHaveProperty("audio");
  });

  it("builds a repeated loop plan with continuous instruction timing", () => {
    const result = new TimelineSlicePlaybackEngine().schedule({
      sliceMap: sliceMap(),
      sliceIds: ["slice-1", "slice-2"],
      configuration: { mode: "loop", repetitions: 3 },
      createdBy: "member-1",
    });
    expect(result.plan!.instructions).toHaveLength(6);
    expect(result.plan!.totalDurationSeconds).toBe(3);
    expect(result.plan!.instructions.at(-1)).toMatchObject({
      repetition: 2, timelineStartSeconds: 2.4, timelineEndSeconds: 3,
    });
  });

  it("gates slices and clamps fades to safe half-duration limits", () => {
    const result = new TimelineSlicePlaybackEngine().schedule({
      sliceMap: sliceMap(),
      sliceIds: ["slice-1"],
      configuration: {
        mode: "gated",
        gateDurationSeconds: 0.1,
        repetitions: 2,
        fadeInMilliseconds: 90,
        fadeOutMilliseconds: 90,
      },
      createdBy: "member-1",
    });
    expect(result.plan!.totalDurationSeconds).toBe(0.2);
    expect(result.plan!.instructions[0]).toMatchObject({
      sourceEndFrame: 100,
      durationSeconds: 0.1,
      fadeInSeconds: 0.05,
      fadeOutSeconds: 0.05,
    });
  });

  it("rejects missing selections, unknown slices, and invalid gates", () => {
    const engine = new TimelineSlicePlaybackEngine();
    const missing = engine.schedule({
      sliceMap: sliceMap(), sliceIds: [], createdBy: "member-1",
    });
    expect(missing.issues[0].code).toBe("selection-required");
    const unknown = engine.schedule({
      sliceMap: sliceMap(), sliceIds: ["missing"], createdBy: "member-1",
    });
    expect(unknown.issues[0].code).toBe("slice-not-found");
    const invalidGate = engine.schedule({
      sliceMap: sliceMap(),
      sliceIds: ["slice-1"],
      configuration: { mode: "gated", gateDurationSeconds: 0.0001 },
      createdBy: "member-1",
    });
    expect(invalidGate.issues[0].code).toBe("gate-too-short");
  });

  it("restores archives without reusing playback plan ids", () => {
    const original = new TimelineSlicePlaybackEngine();
    original.schedule({
      sliceMap: sliceMap(), sliceIds: ["slice-1"], createdBy: "member-1",
    });
    const restored = new TimelineSlicePlaybackEngine();
    restored.restoreArchive(original.exportArchive());
    const next = restored.schedule({
      sliceMap: sliceMap(), sliceIds: ["slice-2"], createdBy: "member-1",
    });
    expect(next.plan?.id).toBe("timeline-slice-playback-2");
    expect(() => restored.restoreArchive({
      plans: [original.list()[0], original.list()[0]],
    })).toThrow("Duplicate playback plan id");
  });
});
