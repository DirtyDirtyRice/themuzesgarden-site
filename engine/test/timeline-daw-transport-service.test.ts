import { describe, expect, it } from "vitest";
import {
  InMemoryTimelineDawWorkspaceStore,
  TimelineDawWorkspaceConflictError,
  TimelineDawWorkspaceService,
} from "../../lib/timeline/TimelineDawWorkspaceService";
import { TimelineDawTransportService } from "../../lib/timeline/TimelineDawTransportService";

async function setup() {
  const store = new InMemoryTimelineDawWorkspaceStore();
  const workspace = new TimelineDawWorkspaceService(store);
  const opened = await workspace.execute({
    action: "open",
    projectId: "project-1",
    songId: "song-1",
    name: "Main",
    expectedWorkspaceRevision: 0,
  }, "owner-1");
  const activated = await workspace.execute({
    action: "activate",
    sessionId: opened.session.id,
    expectedSessionRevision: opened.session.revision,
    expectedWorkspaceRevision: opened.workspaceRevision,
  }, "owner-1");
  return { store, activated };
}

describe("TimelineDawTransportService", () => {
  it("persists transport operations and receipts inside the workspace archive", async () => {
    const { store, activated } = await setup();
    const service = new TimelineDawTransportService(store);
    const initialized = await service.execute({
      action: "initialize",
      sessionId: activated.session.id,
      expectedWorkspaceRevision: activated.workspaceRevision,
    }, "owner-1");
    expect(initialized.transport).toMatchObject({ status: "active", playbackState: "stopped" });
    const played = await service.execute({
      action: "play",
      sessionId: activated.session.id,
      expectedTransportHead: initialized.transport!.head,
      expectedWorkspaceRevision: initialized.workspaceRevision,
    }, "owner-1");
    expect(played.transport?.playbackState).toBe("playing");
    const restored = await new TimelineDawTransportService(store).snapshot("owner-1", activated.session.id);
    expect(restored.transport).toEqual(played.transport);
    expect(restored.events.at(-1)?.action).toBe("played");
  });

  it("rejects stale workspace and transport revisions", async () => {
    const { store, activated } = await setup();
    const service = new TimelineDawTransportService(store);
    const initialized = await service.execute({
      action: "initialize",
      sessionId: activated.session.id,
      expectedWorkspaceRevision: activated.workspaceRevision,
    }, "owner-1");
    await expect(service.execute({
      action: "play",
      sessionId: activated.session.id,
      expectedTransportHead: initialized.transport!.head,
      expectedWorkspaceRevision: activated.workspaceRevision,
    }, "owner-1")).rejects.toBeInstanceOf(TimelineDawWorkspaceConflictError);
    await expect(service.execute({
      action: "play",
      sessionId: activated.session.id,
      expectedTransportHead: initialized.transport!.head - 1,
      expectedWorkspaceRevision: initialized.workspaceRevision,
    }, "owner-1")).rejects.toThrow(/head conflict/i);
  });

  it("keeps transport access owner-scoped", async () => {
    const { store, activated } = await setup();
    await expect(new TimelineDawTransportService(store).snapshot(
      "other-user",
      activated.session.id,
    )).rejects.toThrow(/session owner/i);
  });
});
