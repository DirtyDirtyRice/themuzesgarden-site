import { describe, expect, it } from "vitest";

import {
  TIMELINE_SAMPLE_EVENTS,
  TIMELINE_WORKSPACE,
} from "../../lib/timeline/TimelineSeed";
import { TimelineHistoryEngine } from "../../lib/timeline/TimelineHistoryEngine";

describe("TimelineHistoryEngine", () => {
  it("records field changes in a verifiable append-only chain", () => {
    const engine = new TimelineHistoryEngine();
    const before = TIMELINE_SAMPLE_EVENTS[0];
    const after = { ...before, title: "New Start", status: "approved" as const };

    const record = engine.recordEventChange(
      "update",
      before,
      after,
      "member-1",
      "default-project",
      "Approved the renamed marker"
    );

    expect(record.changes.map((change) => change.path)).toEqual(
      expect.arrayContaining(["status", "title"])
    );
    expect(engine.verifyIntegrity()).toBe(true);
    expect(engine.getEntityTimeline(before.id)).toHaveLength(1);
  });

  it("creates useful undo and redo plans with before and after values", () => {
    const engine = new TimelineHistoryEngine();
    const event = TIMELINE_SAMPLE_EVENTS[1];
    const changed = { ...event, title: "Edited Verse" };
    engine.recordEventChange("update", event, changed, "member-1", "default-project");

    expect(engine.undo().value).toEqual(event);
    expect(engine.getSnapshot().redoCount).toBe(1);
    expect(engine.redo().value).toEqual(changed);
    expect(engine.getSnapshot().recordCount).toBe(1);
  });

  it("restores isolated workspace checkpoints", () => {
    const engine = new TimelineHistoryEngine();
    engine.createCheckpoint(
      "before-edit",
      "Before edit",
      TIMELINE_WORKSPACE,
      "member-1"
    );

    const restored = engine.restoreCheckpoint("before-edit");
    restored.projectId = "changed-copy";

    expect(engine.restoreCheckpoint("before-edit").projectId).toBe(
      "default-project"
    );
    expect(engine.getSnapshot().integrityValid).toBe(true);
  });
});
