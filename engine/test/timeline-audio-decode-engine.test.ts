import { describe, expect, it } from "vitest";

import {
  TimelineAudioDecodeEngine,
  type TimelineAudioDecoder,
} from "../../lib/timeline/TimelineAudioDecodeEngine";

function pcm16Wave(input: {
  sampleRate: number;
  channels: number[][];
}): Uint8Array {
  const channelCount = input.channels.length;
  const frameCount = input.channels[0]?.length ?? 0;
  if (
    channelCount === 0 ||
    input.channels.some((channel) => channel.length !== frameCount)
  ) {
    throw new Error("Test wave channels must have equal frame counts.");
  }
  const bitsPerSample = 16;
  const blockAlign = channelCount * (bitsPerSample / 8);
  const dataSize = frameCount * blockAlign;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      bytes[offset + index] = value.charCodeAt(index);
    }
  };
  writeText(0, "RIFF");
  view.setUint32(4, bytes.length - 8, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, input.sampleRate, true);
  view.setUint32(28, input.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeText(36, "data");
  view.setUint32(40, dataSize, true);
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const normalized = Math.max(-1, Math.min(1, input.channels[channel][frame]));
      const integer = normalized < 0
        ? Math.round(normalized * 32_768)
        : Math.round(normalized * 32_767);
      view.setInt16(44 + frame * blockAlign + channel * 2, integer, true);
    }
  }
  return bytes;
}

describe("TimelineAudioDecodeEngine", () => {
  it("decodes real interleaved PCM WAV samples into normalized channel buffers", () => {
    const engine = new TimelineAudioDecodeEngine(
      undefined,
      () => new Date("2026-07-25T23:30:00.000Z"),
    );
    const result = engine.decode({
      sourceArtifactId: "artifact-wave-1",
      sourceFingerprint: "sha256-wave-1",
      bytes: pcm16Wave({
        sampleRate: 48_000,
        channels: [
          [-1, -0.5, 0, 0.5, 1],
          [1, 0.5, 0, -0.5, -1],
        ],
      }),
      fileName: "loop.wav",
      decodedBy: "member-1",
    });

    expect(result.accepted).toBe(true);
    expect(result.audio).toMatchObject({
      sampleRate: 48_000,
      channelCount: 2,
      frameCount: 5,
      durationSeconds: 5 / 48_000,
    });
    expect([...result.audio!.channels[0]]).toEqual([
      -1, -0.5, 0, expect.closeTo(0.5, 4), expect.closeTo(1, 4),
    ]);
    expect([...result.audio!.channels[1]]).toEqual([
      expect.closeTo(1, 4), expect.closeTo(0.5, 4), 0, -0.5, -1,
    ]);
    expect(result.evidence).toMatchObject({
      id: "timeline-audio-decode-1",
      sourceArtifactId: "artifact-wave-1",
      sourceFormat: "wav",
      decoderId: "timeline-wave-pcm-v1",
      decodedAt: "2026-07-25T23:30:00.000Z",
    });
  });

  it("holds missing inputs and refuses content whose extension lies about its format", () => {
    const engine = new TimelineAudioDecodeEngine();
    const missing = engine.decode({
      sourceArtifactId: "",
      sourceFingerprint: "",
      bytes: new Uint8Array(),
      decodedBy: "member-1",
    });
    const mismatch = engine.decode({
      sourceArtifactId: "artifact-1",
      sourceFingerprint: "sha256-1",
      bytes: pcm16Wave({ sampleRate: 44_100, channels: [[0, 0]] }),
      fileName: "not-really.mp3",
      decodedBy: "member-1",
    });

    expect(missing.issues.map((issue) => issue.code)).toEqual([
      "source-required",
      "fingerprint-required",
      "bytes-required",
    ]);
    expect(mismatch.accepted).toBe(false);
    expect(mismatch.issues[0].code).toBe("container-invalid");
    expect(engine.history()).toEqual([]);
  });

  it("rejects truncated containers and unsupported WAV codecs without evidence", () => {
    const engine = new TimelineAudioDecodeEngine();
    const truncated = pcm16Wave({
      sampleRate: 48_000,
      channels: [[0, 0.25, 0.5, 0.75]],
    }).subarray(0, 46);
    const unsupported = pcm16Wave({
      sampleRate: 48_000,
      channels: [[0, 0]],
    });
    new DataView(
      unsupported.buffer,
      unsupported.byteOffset,
      unsupported.byteLength,
    ).setUint16(20, 7, true);

    const first = engine.decode({
      sourceArtifactId: "artifact-truncated",
      sourceFingerprint: "sha256-truncated",
      bytes: truncated,
      decodedBy: "member-1",
    });
    const second = engine.decode({
      sourceArtifactId: "artifact-codec",
      sourceFingerprint: "sha256-codec",
      bytes: unsupported,
      decodedBy: "member-1",
    });

    expect(first.issues[0]).toMatchObject({ code: "container-invalid" });
    expect(second.issues[0]).toMatchObject({ code: "codec-unsupported" });
    expect(engine.history()).toHaveLength(0);
  });

  it("accepts an approved external codec adapter and validates its decoded output", () => {
    const mp3Decoder: TimelineAudioDecoder = {
      id: "licensed-mp3-decoder-v1",
      formats: ["mp3"],
      decode: () => ({
        sampleRate: 44_100,
        channelCount: 1,
        frameCount: 3,
        durationSeconds: 3 / 44_100,
        channels: [Float32Array.from([0, 0.25, -0.25])],
      }),
    };
    const engine = new TimelineAudioDecodeEngine([mp3Decoder]);
    const bytes = Uint8Array.from([
      "I".charCodeAt(0), "D".charCodeAt(0), "3".charCodeAt(0), 4, 0, 0,
    ]);
    const result = engine.decode({
      sourceArtifactId: "artifact-mp3",
      sourceFingerprint: "sha256-mp3",
      bytes,
      fileName: "recording.mp3",
      decodedBy: "member-1",
    });

    expect(result.accepted).toBe(true);
    expect(result.evidence?.decoderId).toBe("licensed-mp3-decoder-v1");
    expect([...result.audio!.channels[0]]).toEqual([0, 0.25, -0.25]);
    expect(engine.supportedFormats()).toEqual(["mp3"]);
  });

  it("restores compact decode evidence and continues stable IDs after restart", () => {
    const source = new TimelineAudioDecodeEngine();
    const bytes = pcm16Wave({ sampleRate: 48_000, channels: [[0, 0.5, 0]] });
    source.decode({
      sourceArtifactId: "artifact-1",
      sourceFingerprint: "sha256-1",
      bytes,
      decodedBy: "member-1",
    });
    const archive = source.exportArchive();
    const restarted = new TimelineAudioDecodeEngine();
    restarted.restoreArchive(archive);
    const next = restarted.decode({
      sourceArtifactId: "artifact-2",
      sourceFingerprint: "sha256-2",
      bytes,
      decodedBy: "member-2",
    });

    expect(archive.evidence).toHaveLength(1);
    expect(archive).not.toHaveProperty("audio");
    expect(restarted.history("artifact-1")).toEqual(archive.evidence);
    expect(next.evidence?.id).toBe("timeline-audio-decode-2");
    expect(() => restarted.restoreArchive({
      evidence: [archive.evidence[0], archive.evidence[0]],
    })).toThrow("Duplicate audio decode evidence ID");
  });
});
