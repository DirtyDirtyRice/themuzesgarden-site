import { Mp3Encoder } from "@breezystack/lamejs";

const MP3_BLOCK_FRAMES = 1152;

export function encodeTimelineDawMp3(
  channels: Float32Array[],
  sampleRate: number,
  bitrateKbps = 192,
): Uint8Array {
  if (channels.length < 1 || channels.length > 2) throw new Error("MP3 encoding supports mono or stereo audio.");
  const frameCount = channels[0]?.length ?? 0;
  if (!frameCount || channels.some((channel) => channel.length !== frameCount)) {
    throw new Error("MP3 channels must contain the same non-zero frame count.");
  }
  if (!Number.isInteger(sampleRate) || sampleRate < 8_000 || sampleRate > 192_000) {
    throw new Error("MP3 sample rate is invalid.");
  }
  if (!Number.isInteger(bitrateKbps) || bitrateKbps < 32 || bitrateKbps > 320) {
    throw new Error("MP3 bitrate is invalid.");
  }
  const encoder = new Mp3Encoder(channels.length, sampleRate, bitrateKbps);
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  for (let offset = 0; offset < frameCount; offset += MP3_BLOCK_FRAMES) {
    const end = Math.min(frameCount, offset + MP3_BLOCK_FRAMES);
    const left = toPcm16(channels[0], offset, end);
    const right = channels[1] ? toPcm16(channels[1], offset, end) : undefined;
    const encoded = encoder.encodeBuffer(left, right);
    if (encoded.length) {
      chunks.push(encoded);
      byteLength += encoded.length;
    }
  }
  const finalChunk = encoder.flush();
  if (finalChunk.length) {
    chunks.push(finalChunk);
    byteLength += finalChunk.length;
  }
  const bytes = new Uint8Array(byteLength);
  let cursor = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, cursor);
    cursor += chunk.length;
  }
  return bytes;
}

function toPcm16(channel: Float32Array, start: number, end: number): Int16Array {
  const pcm = new Int16Array(end - start);
  for (let index = start; index < end; index += 1) {
    const sample = Math.max(-1, Math.min(1, channel[index]));
    pcm[index - start] = sample < 0
      ? Math.round(sample * 0x8000)
      : Math.round(sample * 0x7fff);
  }
  return pcm;
}
