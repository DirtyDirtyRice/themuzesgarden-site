import { describe, expect, it } from "vitest";

import type { TimelineDecodedAudioBuffer } from "../../lib/timeline/TimelineAudioDecodeEngine";
import { TimelineTempoKeyAnalysisEngine } from "../../lib/timeline/TimelineTempoKeyAnalysisEngine";
import type { TimelineTransientAnalysisRecord } from "../../lib/timeline/TimelineTransientAnalysisEngine";

function musicalAudio(
  frequencies = [261.63, 329.63, 392],
  durationSeconds = 4,
): TimelineDecodedAudioBuffer {
  const sampleRate = 8_000;
  const frameCount = sampleRate * durationSeconds;
  const channel = new Float32Array(frameCount);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const seconds = frame / sampleRate;
    channel[frame] = frequencies.reduce(
      (sum, frequency) => sum + Math.sin(2 * Math.PI * frequency * seconds),
      0,
    ) / (frequencies.length * 1.2);
  }
  return {
    sampleRate,
    channelCount: 1,
    frameCount,
    durationSeconds,
    channels: [channel],
  };
}

function transientEvidence(
  audio: TimelineDecodedAudioBuffer,
  bpm = 120,
): TimelineTransientAnalysisRecord {
  const interval = 60 / bpm;
  const transients = Array.from(
    { length: Math.floor(audio.durationSeconds / interval) },
    (_, index) => {
      const seconds = index * interval;
      return {
        id: `transient-${index + 1}`,
        frame: Math.round(seconds * audio.sampleRate),
        seconds,
        strength: 1,
        peakAmplitude: 0.9,
      };
    },
  );
  return {
    id: "timeline-transient-analysis-1",
    sourceArtifactId: "artifact-loop-1",
    sourceFingerprint: "sha256-loop-1",
    decodeEvidenceId: "timeline-audio-decode-1",
    sampleRate: audio.sampleRate,
    channelCount: audio.channelCount,
    frameCount: audio.frameCount,
    configuration: {
      analysisWindowMilliseconds: 5,
      minimumTransientSpacingMilliseconds: 35,
      sensitivity: 0.5,
      silenceThresholdDb: -48,
      minimumSilenceMilliseconds: 80,
      minimumPhraseMilliseconds: 40,
    },
    transients,
    silenceRegions: [],
    phraseRegions: [],
    boundaries: [],
    analyzedAt: "2026-07-26T00:00:00.000Z",
    analyzedBy: "member-1",
  };
}

function analyze(
  engine: TimelineTempoKeyAnalysisEngine,
  audio: TimelineDecodedAudioBuffer,
  evidence = transientEvidence(audio),
  configuration = {},
) {
  return engine.analyze({
    sourceArtifactId: "artifact-loop-1",
    sourceFingerprint: "sha256-loop-1",
    decodeEvidenceId: "timeline-audio-decode-1",
    transientAnalysis: evidence,
    audio,
    configuration,
    analyzedBy: "member-1",
  });
}

describe("TimelineTempoKeyAnalysisEngine", () => {
  it("finds stable tempo and C-major key from rhythmic tonal evidence", () => {
    const engine = new TimelineTempoKeyAnalysisEngine(
      () => new Date("2026-07-26T01:00:00.000Z"),
    );
    const result = analyze(engine, musicalAudio());

    expect(result.accepted).toBe(true);
    expect(result.analysis).toMatchObject({
      id: "timeline-tempo-key-analysis-1",
      sourceArtifactId: "artifact-loop-1",
      selectedTempo: { bpm: 120 },
      selectedKey: { tonic: "C", mode: "major" },
      analyzedAt: "2026-07-26T01:00:00.000Z",
    });
    expect(result.analysis!.tempoCandidates[0].supportingIntervals).toBeGreaterThan(1);
    expect(result.analysis!.chroma.C).toBeGreaterThan(result.analysis!.chroma["C#"]);
  });

  it("retains ranked alternatives and marks uncertain evidence", () => {
    const engine = new TimelineTempoKeyAnalysisEngine();
    const audio = musicalAudio([440], 2);
    const evidence = transientEvidence(audio, 120);
    evidence.transients = evidence.transients.slice(0, 2);
    const result = analyze(engine, audio, evidence);

    expect(result.accepted).toBe(true);
    expect(result.analysis!.tempoAmbiguous).toBe(true);
    expect(result.analysis!.keyCandidates.length).toBeGreaterThan(1);
    expect(result.analysis!.keyAmbiguous).toBe(true);
  });

  it("rejects mismatched evidence and invalid configuration", () => {
    const engine = new TimelineTempoKeyAnalysisEngine();
    const audio = musicalAudio();
    const evidence = transientEvidence(audio);
    evidence.sourceFingerprint = "wrong";
    const result = analyze(
      engine,
      audio,
      evidence,
      { minimumBpm: 200, maximumBpm: 100 },
    );

    expect(result.accepted).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "configuration-invalid",
      "evidence-mismatch",
    ]);
  });

  it("isolates histories by source artifact", () => {
    const engine = new TimelineTempoKeyAnalysisEngine();
    const audio = musicalAudio();
    analyze(engine, audio);
    const evidence = transientEvidence(audio);
    evidence.sourceArtifactId = "artifact-loop-2";
    evidence.sourceFingerprint = "sha256-loop-2";
    engine.analyze({
      sourceArtifactId: "artifact-loop-2",
      sourceFingerprint: "sha256-loop-2",
      decodeEvidenceId: "timeline-audio-decode-1",
      transientAnalysis: evidence,
      audio,
      analyzedBy: "member-1",
    });

    expect(engine.list()).toHaveLength(2);
    expect(engine.list("artifact-loop-2")).toHaveLength(1);
  });

  it("restores archives without reusing stable analysis ids", () => {
    const original = new TimelineTempoKeyAnalysisEngine();
    const audio = musicalAudio();
    analyze(original, audio);
    const restored = new TimelineTempoKeyAnalysisEngine();
    restored.restoreArchive(original.exportArchive());
    const next = analyze(restored, audio);

    expect(restored.get("timeline-tempo-key-analysis-1")).not.toBeNull();
    expect(next.analysis?.id).toBe("timeline-tempo-key-analysis-2");
    expect(() => restored.restoreArchive({
      analyses: [original.list()[0], original.list()[0]],
    })).toThrow("Duplicate tempo/key analysis id");
  });
});
