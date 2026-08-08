import { describe, expect, it } from "vitest";
import { TimelineDawTakeCompRenderer } from "../../lib/timeline/TimelineDawTakeCompRenderer";

function source(takeId: string, samples: number[], sampleRate = 1_000, channelCount = 1) {
  const channels = Array.from({ length: channelCount }, () => new Float32Array(samples));
  return { takeId, channels, sampleRate, channelCount, frameCount: samples.length, durationSeconds: samples.length / sampleRate };
}

describe("TimelineDawTakeCompRenderer", () => {
  it("cuts sample-accurate regions and applies a bounded equal-power crossfade", () => {
    const sources = new Map([
      ["take-a", source("take-a", [0, 1, 1, 1, 1, 0])],
      ["take-b", source("take-b", [0, -1, -1, -1, -1, 0])],
    ]);
    const rendered = new TimelineDawTakeCompRenderer().render([
      { takeId: "take-a", startSeconds: 0.001, endSeconds: 0.005 },
      { takeId: "take-b", startSeconds: 0.001, endSeconds: 0.005 },
    ], sources, 2);
    expect(rendered.frameCount).toBe(6);
    expect(rendered.crossfadeFrames).toEqual([2]);
    expect([...rendered.channels[0]]).toEqual([1, 1, 1, -1, -1, -1]);
  });

  it("rejects unavailable, out-of-range, and incompatible source audio", () => {
    const renderer = new TimelineDawTakeCompRenderer();
    const regions = [
      { takeId: "take-a", startSeconds: 0, endSeconds: 0.002 },
      { takeId: "take-b", startSeconds: 0, endSeconds: 0.002 },
    ];
    expect(() => renderer.render(regions, new Map([
      ["take-a", source("take-a", [0, 0])],
    ]))).toThrow(/unavailable/);
    expect(() => renderer.render(regions, new Map([
      ["take-a", source("take-a", [0])],
      ["take-b", source("take-b", [0, 0])],
    ]))).toThrow(/outside/);
    expect(() => renderer.render(regions, new Map([
      ["take-a", source("take-a", [0, 0])],
      ["take-b", source("take-b", [0, 0, 0, 0], 2_000)],
    ]))).toThrow(/sample rate/);
  });
});
