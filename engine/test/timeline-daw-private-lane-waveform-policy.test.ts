import { describe, expect, it } from "vitest";
import { deriveTimelineDawPrivateLaneWaveform, projectTimelineDawPrivateLaneWaveform } from "../../lib/timeline/TimelineDawPrivateLaneWaveformPolicy";

describe("private lane waveform policy", () => {
  it("derives bounded multichannel absolute peaks", () => {
    const waveform = deriveTimelineDawPrivateLaneWaveform({
      channelCount: 2, frameCount: 8,
      channels: [new Float32Array([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]), new Float32Array([0, -0.8, 0, 0, 0, 0, 0, -1])],
    }, 32);
    expect(waveform).toEqual({ binCount: 8, frameCount: 8, peaks: [0, 0.8, 0.2, 0.3, 0.4, 0.5, 0.6, 1] });
  });

  it("projects only the arranged source window", () => {
    expect(projectTimelineDawPrivateLaneWaveform({ binCount: 8, frameCount: 8, peaks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7] }, 2, 6, 2))
      .toEqual([0.3, 0.5]);
  });

  it("rejects unsafe bin counts and source windows", () => {
    expect(() => deriveTimelineDawPrivateLaneWaveform({ channelCount: 1, frameCount: 1, channels: [new Float32Array([0])] }, 513)).toThrow(/32 to 512/);
    expect(() => projectTimelineDawPrivateLaneWaveform({ binCount: 1, frameCount: 1, peaks: [0] }, 1, 1)).toThrow(/source window/);
  });
});
