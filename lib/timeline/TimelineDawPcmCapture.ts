export type TimelineDawCapturedWav = {
  bytes: Uint8Array;
  sampleRate: number;
  channelCount: number;
  frameCount: number;
  durationSeconds: number;
  bitDepth: 24;
};

export type TimelineDawCapturedPcm = Omit<TimelineDawCapturedWav, "bytes" | "bitDepth"> & {
  channels: Float32Array[];
};

export type TimelineDawBoundedAppendResult = {
  frameCount: number;
  appendedFrames: number;
  limitReached: boolean;
};

const MAX_CAPTURE_FRAMES = 48_000 * 60 * 30;

export class TimelineDawPcmCaptureBuffer {
  private readonly chunks: Float32Array[][] = [];
  private frames = 0;

  constructor(
    readonly sampleRate: number,
    readonly channelCount: number,
    readonly maximumFrames = MAX_CAPTURE_FRAMES,
  ) {
    if (!Number.isInteger(sampleRate) || sampleRate < 8_000 || sampleRate > 384_000) {
      throw new Error("Capture sample rate is invalid.");
    }
    if (!Number.isInteger(channelCount) || channelCount < 1 || channelCount > 32) {
      throw new Error("Capture channel count is invalid.");
    }
    if (!Number.isInteger(maximumFrames) || maximumFrames < 1) {
      throw new Error("Capture frame limit is invalid.");
    }
  }

  append(channels: Float32Array[]): number {
    const blockFrames = channels[0]?.length ?? 0;
    if (this.frames + blockFrames > this.maximumFrames) {
      throw new Error("Capture exceeded its frame limit.");
    }
    const result = this.appendBounded(channels);
    return result.frameCount;
  }

  appendBounded(channels: Float32Array[]): TimelineDawBoundedAppendResult {
    if (channels.length !== this.channelCount) {
      throw new Error("Capture block channel count changed.");
    }
    const blockFrames = channels[0]?.length ?? 0;
    if (!blockFrames || channels.some((channel) => channel.length !== blockFrames)) {
      throw new Error("Capture block frames are invalid.");
    }
    const appendedFrames = Math.min(blockFrames, Math.max(0, this.maximumFrames - this.frames));
    if (appendedFrames) {
      this.chunks.push(channels.map((channel) => channel.slice(0, appendedFrames)));
      this.frames += appendedFrames;
    }
    return { frameCount: this.frames, appendedFrames, limitReached: this.frames >= this.maximumFrames };
  }

  get frameCount(): number {
    return this.frames;
  }

  finalize(): TimelineDawCapturedWav {
    const pcm = this.finalizePcm();
    return encodeTimelineDawPcmWav(pcm.channels, pcm.sampleRate);
  }

  finalizePcm(): TimelineDawCapturedPcm {
    if (!this.frames) throw new Error("Capture contains no audio frames.");
    const channels = Array.from(
      { length: this.channelCount },
      () => new Float32Array(this.frames),
    );
    let offset = 0;
    for (const block of this.chunks) {
      for (let channel = 0; channel < this.channelCount; channel += 1) {
        channels[channel].set(block[channel], offset);
      }
      offset += block[0].length;
    }
    return {
      channels,
      sampleRate: this.sampleRate,
      channelCount: this.channelCount,
      frameCount: this.frames,
      durationSeconds: this.frames / this.sampleRate,
    };
  }
}

export function encodeTimelineDawPcmWav(
  channels: Float32Array[],
  sampleRate: number,
): TimelineDawCapturedWav {
  if (!channels.length || channels.length > 32) throw new Error("WAV channel count is invalid.");
  if (!Number.isInteger(sampleRate) || sampleRate < 8_000 || sampleRate > 384_000) {
    throw new Error("WAV sample rate is invalid.");
  }
  const frameCount = channels[0].length;
  if (!frameCount || channels.some((channel) => channel.length !== frameCount)) {
    throw new Error("WAV channels must contain the same non-zero frame count.");
  }
  const channelCount = channels.length;
  const bytesPerSample = 3;
  const dataLength = frameCount * channelCount * bytesPerSample;
  const bytes = new Uint8Array(44 + dataLength);
  const view = new DataView(bytes.buffer);
  writeAscii(bytes, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(bytes, 8, "WAVE");
  writeAscii(bytes, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, 24, true);
  writeAscii(bytes, 36, "data");
  view.setUint32(40, dataLength, true);
  let cursor = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel][frame]));
      const value = sample < 0
        ? Math.round(sample * 0x800000)
        : Math.round(sample * 0x7fffff);
      bytes[cursor] = value & 0xff;
      bytes[cursor + 1] = (value >> 8) & 0xff;
      bytes[cursor + 2] = (value >> 16) & 0xff;
      cursor += 3;
    }
  }
  return {
    bytes,
    sampleRate,
    channelCount,
    frameCount,
    durationSeconds: frameCount / sampleRate,
    bitDepth: 24,
  };
}

function writeAscii(bytes: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    bytes[offset + index] = value.charCodeAt(index);
  }
}
