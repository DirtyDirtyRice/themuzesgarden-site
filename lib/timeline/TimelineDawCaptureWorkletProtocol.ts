export type TimelineDawCaptureWorkletMessage = {
  type: "pcm";
  channels: ArrayBuffer[];
};

export function parseTimelineDawCaptureWorkletMessage(
  value: unknown,
  expectedChannels: number,
): Float32Array[] {
  if (!Number.isInteger(expectedChannels) || expectedChannels < 1 || expectedChannels > 32) {
    throw new Error("Expected capture channel count is invalid.");
  }
  if (!value || typeof value !== "object") throw new Error("Capture worklet message is invalid.");
  const message = value as Partial<TimelineDawCaptureWorkletMessage>;
  if (message.type !== "pcm" || !Array.isArray(message.channels) || message.channels.length !== expectedChannels) {
    throw new Error("Capture worklet channel count changed.");
  }
  const buffers = message.channels;
  if (buffers.some((buffer) => !(buffer instanceof ArrayBuffer) || !buffer.byteLength || buffer.byteLength % 4 !== 0)) {
    throw new Error("Capture worklet PCM buffers are invalid.");
  }
  const frameCount = buffers[0].byteLength / 4;
  if (buffers.some((buffer) => buffer.byteLength / 4 !== frameCount)) {
    throw new Error("Capture worklet channel frame counts changed.");
  }
  return buffers.map((buffer) => new Float32Array(buffer));
}
