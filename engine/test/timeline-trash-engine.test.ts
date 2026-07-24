import { describe, expect, it } from "vitest";

import {
  permanentTimelineDeletionConfirmation,
  TimelineTrashEngine,
} from "../../lib/timeline/TimelineTrashEngine";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";

describe("TimelineTrashEngine", () => {
  it("soft-deletes an event and restores it to its original position", () => {
    const engine = new TimelineTrashEngine(
      () => new Date("2026-07-23T12:00:00.000Z"),
    );
    const original = structuredClone(TIMELINE_WORKSPACE);
    const event = original.events.find((candidate) => !candidate.locked)!;
    const originalIndex = original.events.findIndex(
      (candidate) => candidate.id === event.id,
    );
    const trashed = engine.trashEvent({
      workspace: original,
      eventId: event.id,
      trashedBy: "member-1",
      reason: "Clear the active arrangement",
    });
    const restored = engine.restoreEvent({
      workspace: trashed.workspace,
      trashId: trashed.record!.id,
      restoredBy: "member-1",
    });

    expect(trashed.accepted).toBe(true);
    expect(trashed.workspace.events.some((item) => item.id === event.id)).toBe(
      false,
    );
    expect(trashed.record).toMatchObject({
      eventId: event.id,
      originalIndex,
      state: "trashed",
    });
    expect(restored.accepted).toBe(true);
    expect(restored.workspace.events[originalIndex].id).toBe(event.id);
    expect(restored.record?.state).toBe("restored");
    expect(restored.record?.audit.map((entry) => entry.action)).toEqual([
      "trash",
      "restore",
    ]);
  });

  it("protects locked events and refuses restoration conflicts", () => {
    const engine = new TimelineTrashEngine();
    const workspace = structuredClone(TIMELINE_WORKSPACE);
    const locked = workspace.events[0];
    locked.locked = true;
    const refused = engine.trashEvent({
      workspace,
      eventId: locked.id,
      trashedBy: "member-1",
      reason: "Should be blocked",
    });
    locked.locked = false;
    const trashed = engine.trashEvent({
      workspace,
      eventId: locked.id,
      trashedBy: "member-1",
      reason: "Allowed after unlock",
    });
    const conflict = engine.restoreEvent({
      workspace,
      trashId: trashed.record!.id,
      restoredBy: "member-1",
    });

    expect(refused.accepted).toBe(false);
    expect(refused.issues[0].code).toBe("event-locked");
    expect(conflict.accepted).toBe(false);
    expect(conflict.issues[0].code).toBe("event-id-conflict");
  });

  it("requires exact confirmation before removing the recoverable payload", () => {
    const engine = new TimelineTrashEngine();
    const workspace = structuredClone(TIMELINE_WORKSPACE);
    const event = workspace.events.find((candidate) => !candidate.locked)!;
    const trashed = engine.trashEvent({
      workspace,
      eventId: event.id,
      trashedBy: "member-1",
      reason: "Remove experiment",
    });
    const refused = engine.purgeEvent({
      workspace: trashed.workspace,
      trashId: trashed.record!.id,
      purgedBy: "member-1",
      confirmation: "DELETE",
      reason: "Permanent cleanup",
    });
    const purged = engine.purgeEvent({
      workspace: trashed.workspace,
      trashId: trashed.record!.id,
      purgedBy: "member-1",
      confirmation: permanentTimelineDeletionConfirmation(trashed.record!.id),
      reason: "Permanent cleanup",
    });

    expect(refused.accepted).toBe(false);
    expect(refused.issues[0].code).toBe("confirmation-required");
    expect(purged.accepted).toBe(true);
    expect(purged.record?.state).toBe("purged");
    expect(purged.record?.event).toBeUndefined();
    expect(
      engine.restoreEvent({
        workspace: purged.workspace,
        trashId: purged.record!.id,
        restoredBy: "member-1",
      }).accepted,
    ).toBe(false);
  });

  it("restores persisted Trash records and retention evidence", () => {
    const now = new Date("2026-07-23T12:00:00.000Z");
    const engine = new TimelineTrashEngine(() => now);
    const workspace = structuredClone(TIMELINE_WORKSPACE);
    const event = workspace.events.find((candidate) => !candidate.locked)!;
    const trashed = engine.trashEvent({
      workspace,
      eventId: event.id,
      trashedBy: "member-1",
      reason: "Persist this Trash record",
      retentionDays: 7,
    });
    const restarted = new TimelineTrashEngine(() => now);
    restarted.restoreRecords(engine.exportRecords());
    const snapshot = restarted.snapshot(workspace.projectId);

    expect(snapshot.trashedCount).toBe(1);
    expect(snapshot.records[0]).toEqual(trashed.record);
    expect(snapshot.records[0].retentionUntil).toBe("2026-07-30T12:00:00.000Z");
  });
});
