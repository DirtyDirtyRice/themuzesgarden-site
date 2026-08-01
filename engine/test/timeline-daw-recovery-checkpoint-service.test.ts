import { describe, expect, it } from "vitest";
import {
  InMemoryTimelineDawRecoveryCheckpointStore,
} from "../../lib/timeline/TimelineDawRecoveryCheckpointStore";
import { TimelineDawRecoveryCheckpointService } from "../../lib/timeline/TimelineDawRecoveryCheckpointService";
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
  const checkpointStore = new InMemoryTimelineDawRecoveryCheckpointStore();
  const service = new TimelineDawRecoveryCheckpointService(
    workspaceStore, checkpointStore,
    (() => {
      let second = 0;
      return () => new Date(`2026-08-01T00:00:0${second++}.000Z`);
    })(),
  );
  return { workspaceStore, opened, checkpointStore, service };
}

describe("TimelineDawRecoveryCheckpointService", () => {
  it("captures, verifies, and restores a durable workspace without losing its catalog", async () => {
    const { workspaceStore, opened, service } = await setup();
    const captured = await service.capture({
      actorId: "owner-1", sessionId: opened.session.id,
      label: "Before mix changes",
      expectedWorkspaceRevision: opened.workspaceRevision,
    });
    const prepared = await new TimelineDawRenderService(workspaceStore).execute({
      action: "prepare", sessionId: opened.session.id,
      expectedWorkspaceRevision: captured.workspaceRevision, name: "Temporary Mix",
      target: "mix", sourceIds: ["master"], startSample: 0, endSample: 4,
      sampleRate: 48_000, bitDepth: 24, channels: 1, format: "wav",
    }, "owner-1");
    expect((await new TimelineDawRenderService(workspaceStore)
      .snapshot("owner-1", opened.session.id)).jobs).toHaveLength(1);
    const restored = await service.restore({
      actorId: "owner-1", sessionId: opened.session.id,
      checkpointId: captured.checkpoint.id,
      expectedWorkspaceRevision: prepared.workspaceRevision,
    });
    expect(restored.checkpoint.lastRestoredBy).toBe("owner-1");
    expect((await new TimelineDawRenderService(workspaceStore)
      .snapshot("owner-1", opened.session.id)).jobs).toHaveLength(0);
    const snapshot = await service.snapshot("owner-1", opened.session.id);
    expect(snapshot.checkpoints[0]).toMatchObject({
      id: captured.checkpoint.id,
      lastRestoredAt: "2026-08-01T00:00:02.000Z",
    });
  });

  it("rejects stale revisions, foreign owners, and corrupted checkpoint bytes", async () => {
    const { opened, checkpointStore, service } = await setup();
    await expect(service.capture({
      actorId: "owner-1", sessionId: opened.session.id,
      label: "Stale", expectedWorkspaceRevision: 0,
    })).rejects.toThrow(/revision conflict/i);
    await expect(service.capture({
      actorId: "other", sessionId: opened.session.id,
      label: "Foreign", expectedWorkspaceRevision: opened.workspaceRevision,
    })).rejects.toThrow(/session owner/i);
    const captured = await service.capture({
      actorId: "owner-1", sessionId: opened.session.id,
      label: "Valid", expectedWorkspaceRevision: opened.workspaceRevision,
    });
    checkpointStore.replace(captured.checkpoint.uri, new Uint8Array([1, 2, 3]));
    await expect(service.restore({
      actorId: "owner-1", sessionId: opened.session.id,
      checkpointId: captured.checkpoint.id,
      expectedWorkspaceRevision: captured.workspaceRevision,
    })).rejects.toThrow(/integrity verification/i);
  });
});
