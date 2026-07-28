import { describe, expect, it } from "vitest";
import {
  InMemoryTimelineDawRenderArtifactStore,
  type TimelineDawRenderArtifactStore,
} from "../../lib/timeline/TimelineDawRenderArtifactStore";
import { TimelineDawRenderExecutionService } from "../../lib/timeline/TimelineDawRenderExecutionService";
import { TimelineDawRenderService } from "../../lib/timeline/TimelineDawRenderService";
import {
  InMemoryTimelineDawWorkspaceStore,
  TimelineDawWorkspaceService,
} from "../../lib/timeline/TimelineDawWorkspaceService";

async function setup() {
  const workspaceStore = new InMemoryTimelineDawWorkspaceStore();
  const workspace = new TimelineDawWorkspaceService(workspaceStore);
  const opened = await workspace.execute({
    action: "open",
    projectId: "project-1",
    songId: "song-1",
    name: "Main",
    expectedWorkspaceRevision: 0,
  }, "owner-1");
  const prepared = await new TimelineDawRenderService(workspaceStore).execute({
    action: "prepare",
    sessionId: opened.session.id,
    expectedWorkspaceRevision: opened.workspaceRevision,
    name: "Main Mix",
    target: "mix",
    sourceIds: ["master"],
    startSample: 0,
    endSample: 5,
    sampleRate: 48_000,
    bitDepth: 24,
    channels: 2,
    format: "wav",
  }, "owner-1");
  return { workspaceStore, opened, prepared };
}

describe("TimelineDawRenderExecutionService", () => {
  it("durably records PCM progress, completion, fingerprint, and delivery", async () => {
    const { workspaceStore, opened, prepared } = await setup();
    const artifactStore = new InMemoryTimelineDawRenderArtifactStore();
    const receipt = await new TimelineDawRenderExecutionService(
      workspaceStore,
      artifactStore,
    ).execute({
      actorId: "owner-1",
      sessionId: opened.session.id,
      jobId: prepared.job.id,
      expectedWorkspaceRevision: prepared.workspaceRevision,
      channels: [
        new Float32Array([-1, -0.5, 0, 0.5, 1]),
        new Float32Array([1, 0.5, 0, -0.5, -1]),
      ],
      workerId: "pcm-worker-1",
      chunkFrames: 2,
    });

    expect(receipt.job).toMatchObject({
      state: "completed",
      renderedFrames: 5,
      checksum: receipt.artifact.checksum,
      outputUri: receipt.artifact.uri,
    });
    expect(receipt.progress.map((event) => event.renderedFrames)).toEqual([2, 4, 5]);
    expect(receipt.deliveryUrl).toContain("delivery=signed");
    expect(artifactStore.read(receipt.artifact.uri)?.byteLength).toBe(receipt.artifact.byteLength);
    const restored = await new TimelineDawRenderService(workspaceStore)
      .snapshot("owner-1", opened.session.id);
    expect(restored.workspaceRevision).toBe(receipt.workspaceRevision);
    expect(restored.jobs[0]).toEqual(receipt.job);
  });

  it("rejects stale revisions and other owners before producing artifacts", async () => {
    const { workspaceStore, opened, prepared } = await setup();
    const artifacts = new InMemoryTimelineDawRenderArtifactStore();
    const service = new TimelineDawRenderExecutionService(workspaceStore, artifacts);
    const command = {
      actorId: "owner-1",
      sessionId: opened.session.id,
      jobId: prepared.job.id,
      expectedWorkspaceRevision: 0,
      channels: [new Float32Array(5), new Float32Array(5)],
      workerId: "pcm-worker-1",
    };
    await expect(service.execute(command)).rejects.toThrow(/revision conflict/i);
    await expect(service.execute({
      ...command,
      actorId: "other",
      expectedWorkspaceRevision: prepared.workspaceRevision,
    })).rejects.toThrow(/session owner/i);
  });

  it("persists a failed job when private artifact storage fails", async () => {
    const { workspaceStore, opened, prepared } = await setup();
    const failingStore: TimelineDawRenderArtifactStore = {
      save: async () => { throw new Error("Private artifact store unavailable."); },
      createDeliveryUrl: async () => { throw new Error("Unexpected delivery."); },
    };
    await expect(new TimelineDawRenderExecutionService(
      workspaceStore,
      failingStore,
    ).execute({
      actorId: "owner-1",
      sessionId: opened.session.id,
      jobId: prepared.job.id,
      expectedWorkspaceRevision: prepared.workspaceRevision,
      channels: [new Float32Array(5), new Float32Array(5)],
      workerId: "pcm-worker-1",
    })).rejects.toThrow(/artifact store unavailable/i);
    const restored = await new TimelineDawRenderService(workspaceStore)
      .snapshot("owner-1", opened.session.id);
    expect(restored.jobs[0].state).toBe("failed");
  });
});
