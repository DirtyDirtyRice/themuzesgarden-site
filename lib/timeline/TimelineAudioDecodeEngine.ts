import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineAudioDecodeFormat =
  | "wav"
  | "mp3"
  | "flac"
  | "aiff"
  | "ogg"
  | "m4a";

export type TimelineDecodedAudioBuffer = {
  sampleRate: number;
  channelCount: number;
  frameCount: number;
  durationSeconds: number;
  channels: Float32Array[];
};

export type TimelineAudioDecodeEvidence = {
  id: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  sourceFormat: TimelineAudioDecodeFormat;
  decoderId: string;
  sampleRate: number;
  channelCount: number;
  frameCount: number;
  durationSeconds: number;
  decodedAt: string;
  decodedBy: TimelineUserId;
};

export type TimelineAudioDecodeIssue = {
  code:
    | "source-required"
    | "fingerprint-required"
    | "bytes-required"
    | "format-unknown"
    | "decoder-unavailable"
    | "container-invalid"
    | "codec-unsupported"
    | "audio-metadata-invalid"
    | "sample-data-invalid";
  message: string;
};

export type TimelineAudioDecodeResult = {
  accepted: boolean;
  audio: TimelineDecodedAudioBuffer | null;
  evidence: TimelineAudioDecodeEvidence | null;
  issues: TimelineAudioDecodeIssue[];
};

export type TimelineAudioDecodeArchive = {
  evidence: TimelineAudioDecodeEvidence[];
};

export interface TimelineAudioDecoder {
  readonly id: string;
  readonly formats: readonly TimelineAudioDecodeFormat[];
  decode(bytes: Uint8Array): TimelineDecodedAudioBuffer;
}

const textDecoder = new TextDecoder("ascii");
const clone = <T>(value: T): T => structuredClone(value);

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return textDecoder.decode(bytes.subarray(offset, offset + length));
}

function formatFromName(name: string): TimelineAudioDecodeFormat | null {
  const extension = name.trim().toLowerCase().split(".").at(-1);
  if (extension === "wave") return "wav";
  if (
    extension === "wav" ||
    extension === "mp3" ||
    extension === "flac" ||
    extension === "aiff" ||
    extension === "ogg" ||
    extension === "m4a"
  ) return extension;
  return null;
}

function sniffFormat(bytes: Uint8Array): TimelineAudioDecodeFormat | null {
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 4) === "WAVE"
  ) return "wav";
  if (
    bytes.length >= 4 &&
    ascii(bytes, 0, 4) === "fLaC"
  ) return "flac";
  if (
    bytes.length >= 12 &&
    ascii(bytes, 0, 4) === "FORM" &&
    ["AIFF", "AIFC"].includes(ascii(bytes, 8, 4))
  ) return "aiff";
  if (bytes.length >= 4 && ascii(bytes, 0, 4) === "OggS") return "ogg";
  if (
    bytes.length >= 3 &&
    (ascii(bytes, 0, 3) === "ID3" ||
      (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))
  ) return "mp3";
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === "ftyp") return "m4a";
  return null;
}

function clampSample(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Decoded sample data contains a non-finite value.");
  }
  return Math.max(-1, Math.min(1, value));
}

function readPcmSample(
  view: DataView,
  offset: number,
  audioFormat: number,
  bitsPerSample: number,
): number {
  if (audioFormat === 3) {
    if (bitsPerSample === 32) return clampSample(view.getFloat32(offset, true));
    if (bitsPerSample === 64) return clampSample(view.getFloat64(offset, true));
    throw new Error(`IEEE float WAV with ${bitsPerSample}-bit samples is unsupported.`);
  }
  if (audioFormat !== 1) {
    throw new Error(`WAV codec ${audioFormat} is unsupported.`);
  }
  if (bitsPerSample === 8) return (view.getUint8(offset) - 128) / 128;
  if (bitsPerSample === 16) return view.getInt16(offset, true) / 32_768;
  if (bitsPerSample === 24) {
    const unsigned =
      view.getUint8(offset) |
      (view.getUint8(offset + 1) << 8) |
      (view.getUint8(offset + 2) << 16);
    const signed = unsigned & 0x800000 ? unsigned | 0xff000000 : unsigned;
    return signed / 8_388_608;
  }
  if (bitsPerSample === 32) return view.getInt32(offset, true) / 2_147_483_648;
  throw new Error(`PCM WAV with ${bitsPerSample}-bit samples is unsupported.`);
}

class TimelineWaveDecoder implements TimelineAudioDecoder {
  readonly id = "timeline-wave-pcm-v1";
  readonly formats = ["wav"] as const;

