import { describe, expect, it } from "vitest";
import {
  InMemoryTimelineDawWorkspaceStore,
  TimelineDawWorkspaceConflictError,
  TimelineDawWorkspaceService,
} from "../../lib/timeline/TimelineDawWorkspaceService";

describe("TimelineDawWorkspaceService", () => {
  it("persists a complete owner-scoped command lifecycle", async () => {
    const store = new InMemoryTimelineDawWorkspaceStore();
    const service = new TimelineDawWorkspaceService(store);
    const opened = await service.execute({
      action: "open", projectId: "project-1", songId: "song-1",
      name: "Working session", expectedWorkspaceRevision: 0,
    }, "owner-1");
    const active = await service.execute({
      action: "activate", sessionId: opened.session.id,
      expectedSessionRevision: 0, expectedWorkspaceRevision: 1,
    }, "owner-1");
    expect(active.session.state).toBe("active");
    expect((await service.get("owner-1", opened.session.id))?.revision).toBe(1);
    expect(await service.list("owner-1", "project-1")).toHaveLength(1);
  });

  it("rejects stale workspace commands before changing the archive", async () => {
    const service = new TimelineDawWorkspaceService(new InMemoryTimelineDawWorkspaceStore());
    await service.execute({
      action: "open", projectId: "project-1", songId: "song-1",
      name: "Working session", expectedWorkspaceRevision: 0,
    }, "owner-1");
    await expect(service.execute({
      action: "open", projectId: "project-1", songId: "song-2",
      name: "Stale command", expectedWorkspaceRevision: 0,
    }, "owner-1")).rejects.toBeInstanceOf(TimelineDawWorkspaceConflictError);
    expect(await service.list("owner-1")).toHaveLength(1);
  });

  it("serializes concurrent writes so only one expected revision succeeds", async () => {
    const service = new TimelineDawWorkspaceService(new InMemoryTimelineDawWorkspaceStore());
    const commands = ["song-1", "song-2"].map((songId) => service.execute({
      action: "open" as const, projectId: "project-1", songId,
      name: songId, expectedWorkspaceRevision: 0,
    }, "owner-1"));
    const results = await Promise.allSettled(commands);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("prevents another user from reading or changing an owner's session", async () => {
    const service = new TimelineDawWorkspaceService(new InMemoryTimelineDawWorkspaceStore());
    const opened = await service.execute({
      action: "open", projectId: "project-1", songId: "song-1",
      name: "Private session", expectedWorkspaceRevision: 0,
    }, "owner-1");
    await expect(service.get("other-user", opened.session.id)).rejects.toThrow("limited to its owner");
    await expect(service.execute({
      action: "activate", sessionId: opened.session.id,
      expectedSessionRevision: 0, expectedWorkspaceRevision: 1,
    }, "other-user")).rejects.toThrow("Only the DAW session owner");
  });
});
