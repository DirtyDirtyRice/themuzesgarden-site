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
    const paused = await service.execute({
      action: "pause",
      sessionId: activated.session.id,
      expectedTransportHead: played.transport!.head,
      expectedWorkspaceRevision: played.workspaceRevision,
      tick: 3_840,
    }, "owner-1");
    expect(paused.transport).toMatchObject({ playbackState: "paused", tick: 3_840 });
    expect(paused.events.slice(-2).map((event) => event.action)).toEqual(["located", "paused"]);
    const looped = await service.execute({
      action: "set-loop",
      sessionId: activated.session.id,
      expectedTransportHead: paused.transport!.head,
      expectedWorkspaceRevision: paused.workspaceRevision,
      enabled: true,
      startTick: 1_920,
      endTick: 5_760,
    }, "owner-1");
    expect(looped.transport?.loop).toEqual({ enabled: true, startTick: 1_920, endTick: 5_760 });
    expect(looped.events.at(-1)?.action).toBe("loop-updated");
    const counted = await service.execute({
      action: "set-count-in",
      sessionId: activated.session.id,
      expectedTransportHead: looped.transport!.head,
      expectedWorkspaceRevision: looped.workspaceRevision,
      bars: 1,
    }, "owner-1");
    expect(counted.transport?.countInBars).toBe(1);
    const countStarted = await service.execute({
      action: "play",
      sessionId: activated.session.id,
      expectedTransportHead: counted.transport!.head,
      expectedWorkspaceRevision: counted.workspaceRevision,
    }, "owner-1");
    expect(countStarted.transport?.playbackState).toBe("counting-in");
    const countCompleted = await service.execute({
      action: "complete-count-in",
      sessionId: activated.session.id,
      expectedTransportHead: countStarted.transport!.head,
      expectedWorkspaceRevision: countStarted.workspaceRevision,
    }, "owner-1");
    expect(countCompleted.transport).toMatchObject({
      playbackState: "playing",
      countInRemainingTicks: 0,
      tick: 3_840,
    });
    expect(countCompleted.events.at(-1)?.action).toBe("count-in-completed");
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
