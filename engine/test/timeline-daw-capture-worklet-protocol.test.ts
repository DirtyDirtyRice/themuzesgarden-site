import { describe, expect, it } from "vitest";
import { parseTimelineDawCaptureWorkletMessage } from "../../lib/timeline/TimelineDawCaptureWorkletProtocol";

describe("TimelineDawCaptureWorkletProtocol", () => {
  it("accepts transferred PCM channels with matching frame counts", () => {
    const left = new Float32Array([0.25, -0.5]);
    const right = new Float32Array([0.75, 0]);
    const channels = parseTimelineDawCaptureWorkletMessage(
      { type: "pcm", channels: [left.buffer, right.buffer] },
      2,
    );
    expect(Array.from(channels[0])).toEqual([0.25, -0.5]);
    expect(Array.from(channels[1])).toEqual([0.75, 0]);
  });

  it("rejects malformed, mismatched, and empty messages", () => {
    expect(() => parseTimelineDawCaptureWorkletMessage(null, 2)).toThrow(/invalid/);
    expect(() => parseTimelineDawCaptureWorkletMessage({ type: "pcm", channels: [] }, 2)).toThrow(/channel count/);
    expect(() => parseTimelineDawCaptureWorkletMessage(
      { type: "pcm", channels: [new ArrayBuffer(8), new ArrayBuffer(4)] },
      2,
    )).toThrow(/frame counts/);
  });
});
