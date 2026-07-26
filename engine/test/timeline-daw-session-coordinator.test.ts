import { describe, expect, it } from "vitest";
import { TIMELINE_ENGINE_CATALOG } from "../../lib/timeline/TimelineEngineRegistry";
import { TimelineDawSessionCoordinator } from "../../lib/timeline/TimelineDawSessionCoordinator";

const input = { projectId: "project-1", songId: "song-1", ownerId: "user-1", name: "Song workspace" };

describe("TimelineDawSessionCoordinator", () => {
  it("runs one complete twelve-engine session lifecycle", () => {
    const coordinator = new TimelineDawSessionCoordinator();
    const opened = coordinator.open(input);
    expect(opened).toMatchObject({ state: "ready", revision: 0 });
    expect(opened.engineIds).toHaveLength(12);
    const active = coordinator.activate(opened.id, 0, "user-1");
    const suspended = coordinator.suspend(active.id, 1, "user-1");
    const resumed = coordinator.resume(suspended.id, 2, "user-1");
    const closed = coordinator.close(resumed.id, 3, "user-1");
    expect(closed).toMatchObject({ state: "closed", revision: 4 });
    expect(closed.closedAt).not.toBeNull();
    expect(coordinator.history(opened.id).map((event) => event.action)).toEqual([
      "opened", "activated", "suspended", "resumed", "closed",
    ]);
  });

  it("holds a session until missing engine health is restored", () => {
    const coordinator = new TimelineDawSessionCoordinator();
    const healthy = TIMELINE_ENGINE_CATALOG.map((engine) => engine.id).filter((id) => id !== "mixer-routing");
    const held = coordinator.open({ ...input, healthyEngineIds: healthy });
    expect(held.state).toBe("draft");
    expect(() => coordinator.activate(held.id, 0, "user-1")).toThrow("Only a ready DAW session");
    const validated = coordinator.validate(held.id, 0, "user-1");
    expect(validated).toMatchObject({ state: "ready", revision: 1 });
    expect(coordinator.activate(validated.id, 1, "user-1").state).toBe("active");
  });

  it("prevents duplicate workspaces and stale writes", () => {
    const coordinator = new TimelineDawSessionCoordinator();
    const opened = coordinator.open(input);
    expect(() => coordinator.open(input)).toThrow("already has an open DAW session");
    expect(() => coordinator.activate(opened.id, 9, "user-1")).toThrow("revision conflict");
  });

  it("round-trips a validated archive without losing history", () => {
    const coordinator = new TimelineDawSessionCoordinator();
    const opened = coordinator.open(input);
    coordinator.activate(opened.id, 0, "user-1");
    const restored = new TimelineDawSessionCoordinator();
    restored.restoreArchive(coordinator.exportArchive());
    expect(restored.get(opened.id)?.state).toBe("active");
    expect(restored.history(opened.id)).toHaveLength(2);
  });
});
