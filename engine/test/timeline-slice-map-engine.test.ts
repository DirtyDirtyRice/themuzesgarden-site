import { describe, expect, it } from "vitest";
import { TimelineSliceMapEngine } from "../../lib/timeline/TimelineSliceMapEngine";
import type { TimelineTransientAnalysisRecord } from "../../lib/timeline/TimelineTransientAnalysisEngine";
import type { TimelineTempoKeyAnalysisRecord } from "../../lib/timeline/TimelineTempoKeyAnalysisEngine";

function evidence(): {
  transient: TimelineTransientAnalysisRecord;
  tempoKey: TimelineTempoKeyAnalysisRecord;
} {
  const transient: TimelineTransientAnalysisRecord = {
    id: "timeline-transient-analysis-1",
    sourceArtifactId: "artifact-1",
    sourceFingerprint: "sha256-1",
    decodeEvidenceId: "decode-1",
    sampleRate: 1_000,
    channelCount: 1,
    frameCount: 2_000,
    configuration: {
      analysisWindowMilliseconds: 5,
      minimumTransientSpacingMilliseconds: 35,
      sensitivity: 0.5,
      silenceThresholdDb: -48,
      minimumSilenceMilliseconds: 80,
      minimumPhraseMilliseconds: 40,
    },
    transients: [],
    silenceRegions: [],
    phraseRegions: [],
    boundaries: [
      { id: "b-start", frame: 0, seconds: 0, kind: "start", confidence: 1 },
      { id: "b-micro", frame: 5, seconds: 0.005, kind: "transient", confidence: 0.9 },
      { id: "b-1", frame: 500, seconds: 0.5, kind: "transient", confidence: 0.9 },
      { id: "b-silence", frame: 1_000, seconds: 1, kind: "silence-edge", confidence: 0.8 },
      { id: "b-2", frame: 1_500, seconds: 1.5, kind: "transient", confidence: 0.9 },
      { id: "b-end", frame: 2_000, seconds: 2, kind: "end", confidence: 1 },
    ],
    analyzedAt: "2026-07-26T00:00:00.000Z",
    analyzedBy: "member-1",
  };
  const tempoKey: TimelineTempoKeyAnalysisRecord = {
    id: "timeline-tempo-key-analysis-1",
    sourceArtifactId: "artifact-1",
    sourceFingerprint: "sha256-1",
    decodeEvidenceId: "decode-1",
    transientAnalysisId: transient.id,
    sampleRate: 1_000,
    frameCount: 2_000,
    configuration: {
      minimumBpm: 40, maximumBpm: 240, tempoResolution: 0.1,
      spectralWindowSize: 4_096, minimumFrequencyHz: 55, maximumFrequencyHz: 4_186,
    },
    tempoCandidates: [{ bpm: 120, confidence: 0.8, supportingIntervals: 6 }],
    selectedTempo: { bpm: 120, confidence: 0.8, supportingIntervals: 6 },
    keyCandidates: [{ tonic: "C", mode: "major", confidence: 0.8, correlation: 0.8 }],
    selectedKey: { tonic: "C", mode: "major", confidence: 0.8, correlation: 0.8 },
    chroma: { C: 1, "C#": 0, D: 0, "D#": 0, E: 0, F: 0, "F#": 0, G: 0, "G#": 0, A: 0, "A#": 0, B: 0 },
    tempoAmbiguous: false,
    keyAmbiguous: false,
    analyzedAt: "2026-07-26T00:00:00.000Z",
    analyzedBy: "member-1",
  };
  return { transient, tempoKey };
}

function create(engine: TimelineSliceMapEngine, data = evidence(), configuration = {}) {
  return engine.create({
    sourceArtifactId: "artifact-1",
    sourceFingerprint: "sha256-1",
    decodeEvidenceId: "decode-1",
    transientAnalysis: data.transient,
    tempoKeyAnalysis: data.tempoKey,
    configuration,
    createdBy: "member-1",
  });
}

describe("TimelineSliceMapEngine", () => {
  it("creates stable non-destructive slices with musical positions", () => {
    const engine = new TimelineSliceMapEngine(
      () => new Date("2026-07-26T02:00:00.000Z"),
    );
    const result = create(engine);
    expect(result.accepted).toBe(true);
    expect(result.sliceMap).toMatchObject({
      id: "timeline-slice-map-1",
      tempo: { bpm: 120 },
      key: { tonic: "C", mode: "major" },
      createdAt: "2026-07-26T02:00:00.000Z",
    });
    expect(result.sliceMap!.slices).toHaveLength(4);
    expect(result.sliceMap!.slices[1]).toMatchObject({
      startFrame: 500, endFrame: 1_000, startBeat: 1, endBeat: 2,
      bar: 1, beatInBar: 2,
    });
    expect(result.sliceMap!.discardedBoundaryIds).toContain("b-micro");
  });

  it("can exclude silence edges and never creates a destructive audio copy", () => {
    const result = create(new TimelineSliceMapEngine(), evidence(), {
      includeSilenceEdges: false,
    });
    expect(result.sliceMap!.slices).toHaveLength(3);
    expect(result.sliceMap!.discardedBoundaryIds).toContain("b-silence");
    expect(result.sliceMap).not.toHaveProperty("audio");
  });

  it("withholds beat and key labels when upstream analysis is ambiguous", () => {
    const data = evidence();
    data.tempoKey.tempoAmbiguous = true;
    data.tempoKey.keyAmbiguous = true;
    const result = create(new TimelineSliceMapEngine(), data);
    expect(result.sliceMap!.tempo).toBeNull();
    expect(result.sliceMap!.key).toBeNull();
    expect(result.sliceMap!.slices[0].startBeat).toBeNull();
  });

  it("rejects mismatched evidence and malformed boundaries", () => {
    const data = evidence();
    data.tempoKey.sourceFingerprint = "wrong";
    data.transient.boundaries[2].frame = -1;
    const result = create(new TimelineSliceMapEngine(), data);
    expect(result.accepted).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "boundaries-invalid", "evidence-mismatch",
    ]);
  });

  it("restores archives without reusing map identities", () => {
    const original = new TimelineSliceMapEngine();
    create(original);
    const restored = new TimelineSliceMapEngine();
    restored.restoreArchive(original.exportArchive());
    expect(create(restored).sliceMap?.id).toBe("timeline-slice-map-2");
    expect(() => restored.restoreArchive({
      sliceMaps: [original.list()[0], original.list()[0]],
    })).toThrow("Duplicate slice-map id");
  });
});
