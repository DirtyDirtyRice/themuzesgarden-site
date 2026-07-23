import { describe, expect, it } from "vitest";

import { TimelineEventLifecycleEngine } from "../../lib/timeline/TimelineEventLifecycleEngine";
import {
  TIMELINE_SAMPLE_EVENTS,
  TIMELINE_WORKSPACE,
} from "../../lib/timeline/TimelineSeed";

describe("TimelineEventLifecycleEngine", () => {
  it("keeps incomplete events out of the live workspace and records the prevented activation", () => {
    const engine = new TimelineEventLifecycleEngine();
    const draft = engine.createDraft({
      workspace: TIMELINE_WORKSPACE,
      createdBy: "member-1",
    });

    const validation = engine.validateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      validatedBy: "member-1",
    });
    const activation = engine.activateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      activatedBy: "member-1",
    });
    const holding = engine.getHoldingSnapshot(TIMELINE_WORKSPACE.projectId);

    expect(validation.accepted).toBe(false);
    expect(validation.lifecycle).toBe("incomplete");
    expect(
      validation.draft?.lastValidationReport?.detailedIssues.map(
        (issue) => issue.code,
      ),
    ).toEqual(expect.arrayContaining(["required", "missing-payload"]));
    expect(activation.accepted).toBe(false);
    expect(activation.issues[0]?.code).toBe("not-validated");
    expect(activation.workspace.events).toHaveLength(
      TIMELINE_WORKSPACE.events.length,
    );
    expect(holding.heldCount).toBe(1);
    expect(holding.validationAttemptCount).toBe(1);
    expect(holding.preventedActivationCount).toBe(2);
  });

  it("validates a completed draft before activating it in the workspace", () => {
    const engine = new TimelineEventLifecycleEngine();
    const draft = engine.createDraft({
      workspace: TIMELINE_WORKSPACE,
      createdBy: "member-1",
      patch: {
        type: "lyric",
        title: "New chorus",
        content: "A complete lyric line",
      },
    });

    const validation = engine.validateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      validatedBy: "reviewer-1",
    });
    const activation = engine.activateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      activatedBy: "reviewer-1",
    });

    expect(validation.accepted).toBe(true);
    expect(validation.lifecycle).toBe("validated");
    expect(activation.accepted).toBe(true);
    expect(activation.lifecycle).toBe("active");
    expect(activation.workspace.events).toHaveLength(
      TIMELINE_WORKSPACE.events.length + 1,
    );
    expect(activation.workspace.events.at(-1)).toMatchObject({
      type: "lyric",
      title: "New chorus",
      lyric: "A complete lyric line",
      status: "active",
    });
    expect(activation.workspace.statistics.totalEvents).toBe(
      activation.workspace.events.length,
    );
    expect(
      activation.draft?.transitions.map((transition) => transition.to),
    ).toEqual(["draft", "validated", "active"]);
    expect(engine.getHoldingSnapshot().heldCount).toBe(0);
  });

  it("returns a changed draft to validation before it can become active", () => {
    const engine = new TimelineEventLifecycleEngine();
    const draft = engine.createDraft({
      workspace: TIMELINE_WORKSPACE,
      createdBy: "member-1",
      patch: { title: "First note", content: "Ready" },
    });
    engine.validateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      validatedBy: "member-1",
    });

    const changed = engine.updateDraft(
      draft.id,
      { content: "Changed after validation" },
      "member-1",
    );
    const activation = engine.activateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      activatedBy: "member-1",
    });

    expect(changed?.lifecycle).toBe("draft");
    expect(activation.accepted).toBe(false);
    expect(activation.issues[0]?.code).toBe("not-validated");
  });

  it("refuses to overwrite a live event that changed after editing began", () => {
    const engine = new TimelineEventLifecycleEngine();
    const event = { ...TIMELINE_SAMPLE_EVENTS[0], relationships: [] };
    const workspace = {
      ...TIMELINE_WORKSPACE,
      events: [event],
      statistics: { ...TIMELINE_WORKSPACE.statistics, totalEvents: 1 },
    };
    const edit = engine.beginEdit({
      workspace,
      eventId: event.id,
      createdBy: "member-1",
    });
    const draftId = edit.draft?.id ?? "";
    engine.updateDraft(draftId, { title: "Edited title" }, "member-1");
    engine.validateDraft({
      draftId,
      workspace,
      validatedBy: "member-1",
    });
    const newerWorkspace = {
      ...workspace,
      events: [{ ...event, title: "Someone else's newer edit" }],
    };

    const activation = engine.activateDraft({
      draftId,
      workspace: newerWorkspace,
      activatedBy: "member-1",
    });

    expect(activation.accepted).toBe(false);
    expect(activation.issues[0]?.code).toBe("stale-edit");
    expect(activation.workspace.events[0]?.title).toBe(
      "Someone else's newer edit",
    );
  });
  it("replaces exactly one unchanged live event after safe edit validation", () => {
    const engine = new TimelineEventLifecycleEngine();
    const event = { ...TIMELINE_SAMPLE_EVENTS[0], relationships: [] };
    const workspace = {
      ...TIMELINE_WORKSPACE,
      events: [event],
      statistics: { ...TIMELINE_WORKSPACE.statistics, totalEvents: 1 },
    };
    const edit = engine.beginEdit({
      workspace,
      eventId: event.id,
      createdBy: "member-1",
    });
    const draftId = edit.draft?.id ?? "";
    engine.updateDraft(draftId, { title: "Safely replaced title" }, "member-1");
    const validation = engine.validateDraft({
      draftId,
      workspace,
      validatedBy: "member-1",
    });
    const activation = engine.activateDraft({
      draftId,
      workspace,
      activatedBy: "member-1",
    });

    expect(validation.lifecycle).toBe("validated");
    expect(activation.accepted).toBe(true);
    expect(activation.workspace.events).toHaveLength(1);
    expect(activation.workspace.events[0]).toMatchObject({
      id: event.id,
      title: "Safely replaced title",
      status: "active",
    });
    expect(activation.workspace.history.at(-1)?.action).toBe(
      "activate-event-edit",
    );
  });
  it("restores held drafts after a server restart", () => {
    const beforeRestart = new TimelineEventLifecycleEngine();
    const draft = beforeRestart.createDraft({
      workspace: TIMELINE_WORKSPACE,
      createdBy: "member-1",
      patch: { title: "Restart-safe note" },
    });
    beforeRestart.validateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      validatedBy: "member-1",
    });

    const afterRestart = new TimelineEventLifecycleEngine();
    afterRestart.restoreDrafts(beforeRestart.exportDrafts());
    const restored = afterRestart.getDraft(draft.id);
    const updated = afterRestart.updateDraft(
      draft.id,
      { content: "Completed after restart" },
      "member-1",
    );
    const validation = afterRestart.validateDraft({
      draftId: draft.id,
      workspace: TIMELINE_WORKSPACE,
      validatedBy: "member-1",
    });

    expect(restored?.lifecycle).toBe("incomplete");
    expect(restored?.validationAttempts).toHaveLength(1);
    expect(updated?.event.content).toBe("Completed after restart");
    expect(validation.lifecycle).toBe("validated");
  });
});
