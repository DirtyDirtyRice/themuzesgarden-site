import { describe, expect, it } from "vitest";
import {
  InMemoryTimelineDawRenderSourceStore,
} from "../../lib/timeline/TimelineDawRenderSourceStore";
import { TimelineDawRenderSourceMixer } from "../../lib/timeline/TimelineDawRenderSourceMixer";
import { TimelinePcmWavRenderWorker } from "../../lib/timeline/TimelinePcmWavRenderWorker";
import type { TimelineOfflineRenderJob } from "../../lib/timeline/TimelineOfflineRenderAndExportEngine";

function job(overrides: Partial<TimelineOfflineRenderJob> = {}): TimelineOfflineRenderJob {
  return {
    id: "job-1", projectId: "project-1", name: "Mix", target: "mix",
    sourceIds: [], startSample: 1, endSample: 4, sampleRate: 48_000,
    bitDepth: 24, channels: 1, format: "wav", normalizePeakDb: null,
    dither: false, state: "queued", issues: [], renderedFrames: 0,
    totalFrames: 3, checksum: null, outputUri: null, head: 2,
    createdBy: "owner-1", updatedBy: "owner-1", ...overrides,
  };
}

function wav(samples: number[]): Uint8Array {
  return new TimelinePcmWavRenderWorker().render({
    job: { ...job(), startSample: 0, endSample: samples.length, totalFrames: samples.length },
    channels: [new Float32Array(samples)],
    workerId: "fixture",
  }).bytes;
}

describe("TimelineDawRenderSourceMixer", () => {
  it("loads real WAV artifacts, selects the render range, and mixes sources", async () => {
    const store = new InMemoryTimelineDawRenderSourceStore();
    const first = await store.save({ ownerId: "owner-1", sessionId: "session-1", name: "one.wav", bytes: wav([0, 1, 0, -1, 0]) });
    const second = await store.save({ ownerId: "owner-1", sessionId: "session-1", name: "two.wav", bytes: wav([0, 0, 1, 0, 0]) });
    const channels = await new TimelineDawRenderSourceMixer(store).resolve(
      job({ sourceIds: [first.uri, second.uri] }),
      "owner-1",
    );
    expect(channels[0][0]).toBeCloseTo(0.5, 5);
    expect(channels[0][1]).toBeCloseTo(0.5, 5);
    expect(channels[0][2]).toBeCloseTo(-0.5, 5);
  });

  it("rejects foreign owners and incompatible source audio", async () => {
    const store = new InMemoryTimelineDawRenderSourceStore();
    const source = await store.save({ ownerId: "owner-1", sessionId: "session-1", name: "one.wav", bytes: wav([0, 0, 0, 0, 0]) });
    await expect(new TimelineDawRenderSourceMixer(store).resolve(
      job({ sourceIds: [source.uri] }),
      "other",
    )).rejects.toThrow(/owner/i);
    await expect(new TimelineDawRenderSourceMixer(store).resolve(
      job({ sourceIds: [source.uri], sampleRate: 44_100 }),
      "owner-1",
    )).rejects.toThrow(/sample rate/i);
  });

  it("applies the saved delivery peak ceiling before encoding", async () => {
    const store = new InMemoryTimelineDawRenderSourceStore();
    const source = await store.save({
      ownerId: "owner-1", sessionId: "session-1", name: "master.wav",
      bytes: wav([0, 0.25, -0.5, 0.25, 0]),
    });
    const channels = await new TimelineDawRenderSourceMixer(store).resolve(
      job({ sourceIds: [source.uri], normalizePeakDb: -6 }),
      "owner-1",
    );
    expect(Math.max(...Array.from(channels[0], Math.abs))).toBeCloseTo(10 ** (-6 / 20), 5);
  });
});
