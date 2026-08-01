import { describe, expect, it } from "vitest";
import { TimelineDawRenderService } from "../../lib/timeline/TimelineDawRenderService";
import {
  InMemoryTimelineDawRenderSourceStore,
} from "../../lib/timeline/TimelineDawRenderSourceStore";
import {
  InMemoryTimelineDawStemPackageStore,
} from "../../lib/timeline/TimelineDawStemPackageStore";
import { TimelineDawStemPackageService } from "../../lib/timeline/TimelineDawStemPackageService";
import {
  InMemoryTimelineDawWorkspaceStore,
  TimelineDawWorkspaceService,
} from "../../lib/timeline/TimelineDawWorkspaceService";
import { TimelinePcmWavRenderWorker } from "../../lib/timeline/TimelinePcmWavRenderWorker";
import type { TimelineOfflineRenderJob } from "../../lib/timeline/TimelineOfflineRenderAndExportEngine";

function wav(samples: number[]): Uint8Array {
  const job: TimelineOfflineRenderJob = {
    id: "fixture", projectId: "p", name: "fixture", target: "stem",
    sourceIds: ["fixture"], startSample: 0, endSample: samples.length,
    sampleRate: 48_000, bitDepth: 24, channels: 1, format: "wav",
    normalizePeakDb: null, dither: false, state: "queued", issues: [],
    renderedFrames: 0, totalFrames: samples.length, checksum: null,
    outputUri: null, head: 2, createdBy: "owner-1", updatedBy: "owner-1",
  };
  return new TimelinePcmWavRenderWorker().render({
    job, channels: [new Float32Array(samples)], workerId: "fixture",
  }).bytes;
}

async function setup() {
  const workspaceStore = new InMemoryTimelineDawWorkspaceStore();
  const opened = await new TimelineDawWorkspaceService(workspaceStore).execute({
    action: "open", projectId: "project-1", songId: "song-1",
    name: "Main", expectedWorkspaceRevision: 0,
  }, "owner-1");
  const sourceStore = new InMemoryTimelineDawRenderSourceStore();
  const one = await sourceStore.save({
    ownerId: "owner-1", sessionId: opened.session.id,
    name: "vocal.wav", bytes: wav([0, 0.5, 1, 0]),
  });
  const two = await sourceStore.save({
    ownerId: "owner-1", sessionId: opened.session.id,
    name: "drums.wav", bytes: wav([1, 0, -1, 0]),
  });
  const prepared = await new TimelineDawRenderService(workspaceStore).execute({
    action: "prepare", sessionId: opened.session.id,
    expectedWorkspaceRevision: opened.workspaceRevision, name: "Stems",
    target: "stem", sourceIds: [one.uri, two.uri], startSample: 0,
    endSample: 4, sampleRate: 48_000, bitDepth: 24, channels: 1,
    format: "wav",
  }, "owner-1");
  return { workspaceStore, opened, sourceStore, prepared };
}

describe("TimelineDawStemPackageService", () => {
  it("renders fingerprinted stems into a durable private ZIP package", async () => {
    const { workspaceStore, opened, sourceStore, prepared } = await setup();
    const packages = new InMemoryTimelineDawStemPackageStore();
    const receipt = await new TimelineDawStemPackageService(
      workspaceStore, sourceStore, packages,
    ).execute({
      actorId: "owner-1", sessionId: opened.session.id,
      jobId: prepared.job.id, expectedWorkspaceRevision: prepared.workspaceRevision,
      workerId: "stem-worker", chunkFrames: 2,
    });
    expect(receipt.job).toMatchObject({
      state: "completed", outputUri: receipt.artifact.uri,
      checksum: receipt.artifact.checksum, renderedFrames: 4,
    });
    expect(receipt.stems).toHaveLength(2);
    expect(receipt.stems.every((stem) => stem.checksum.startsWith("sha256:"))).toBe(true);
    expect(packages.read(receipt.artifact.uri)?.subarray(0, 4)).toEqual(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    );
    expect(receipt.deliveryUrl).toContain("delivery=signed");
  });
  it("rejects non-stem jobs and foreign owners", async () => {
    const { workspaceStore, opened, sourceStore, prepared } = await setup();
    const packages = new InMemoryTimelineDawStemPackageStore();
    const service = new TimelineDawStemPackageService(workspaceStore, sourceStore, packages);
    await expect(service.execute({
      actorId: "other", sessionId: opened.session.id, jobId: prepared.job.id,
      expectedWorkspaceRevision: prepared.workspaceRevision, workerId: "stem-worker",
    })).rejects.toThrow(/session owner/i);
  });
});