  decode(bytes: Uint8Array): TimelineDecodedAudioBuffer {
    if (
      bytes.length < 44 ||
      ascii(bytes, 0, 4) !== "RIFF" ||
      ascii(bytes, 8, 4) !== "WAVE"
    ) {
      throw new Error("WAV container is missing its RIFF/WAVE header.");
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const declaredSize = view.getUint32(4, true) + 8;
    if (declaredSize > bytes.length) {
      throw new Error("WAV container is truncated.");
    }

    let audioFormat = 0;
    let channelCount = 0;
    let sampleRate = 0;
    let blockAlign = 0;
    let bitsPerSample = 0;
    let dataOffset = -1;
    let dataSize = 0;
    let cursor = 12;

    while (cursor + 8 <= Math.min(declaredSize, bytes.length)) {
      const chunkId = ascii(bytes, cursor, 4);
      const chunkSize = view.getUint32(cursor + 4, true);
      const chunkStart = cursor + 8;
      const chunkEnd = chunkStart + chunkSize;
      if (chunkEnd > bytes.length) throw new Error(`WAV ${chunkId} chunk is truncated.`);
      if (chunkId === "fmt ") {
        if (chunkSize < 16) throw new Error("WAV format chunk is incomplete.");
        audioFormat = view.getUint16(chunkStart, true);
        channelCount = view.getUint16(chunkStart + 2, true);
        sampleRate = view.getUint32(chunkStart + 4, true);
        blockAlign = view.getUint16(chunkStart + 12, true);
        bitsPerSample = view.getUint16(chunkStart + 14, true);
      } else if (chunkId === "data" && dataOffset < 0) {
        dataOffset = chunkStart;
        dataSize = chunkSize;
      }
      cursor = chunkEnd + (chunkSize % 2);
    }

    if (!audioFormat || dataOffset < 0) {
      throw new Error("WAV container requires format and data chunks.");
    }
    if (
      !Number.isInteger(sampleRate) ||
      sampleRate < 8_000 ||
      sampleRate > 384_000 ||
      !Number.isInteger(channelCount) ||
      channelCount < 1 ||
      channelCount > 64
    ) {
      throw new Error("WAV sample rate or channel count is outside supported bounds.");
    }
    const bytesPerSample = bitsPerSample / 8;
    if (
      !Number.isInteger(bytesPerSample) ||
      blockAlign !== channelCount * bytesPerSample ||
      dataSize % blockAlign !== 0
    ) {
      throw new Error("WAV sample layout does not match its format metadata.");
    }
    const frameCount = dataSize / blockAlign;
    const channels = Array.from(
      { length: channelCount },
      () => new Float32Array(frameCount),
    );
    for (let frame = 0; frame < frameCount; frame += 1) {
      const frameOffset = dataOffset + frame * blockAlign;
      for (let channel = 0; channel < channelCount; channel += 1) {
        channels[channel][frame] = readPcmSample(
          view,
          frameOffset + channel * bytesPerSample,
          audioFormat,
          bitsPerSample,
        );
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
}

function validateDecodedAudio(audio: TimelineDecodedAudioBuffer): void {
  if (
    !Number.isInteger(audio.sampleRate) ||
    audio.sampleRate < 8_000 ||
    audio.sampleRate > 384_000 ||
    !Number.isInteger(audio.channelCount) ||
    audio.channelCount < 1 ||
    audio.channelCount > 64 ||
    !Number.isInteger(audio.frameCount) ||
    audio.frameCount < 0 ||
    audio.channels.length !== audio.channelCount
  ) {
    throw new Error("Decoded audio metadata is invalid.");
  }
  for (const channel of audio.channels) {
    if (!(channel instanceof Float32Array) || channel.length !== audio.frameCount) {
      throw new Error("Decoded channel data does not match the audio metadata.");
    }
    for (const sample of channel) {
      if (!Number.isFinite(sample) || sample < -1 || sample > 1) {
        throw new Error("Decoded sample data is outside normalized bounds.");
      }
    }
  }
  const expectedDuration = audio.frameCount / audio.sampleRate;
  if (Math.abs(audio.durationSeconds - expectedDuration) > 1e-9) {
    throw new Error("Decoded duration does not match frame and sample-rate metadata.");
  }
}

export class TimelineAudioDecodeEngine {
  private readonly decoders = new Map<TimelineAudioDecodeFormat, TimelineAudioDecoder>();
  private readonly evidence = new Map<TimelineId, TimelineAudioDecodeEvidence>();
  private sequence = 0;

  constructor(
    decoders: TimelineAudioDecoder[] = [new TimelineWaveDecoder()],
    private readonly now: () => Date = () => new Date(),
  ) {
    for (const decoder of decoders) this.registerDecoder(decoder);
  }

  registerDecoder(decoder: TimelineAudioDecoder): void {
    if (!decoder.id.trim()) throw new Error("Audio decoder ID is required.");
    if (!decoder.formats.length) {
      throw new Error(`Audio decoder ${decoder.id} must declare at least one format.`);
    }
    for (const format of decoder.formats) {
      if (this.decoders.has(format)) {
        throw new Error(`Audio format ${format} already has a registered decoder.`);
      }
      this.decoders.set(format, decoder);
    }
  }

  decode(input: {
    sourceArtifactId: TimelineId;
    sourceFingerprint: string;
    bytes: Uint8Array;
    fileName?: string;
    decodedBy: TimelineUserId;
  }): TimelineAudioDecodeResult {
    const issues: TimelineAudioDecodeIssue[] = [];
    if (!input.sourceArtifactId.trim()) {
      issues.push({ code: "source-required", message: "Source artifact ID is required." });
    }
    if (!input.sourceFingerprint.trim()) {
      issues.push({ code: "fingerprint-required", message: "Source fingerprint is required." });
    }
    if (!(input.bytes instanceof Uint8Array) || input.bytes.length === 0) {
      issues.push({ code: "bytes-required", message: "Source audio bytes are required." });
    }
    if (issues.length) return { accepted: false, audio: null, evidence: null, issues };

    const sniffed = sniffFormat(input.bytes);
    const named = input.fileName ? formatFromName(input.fileName) : null;
    const format = sniffed ?? named;
    if (!format) {
      return this.failure("format-unknown", "Audio container format could not be identified.");
    }
    if (sniffed && named && sniffed !== named) {
      return this.failure(
        "container-invalid",
        `Audio content is ${sniffed}, but the file name declares ${named}.`,
      );
    }
    const decoder = this.decoders.get(format);
    if (!decoder) {
      return this.failure(
        "decoder-unavailable",
        `No approved ${format} decoder is registered.`,
      );
    }

    try {
      const audio = decoder.decode(input.bytes);
      validateDecodedAudio(audio);
      const evidence: TimelineAudioDecodeEvidence = {
        id: `timeline-audio-decode-${++this.sequence}`,
        sourceArtifactId: input.sourceArtifactId,
        sourceFingerprint: input.sourceFingerprint,
        sourceFormat: format,
        decoderId: decoder.id,
        sampleRate: audio.sampleRate,
        channelCount: audio.channelCount,
        frameCount: audio.frameCount,
        durationSeconds: audio.durationSeconds,
        decodedAt: this.now().toISOString(),
        decodedBy: input.decodedBy,
      };
      this.evidence.set(evidence.id, clone(evidence));
      return { accepted: true, audio, evidence: clone(evidence), issues: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Audio decode failed.";
      const code: TimelineAudioDecodeIssue["code"] =
        message.includes("codec") || message.includes("unsupported")
          ? "codec-unsupported"
          : message.includes("metadata") || message.includes("sample rate")
            ? "audio-metadata-invalid"
            : message.includes("sample data") || message.includes("channel data")
              ? "sample-data-invalid"
              : "container-invalid";
      return this.failure(code, message);
    }
  }

  getEvidence(id: TimelineId): TimelineAudioDecodeEvidence | null {
    const value = this.evidence.get(id);
    return value ? clone(value) : null;
  }

  history(sourceArtifactId?: TimelineId): TimelineAudioDecodeEvidence[] {
    return [...this.evidence.values()]
      .filter((value) => !sourceArtifactId || value.sourceArtifactId === sourceArtifactId)
      .map(clone);
  }

  supportedFormats(): TimelineAudioDecodeFormat[] {
    return [...this.decoders.keys()].sort();
  }

  exportArchive(): TimelineAudioDecodeArchive {
    return { evidence: this.history() };
  }

  restoreArchive(archive: TimelineAudioDecodeArchive): void {
    const next = new Map<TimelineId, TimelineAudioDecodeEvidence>();
    let sequence = 0;
    for (const value of archive.evidence) {
      if (next.has(value.id)) throw new Error(`Duplicate audio decode evidence ID ${value.id}.`);
      if (
        !this.decoders.has(value.sourceFormat) ||
        !value.sourceArtifactId.trim() ||
        !value.sourceFingerprint.trim() ||
        !Number.isInteger(value.frameCount) ||
        value.frameCount < 0
      ) {
        throw new Error(`Audio decode evidence ${value.id} is invalid.`);
      }
      next.set(value.id, clone(value));
      const match = /^timeline-audio-decode-(\d+)$/.exec(value.id);
      if (match) sequence = Math.max(sequence, Number(match[1]));
    }
    this.evidence.clear();
    for (const [id, value] of next) this.evidence.set(id, value);
    this.sequence = sequence;
  }

  private failure(
    code: TimelineAudioDecodeIssue["code"],
    message: string,
  ): TimelineAudioDecodeResult {
    return {
      accepted: false,
      audio: null,
      evidence: null,
      issues: [{ code, message }],
    };
  }
}
