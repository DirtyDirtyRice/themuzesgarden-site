import { describe, expect, it } from "vitest";
import {
  encodeTimelineDawPcmWav,
  TimelineDawPcmCaptureBuffer,
} from "../../lib/timeline/TimelineDawPcmCapture";

describe("TimelineDawPcmCapture", () => {
  it("joins immutable PCM blocks into a valid 24-bit WAV", () => {
    const capture = new TimelineDawPcmCaptureBuffer(48_000, 2, 10);
    const left = new Float32Array([-1, -0.5]);
    capture.append([left, new Float32Array([1, 0.5])]);
    left[0] = 0;
    capture.append([
      new Float32Array([0, 0.5, 1]),
      new Float32Array([0, -0.5, -1]),
    ]);
    const wav = capture.finalize();
    expect(wav).toMatchObject({
      sampleRate: 48_000,
      channelCount: 2,
      frameCount: 5,
      bitDepth: 24,
    });
    expect(new TextDecoder().decode(wav.bytes.subarray(0, 4))).toBe("RIFF");
    expect(new TextDecoder().decode(wav.bytes.subarray(8, 12))).toBe("WAVE");
    const view = new DataView(wav.bytes.buffer);
    expect(view.getUint16(22, true)).toBe(2);
    expect(view.getUint32(24, true)).toBe(48_000);
    expect(view.getUint16(34, true)).toBe(24);
    expect(view.getUint32(40, true)).toBe(30);
  });

  it("rejects channel changes, mismatched blocks, empty output, and capture overflow", () => {
    const capture = new TimelineDawPcmCaptureBuffer(44_100, 1, 2);
    expect(() => capture.finalize()).toThrow(/no audio/i);
    expect(() => capture.append([
      new Float32Array([1]),
      new Float32Array([1]),
    ])).toThrow(/channel count/i);
    expect(() => new TimelineDawPcmCaptureBuffer(44_100, 2).append([
      new Float32Array([1]),
      new Float32Array([1, 2]),
    ])).toThrow(/frames/i);
    capture.append([new Float32Array([1, 2])]);
    expect(() => capture.append([new Float32Array([3])])).toThrow(/frame limit/i);
  });

  it("clamps out-of-range samples before encoding", () => {
    const wav = encodeTimelineDawPcmWav(
      [new Float32Array([-2, 2])],
      48_000,
    );
    expect(Array.from(wav.bytes.subarray(44, 50))).toEqual([
      0, 0, 128,
      255, 255, 127,
    ]);
  });
});
