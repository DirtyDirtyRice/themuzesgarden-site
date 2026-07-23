import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { TimelineEventLifecycleService } from "../../lib/timeline/TimelineEventLifecycleService";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";

const folders: string[] = [];

async function lifecycleFile(): Promise<string> {
  const folder = await mkdtemp(join(tmpdir(), "timeline-lifecycle-"));
  folders.push(folder);
  return join(folder, "event-lifecycle.json");
}

afterEach(async () => {
  await Promise.all(
    folders
      .splice(0)
      .map((folder) => rm(folder, { recursive: true, force: true })),
  );
});

describe("TimelineEventLifecycleService", () => {
  it("persists validation and activation evidence across service restarts", async () => {
    const filePath = await lifecycleFile();
    const service = new TimelineEventLifecycleService(filePath);
    const draft = await service.createDraft({
      workspace: TIMELINE_WORKSPACE,
      createdBy: "member-1",
      patch: {
        title: "Restart-safe evidence",
        content: "Complete content",
      },
    });
    await service.validateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      validatedBy: "member-1",
    });
    const activation = await service.activateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      activatedBy: "member-1",
    });

    const restarted = new TimelineEventLifecycleService(filePath);
    const snapshot = await restarted.snapshot(TIMELINE_WORKSPACE.projectId);
    const stored = JSON.parse(await readFile(filePath, "utf8"));

    expect(activation.accepted).toBe(true);
    expect(snapshot.heldCount).toBe(0);
    expect(snapshot.evidence.map((record) => record.outcome)).toEqual([
      "activated",
      "validated",
    ]);
    expect(snapshot.successfulActivationCount).toBe(1);
    expect(stored.schemaVersion).toBe(2);
    expect(stored.evidence).toHaveLength(2);
  });

  it("opens and upgrades the earlier draft-only lifecycle file", async () => {
    const filePath = await lifecycleFile();
    await writeFile(
      filePath,
      JSON.stringify({
        schemaVersion: 1,
        savedAt: "2026-07-23T00:00:00.000Z",
        drafts: [],
      }),
      "utf8",
    );
    const service = new TimelineEventLifecycleService(filePath);
    const before = await service.snapshot(TIMELINE_WORKSPACE.projectId);
    await service.createDraft({
      workspace: TIMELINE_WORKSPACE,
      createdBy: "member-1",
      patch: { title: "Upgrade test" },
    });
    const stored = JSON.parse(await readFile(filePath, "utf8"));

    expect(before.evidence).toEqual([]);
    expect(stored.schemaVersion).toBe(2);
    expect(stored.drafts).toHaveLength(1);
    expect(stored.evidence).toEqual([]);
  });
});
