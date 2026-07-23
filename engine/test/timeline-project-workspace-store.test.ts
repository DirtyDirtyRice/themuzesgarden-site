import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createEmptyTimelineWorkspace,
  TimelineProjectWorkspaceStore,
} from "../../lib/timeline/TimelineProjectWorkspaceStore";

describe("TimelineProjectWorkspaceStore", () => {
  it("creates a clean project-specific workspace instead of copying seed events", async () => {
    const directory = await mkdtemp(join(tmpdir(), "timeline-project-"));
    const store = new TimelineProjectWorkspaceStore(directory);
    const record = await store.ensure("project-1", "owner-1");

    expect(record.revision).toBe(1);
    expect(record.workspace.projectId).toBe("project-1");
    expect(record.workspace.events).toHaveLength(0);
    expect(record.workspace.tracks[0].title).toBe("Main Timeline");
  });

  it("persists valid updates with optimistic revision protection", async () => {
    const directory = await mkdtemp(join(tmpdir(), "timeline-project-save-"));
    const store = new TimelineProjectWorkspaceStore(directory);
    const first = await store.ensure("project-1", "owner-1");
    const workspace = structuredClone(first.workspace);
    workspace.tracks[0].title = "Song Development";
    const second = await store.save({
      workspace,
      expectedRevision: 1,
      updatedBy: "owner-1",
    });

    expect(second.revision).toBe(2);
    expect(second.previousHash).toBe(first.hash);
    await expect(
      store.save({ workspace, expectedRevision: 1, updatedBy: "owner-1" })
    ).rejects.toThrow("revision conflict");
  });

  it("keeps projects isolated even when their IDs contain path characters", async () => {
    const directory = await mkdtemp(join(tmpdir(), "timeline-project-isolation-"));
    const store = new TimelineProjectWorkspaceStore(directory);
    const first = await store.ensure("../project-one", "owner-1");
    const second = await store.ensure("project/two", "owner-2");

    expect(first.projectId).not.toBe(second.projectId);
    expect((await store.load("../project-one"))?.createdBy).toBe("owner-1");
    expect((await store.load("project/two"))?.createdBy).toBe("owner-2");
  });

  it("detects modified workspace files before returning their contents", async () => {
    const directory = await mkdtemp(join(tmpdir(), "timeline-project-tamper-"));
    const store = new TimelineProjectWorkspaceStore(directory);
    await store.ensure("project-1", "owner-1");
    const files = await import("node:fs/promises").then((fs) => fs.readdir(directory));
    const path = join(directory, files[0]);
    const document = JSON.parse(await readFile(path, "utf8"));
    document.workspace.tracks[0].title = "Tampered";
    await writeFile(path, JSON.stringify(document), "utf8");

    await expect(store.load("project-1")).rejects.toThrow("integrity");
  });

  it("builds an independently valid empty workspace", () => {
    const workspace = createEmptyTimelineWorkspace("project-standalone");
    expect(workspace.statistics.totalEvents).toBe(0);
    expect(workspace.clipboard.sourceTrackId).toBe(workspace.tracks[0].id);
  });
});
