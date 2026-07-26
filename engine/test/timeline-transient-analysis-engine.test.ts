import { describe, expect, it } from "vitest";

import type { TimelineDecodedAudioBuffer } from "../../lib/timeline/TimelineAudioDecodeEngine";
import { TimelineTransientAnalysisEngine } from "../../lib/timeline/TimelineTransientAnalysisEngine";

function audioWithAttacks(input: {
  sampleRate?: number;
  durationSeconds?: number;
  attackSeconds: number[];
  channels?: number;
}): TimelineDecodedAudioBuffer {
  const sampleRate = input.sampleRate ?? 8_000;
  const frameCount = Math.round(
    sampleRate * (input.durationSeconds ?? 1),
  );
  const channelCount = input.channels ?? 1;
  const channels = Array.from(
    { length: channelCount },
    () => new Float32Array(frameCount),
  );
  for (const attackSeconds of input.attackSeconds) {
    const start = Math.round(attackSeconds * sampleRate);
    const length = Math.round(sampleRate * 0.025);
    for (let offset = 0; offset < length && start + offset < frameCount; offset += 1) {
      const envelope = 0.9 * (1 - offset / length);
      for (let channel = 0; channel < channelCount; channel += 1) {
        channels[channel][start + offset] = envelope * (1 - channel * 0.1);
      }
    }
  }
  return {
    sampleRate,
    channelCount,
    frameCount,
    durationSeconds: frameCount / sampleRate,
    channels,
  };
}

function analyze(
  engine: TimelineTransientAnalysisEngine,
  audio: TimelineDecodedAudioBuffer,
  configuration = {},
) {
  return engine.analyze({
    sourceArtifactId: "artifact-loop-1",
    sourceFingerprint: "sha256-loop-1",
    decodeEvidenceId: "timeline-audio-decode-1",
    audio,
    configuration,
    analyzedBy: "member-1",
  });
}

describe("TimelineTransientAnalysisEngine", () => {
  it("detects attacks, silence, phrases, and ranked slice boundaries from audio", () => {
    const engine = new TimelineTransientAnalysisEngine(
      () => new Date("2026-07-26T00:10:00.000Z"),
    );
    const result = analyze(
      engine,
      audioWithAttacks({
        attackSeconds: [0.1, 0.3, 0.7],
        channels: 2,
      }),
      {
        analysisWindowMilliseconds: 5,
        minimumTransientSpacingMilliseconds: 50,
        silenceThresholdDb: -42,
        minimumSilenceMilliseconds: 60,
        minimumPhraseMilliseconds: 20,
        sensitivity: 0.25,
      },
    );

    expect(result.accepted).toBe(true);
    expect(result.analysis).toMatchObject({
      id: "timeline-transient-analysis-1",
      sourceArtifactId: "artifact-loop-1",
      decodeEvidenceId: "timeline-audio-decode-1",
      sampleRate: 8_000,
      channelCount: 2,
      analyzedAt: "2026-07-26T00:10:00.000Z",
    });
    const seconds = result.analysis!.transients.map((value) => value.seconds);
    expect(seconds).toHaveLength(3);
    expect(seconds[0]).toBeCloseTo(0.1, 2);
    expect(seconds[1]).toBeCloseTo(0.3, 2);
    expect(seconds[2]).toBeCloseTo(0.7, 2);
    expect(result.analysis!.silenceRegions.length).toBeGreaterThanOrEqual(3);
    expect(result.analysis!.phraseRegions).toHaveLength(3);
    expect(result.analysis!.boundaries[0]).toMatchObject({
      frame: 0,
      kind: "start",
      confidence: 1,
    });
    expect(result.analysis!.boundaries.at(-1)).toMatchObject({
      frame: 8_000,
      kind: "end",
      confidence: 1,
    });
    expect(
      result.analysis!.boundaries.filter((value) => value.kind === "transient"),
    ).toHaveLength(3);
  });

  it("uses minimum spacing to prevent double-triggering one dense performance", () => {
    const audio = audioWithAttacks({
      attackSeconds: [0.1, 0.13, 0.16, 0.5],
    });
    const engine = new TimelineTransientAnalysisEngine();
    const result = analyze(engine, audio, {
      minimumTransientSpacingMilliseconds: 100,
      sensitivity: 0.1,
      minimumSilenceMilliseconds: 20,
    });

    expect(result.accepted).toBe(true);
    expect(result.analysis!.transients).toHaveLength(2);
    expect(result.analysis!.transients[0].seconds).toBeCloseTo(0.1, 2);
    expect(result.analysis!.transients[1].seconds).toBeCloseTo(0.5, 2);
  });

  it("holds invalid metadata, unsafe settings, and silent audio without evidence", () => {
    const engine = new TimelineTransientAnalysisEngine();
    const invalid = engine.analyze({
      sourceArtifactId: "",
      sourceFingerprint: "",
      decodeEvidenceId: "",
      audio: {
        sampleRate: 100,
        channelCount: 1,
        frameCount: 1,
        durationSeconds: 0.01,
        channels: [Float32Array.from([2])],
      },
      configuration: { sensitivity: 2 },
      analyzedBy: "member-1",
    });
    const silent = analyze(engine, {
      sampleRate: 8_000,
      channelCount: 1,
      frameCount: 8_000,
      durationSeconds: 1,
      channels: [new Float32Array(8_000)],
    });

    expect(invalid.issues.map((issue) => issue.code)).toEqual([
      "source-required",
      "fingerprint-required",
      "decode-evidence-required",
      "audio-invalid",
      "configuration-invalid",
    ]);
    expect(silent.issues).toEqual([{
      code: "analysis-empty",
      message: "Audio contains no measurable signal to analyze.",
    }]);
    expect(engine.history()).toEqual([]);
  });

  it("isolates analysis histories for different source artifacts", () => {
    const engine = new TimelineTransientAnalysisEngine();
    const audio = audioWithAttacks({ attackSeconds: [0.2, 0.6] });
    analyze(engine, audio);
    engine.analyze({
      sourceArtifactId: "artifact-loop-2",
      sourceFingerprint: "sha256-loop-2",
      decodeEvidenceId: "timeline-audio-decode-2",
      audio,
      analyzedBy: "member-2",
    });

    expect(engine.history()).toHaveLength(2);
    expect(engine.history("artifact-loop-1")).toHaveLength(1);
    expect(engine.history("artifact-loop-2")[0]).toMatchObject({
      id: "timeline-transient-analysis-2",
      analyzedBy: "member-2",
    });
  });

  it("restores compact evidence and continues stable analysis IDs", () => {
    const audio = audioWithAttacks({ attackSeconds: [0.25, 0.75] });
    const source = new TimelineTransientAnalysisEngine();
    analyze(source, audio);
    const archive = source.exportArchive();
    const restarted = new TimelineTransientAnalysisEngine();
    restarted.restoreArchive(archive);
    const next = restarted.analyze({
      sourceArtifactId: "artifact-loop-2",
      sourceFingerprint: "sha256-loop-2",
      decodeEvidenceId: "timeline-audio-decode-2",
      audio,
      analyzedBy: "member-2",
    });

    expect(archive).not.toHaveProperty("audio");
    expect(restarted.getAnalysis("timeline-transient-analysis-1")).toEqual(
      archive.analyses[0],
    );
    expect(next.analysis?.id).toBe("timeline-transient-analysis-2");
    expect(() => restarted.restoreArchive({
      analyses: [archive.analyses[0], archive.analyses[0]],
    })).toThrow("Duplicate transient analysis ID");
  });
});
