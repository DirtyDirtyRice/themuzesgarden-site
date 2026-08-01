import { describe, expect, it } from "vitest";
import { encodeTimelineDawMp3 } from "../../lib/timeline/TimelineDawMp3Encoder";

describe("timeline DAW MP3 encoder", () => {
  it("encodes PCM to a non-empty MP3 frame stream", () => {
    const frames = 44_100;
    const left = new Float32Array(frames);
    const right = new Float32Array(frames);
    for (let index = 0; index < frames; index += 1) {
      left[index] = Math.sin((index / 44_100) * Math.PI * 2 * 440) * 0.25;
      right[index] = left[index];
    }
    const bytes = encodeTimelineDawMp3([left, right], 44_100);
    expect(bytes.length).toBeGreaterThan(1_000);
    expect(bytes.some((byte, index) => byte === 0xff && (bytes[index + 1] & 0xe0) === 0xe0)).toBe(true);
  });

  it("rejects unsupported channel counts and invalid PCM", () => {
    expect(() => encodeTimelineDawMp3([], 44_100)).toThrow(/mono or stereo/);
    expect(() => encodeTimelineDawMp3([new Float32Array(0)], 44_100)).toThrow(/non-zero/);
    expect(() => encodeTimelineDawMp3([new Float32Array(10)], 1_000)).toThrow(/sample rate/);
  });
});
