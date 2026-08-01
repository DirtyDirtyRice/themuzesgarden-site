import { describe, expect, it } from "vitest";
import {
  InMemoryTimelineDawInterchangePackageStore,
} from "../../lib/timeline/TimelineDawInterchangePackageStore";
import { TimelineDawInterchangePackageService } from "../../lib/timeline/TimelineDawInterchangePackageService";
import { InMemoryTimelineDawRenderArtifactStore } from "../../lib/timeline/TimelineDawRenderArtifactStore";
import { TimelineDawRenderExecutionService } from "../../lib/timeline/TimelineDawRenderExecutionService";
import { TimelineDawRenderService } from "../../lib/timeline/TimelineDawRenderService";
import {
  InMemoryTimelineDawWorkspaceStore,
  TimelineDawWorkspaceService,
} from "../../lib/timeline/TimelineDawWorkspaceService";

async function setup() {
  const workspaceStore = new InMemoryTimelineDawWorkspaceStore();
  const opened = await new TimelineDawWorkspaceService(workspaceStore).execute({
    action: "open", projectId: "project-1", songId: "song-1",
    name: "Main", expectedWorkspaceRevision: 0,
  }, "owner-1");
  const prepared = await new TimelineDawRenderService(workspaceStore).execute({
    action: "prepare", sessionId: opened.session.id,
    expectedWorkspaceRevision: opened.workspaceRevision, name: "Mix",
    target: "mix", sourceIds: ["master"], startSample: 0, endSample: 4,
    sampleRate: 48_000, bitDepth: 24, channels: 1, format: "wav",
  }, "owner-1");
  const renderStore = new InMemoryTimelineDawRenderArtifactStore();
  const rendered = await new TimelineDawRenderExecutionService(
    workspaceStore, renderStore,
  ).execute({
    actorId: "owner-1", sessionId: opened.session.id, jobId: prepared.job.id,
    expectedWorkspaceRevision: prepared.workspaceRevision,
    channels: [new Float32Array([0, 0.5, -0.5, 0])],
    workerId: "pcm-worker", chunkFrames: 2,
  });
  const packages = new InMemoryTimelineDawInterchangePackageStore();
  packages.seed(rendered.artifact.uri, renderStore.read(rendered.artifact.uri)!);
  return { workspaceStore, opened, rendered, packages };
}

describe("TimelineDawInterchangePackageService", () => {
  it("verifies completed render bytes and persists a private delivered ZIP", async () => {
    const { workspaceStore, opened, rendered, packages } = await setup();
    const receipt = await new TimelineDawInterchangePackageService(
      workspaceStore, packages,
    ).execute({
      actorId: "owner-1", sessionId: opened.session.id,
      jobIds: [rendered.job.id], name: "Mixer handoff",
      destination: "External mixer",
      expectedWorkspaceRevision: rendered.workspaceRevision,
      workerId: "interchange-worker",
    });
    expect(receipt.package).toMatchObject({
      status: "delivered", deliveryReference: receipt.artifact.uri,
    });
    expect(receipt.deliveryUrl).toContain("delivery=signed");
    expect(packages.read(receipt.artifact.uri)?.subarray(0, 4)).toEqual(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    );
    const snapshot = await new TimelineDawInterchangePackageService(
      workspaceStore, packages,
    ).snapshot("owner-1", opened.session.id);
    expect(snapshot.packages).toHaveLength(1);
    await expect(new TimelineDawInterchangePackageService(
      workspaceStore, packages,
    ).createDeliveryUrl({
      actorId: "owner-1", sessionId: opened.session.id,
      packageId: receipt.package.id,
    })).resolves.toContain("delivery=signed");
  });

  it("rejects stale revisions, foreign owners, and changed render bytes", async () => {
    const { workspaceStore, opened, rendered, packages } = await setup();
    const service = new TimelineDawInterchangePackageService(workspaceStore, packages);
    const command = {
      actorId: "owner-1", sessionId: opened.session.id,
      jobIds: [rendered.job.id], name: "Handoff", destination: "Mixer",
      expectedWorkspaceRevision: rendered.workspaceRevision,
      workerId: "interchange-worker",
    };
    await expect(service.execute({ ...command, expectedWorkspaceRevision: 0 }))
      .rejects.toThrow(/revision conflict/i);
    await expect(service.execute({ ...command, actorId: "other" }))
      .rejects.toThrow(/session owner/i);
    packages.seed(rendered.artifact.uri, new Uint8Array([1, 2, 3]));
    await expect(service.execute(command)).rejects.toThrow(/fingerprint verification/i);
  });
});
