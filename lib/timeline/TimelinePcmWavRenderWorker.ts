import { createHash } from "node:crypto";
import type { TimelineOfflineRenderJob } from "./TimelineOfflineRenderAndExportEngine";

export type TimelinePcmWavRenderProgress = {
  jobId: string;
  workerId: string;
  renderedFrames: number;
  totalFrames: number;
  percent: number;
};

export type TimelinePcmWavRenderResult = {
  jobId: string;
  workerId: string;
  bytes: Uint8Array;
  byteLength: number;
  frameCount: number;
  sampleRate: number;
  channelCount: number;
  bitDepth: 16 | 24 | 32;
  audioFormat: "pcm-integer" | "ieee-float";
  mimeType: "audio/wav";
  checksum: string;
};

export type TimelinePcmWavRenderInput = {
  job: TimelineOfflineRenderJob;
  channels: Float32Array[];
  workerId: string;
  chunkFrames?: number;
  onProgress?: (progress: TimelinePcmWavRenderProgress) => void;
};

const RIFF_HEADER_BYTES = 44;
const MAX_RIFF_CHUNK_BYTES = 0xffff_ffff;

function writeAscii(bytes: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    bytes[offset + index] = value.charCodeAt(index);
  }
}

function integerSample(value: number, bitDepth: 16 | 24): number {
  const sample = Math.max(-1, Math.min(1, value));
  if (bitDepth === 16) {
    return sample <= -1 ? -32_768 : Math.round(sample * 32_767);
  }
  return sample <= -1 ? -8_388_608 : Math.round(sample * 8_388_607);
}

function writeSample(
  view: DataView,
  offset: number,
  value: number,
  bitDepth: 16 | 24 | 32,
): void {
  if (!Number.isFinite(value) || value < -1 || value > 1) {
    throw new Error("PCM WAV source samples must be finite values from -1 to 1.");
  }
  if (bitDepth === 16) {
    view.setInt16(offset, integerSample(value, bitDepth), true);
    return;
  }
  if (bitDepth === 24) {
    const sample = integerSample(value, bitDepth);
    view.setUint8(offset, sample & 0xff);
    view.setUint8(offset + 1, (sample >> 8) & 0xff);
    view.setUint8(offset + 2, (sample >> 16) & 0xff);
    return;
  }
  view.setFloat32(offset, value, true);
}

function validate(input: TimelinePcmWavRenderInput): {
  frameCount: number;
  bytesPerSample: number;
  blockAlign: number;
  dataBytes: number;
  chunkFrames: number;
} {
  const { job, channels } = input;
  if (!input.workerId.trim()) throw new Error("PCM WAV worker identity is required.");
  if (job.format !== "wav") throw new Error("PCM WAV worker accepts only WAV render jobs.");
  if (job.state !== "queued") throw new Error("PCM WAV worker accepts only queued render jobs.");
  if (job.bitDepth !== 16 && job.bitDepth !== 24 && job.bitDepth !== 32) {
    throw new Error("PCM WAV bit depth must be 16, 24, or 32.");
  }
  if (!Number.isInteger(job.sampleRate) || job.sampleRate < 8_000 || job.sampleRate > 384_000) {
    throw new Error("PCM WAV sample rate is invalid.");
  }
  if (!Number.isInteger(job.channels) || job.channels < 1 || job.channels > 64) {
    throw new Error("PCM WAV channel count is invalid.");
  }
  const frameCount = job.totalFrames;
  if (!Number.isSafeInteger(frameCount) || frameCount <= 0) {
    throw new Error("PCM WAV frame count must be a positive safe integer.");
  }
  if (channels.length !== job.channels) {
    throw new Error("PCM WAV source channel count does not match the render job.");
  }
  if (channels.some((channel) => !(channel instanceof Float32Array) || channel.length !== frameCount)) {
    throw new Error("PCM WAV source channels must contain exactly the requested frame count.");
  }
  const bytesPerSample = job.bitDepth / 8;
  const blockAlign = job.channels * bytesPerSample;
  const dataBytes = frameCount * blockAlign;
  if (!Number.isSafeInteger(dataBytes) || dataBytes + 36 > MAX_RIFF_CHUNK_BYTES) {
    throw new Error("PCM WAV output exceeds the RIFF container size limit.");
  }
  const chunkFrames = input.chunkFrames ?? 16_384;
  if (!Number.isSafeInteger(chunkFrames) || chunkFrames <= 0) {
    throw new Error("PCM WAV progress chunk size must be a positive safe integer.");
  }
  return { frameCount, bytesPerSample, blockAlign, dataBytes, chunkFrames };
}

export class TimelinePcmWavRenderWorker {
  render(input: TimelinePcmWavRenderInput): TimelinePcmWavRenderResult {
    const { job, channels } = input;
    const { frameCount, bytesPerSample, blockAlign, dataBytes, chunkFrames } = validate(input);
    const bytes = new Uint8Array(RIFF_HEADER_BYTES + dataBytes);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const audioFormat = job.bitDepth === 32 ? 3 : 1;

    writeAscii(bytes, 0, "RIFF");
    view.setUint32(4, bytes.length - 8, true);
    writeAscii(bytes, 8, "WAVE");
    writeAscii(bytes, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, audioFormat, true);
    view.setUint16(22, job.channels, true);
    view.setUint32(24, job.sampleRate, true);
    view.setUint32(28, job.sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, job.bitDepth, true);
    writeAscii(bytes, 36, "data");
    view.setUint32(40, dataBytes, true);

    for (let chunkStart = 0; chunkStart < frameCount; chunkStart += chunkFrames) {
      const chunkEnd = Math.min(frameCount, chunkStart + chunkFrames);
      for (let frame = chunkStart; frame < chunkEnd; frame += 1) {
        const frameOffset = RIFF_HEADER_BYTES + frame * blockAlign;
        for (let channel = 0; channel < job.channels; channel += 1) {
          writeSample(
            view,
            frameOffset + channel * bytesPerSample,
            channels[channel][frame],
            job.bitDepth,
          );
        }
      }
      input.onProgress?.({
        jobId: job.id,
        workerId: input.workerId,
        renderedFrames: chunkEnd,
        totalFrames: frameCount,
        percent: (chunkEnd / frameCount) * 100,
      });
    }

    return {
      jobId: job.id,
      workerId: input.workerId,
      bytes,
      byteLength: bytes.length,
      frameCount,
      sampleRate: job.sampleRate,
      channelCount: job.channels,
      bitDepth: job.bitDepth,
      audioFormat: audioFormat === 3 ? "ieee-float" : "pcm-integer",
      mimeType: "audio/wav",
      checksum: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    };
  }
}
