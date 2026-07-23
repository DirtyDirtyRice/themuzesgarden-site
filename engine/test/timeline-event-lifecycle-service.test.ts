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
    expect(stored.schemaVersion).toBe(3);
    expect(stored.evidence).toHaveLength(2);
  });

  it("persists AI workflow intake in holding and permanent evidence", async () => {
    const filePath = await lifecycleFile();
    const service = new TimelineEventLifecycleService(filePath);
    const result = await service.intakeAIProposal({
      proposal: {
        id: "ai-create-proposal-1",
        executionId: "ai-execution-1",
        projectId: TIMELINE_WORKSPACE.projectId,
        kind: "create-event",
        targetId: null,
        payload: {
          type: "note",
          trackId: TIMELINE_WORKSPACE.tracks[0].id,
          title: "Persistent AI suggestion",
          content: "Held for a human activation decision.",
        },
        status: "held",
        reasons: [],
        createdAt: "2026-07-23T00:00:00.000Z",
      },
      workspace: TIMELINE_WORKSPACE,
      reviewedBy: "member-1",
      model: "test-model",
      provider: "test-provider",
    });
    const restarted = new TimelineEventLifecycleService(filePath);
    const snapshot = await restarted.snapshot(TIMELINE_WORKSPACE.projectId);

    expect(result.acceptedForReview).toBe(true);
    expect(snapshot.heldCount).toBe(1);
    expect(snapshot.drafts[0].event).toMatchObject({
      source: "ai",
      aiGenerated: true,
      aiModel: "test-model",
    });
    expect(snapshot.evidence[0]).toMatchObject({
      action: "ai-intake",
      outcome: "validated",
    });
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
    expect(stored.schemaVersion).toBe(3);
    expect(stored.drafts).toHaveLength(1);
    expect(stored.evidence).toEqual([]);
  });
  it("persists dependencies and atomically activates prerequisite drafts first", async () => {
    const filePath = await lifecycleFile();
    const service = new TimelineEventLifecycleService(filePath);
    const required = await service.createDraft({
      workspace: TIMELINE_WORKSPACE,
      createdBy: "member-1",
      patch: { title: "Required event", content: "Ready prerequisite" },
    });
    const dependent = await service.createDraft({
      workspace: TIMELINE_WORKSPACE,
      createdBy: "member-1",
      patch: { title: "Dependent event", content: "Ready dependent" },
    });
    await service.validateDraft({
      draftId: required.id,
      workspace: TIMELINE_WORKSPACE,
      validatedBy: "member-1",
    });
    await service.validateDraft({
      draftId: dependent.id,
      workspace: TIMELINE_WORKSPACE,
      validatedBy: "member-1",
    });
    await service.addDependency({
      projectId: TIMELINE_WORKSPACE.projectId,
      dependentEventId: dependent.event.id,
      requiredEventId: required.event.id,
      createdBy: "member-1",
    });

    const restarted = new TimelineEventLifecycleService(filePath);
    const before = await restarted.snapshot(TIMELINE_WORKSPACE.projectId);
    const plan = await restarted.planDependencies({
      workspace: TIMELINE_WORKSPACE,
      draftIds: [dependent.id],
    });
    const activation = await restarted.activateDraft({
      draftId: dependent.id,
      workspace: TIMELINE_WORKSPACE,
      activatedBy: "member-1",
    });
    const after = await restarted.snapshot(TIMELINE_WORKSPACE.projectId);

    expect(before.dependencies).toHaveLength(1);
    expect(plan.ready).toBe(true);
    expect(plan.activationOrder).toEqual([required.id, dependent.id]);
    expect(activation.accepted).toBe(true);
    expect(
      activation.workspace.events.slice(-2).map((event) => event.id),
    ).toEqual([required.event.id, dependent.event.id]);
    expect(after.heldCount).toBe(0);
    expect(after.successfulActivationCount).toBe(2);
  });

  it("prevents direct activation when a persistent requirement is missing", async () => {
    const filePath = await lifecycleFile();
    const service = new TimelineEventLifecycleService(filePath);
    const draft = await service.createDraft({
      workspace: TIMELINE_WORKSPACE,
      createdBy: "member-1",
      patch: { title: "Blocked dependent", content: "Otherwise complete" },
    });
    await service.validateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      validatedBy: "member-1",
    });
    await service.addDependency({
      projectId: TIMELINE_WORKSPACE.projectId,
      dependentEventId: draft.event.id,
      requiredEventId: "event-that-does-not-exist",
      createdBy: "member-1",
    });

    const activation = await service.activateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      activatedBy: "member-1",
    });
    const snapshot = await service.snapshot(TIMELINE_WORKSPACE.projectId);

    expect(activation.accepted).toBe(false);
    expect(activation.workspace).toEqual(TIMELINE_WORKSPACE);
    expect(activation.issues[0]?.message).toContain("neither live nor held");
    expect(snapshot.heldCount).toBe(1);
    expect(snapshot.evidence[0]).toMatchObject({
      action: "dependency-activation",
      outcome: "prevented",
    });
  });
});
