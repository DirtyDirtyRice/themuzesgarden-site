import { describe, expect, it } from "vitest";

import { TimelineEventDependencyEngine } from "../../lib/timeline/TimelineEventDependencyEngine";
import { TimelineEventLifecycleEngine } from "../../lib/timeline/TimelineEventLifecycleEngine";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";
import type { TimelineWorkspace } from "../../lib/timeline/TimelineTypes";

function validatedDraft(
  lifecycle: TimelineEventLifecycleEngine,
  workspace: TimelineWorkspace,
  title: string,
  trackId = workspace.tracks[0].id,
) {
  const draft = lifecycle.createDraft({
    workspace,
    createdBy: "member-1",
    patch: {
      type: "note",
      trackId,
      title,
      content: `${title} is complete.`,
    },
  });
  const validation = lifecycle.validateDraft({
    draftId: draft.id,
    workspace,
    validatedBy: "member-1",
  });
  expect(validation.lifecycle).toBe("validated");
  return validation.draft!;
}

describe("TimelineEventDependencyEngine", () => {
  it("includes transitive held requirements and produces dependency-first order", () => {
    const lifecycle = new TimelineEventLifecycleEngine();
    const engine = new TimelineEventDependencyEngine();
    const first = validatedDraft(lifecycle, TIMELINE_WORKSPACE, "Foundation");
    const second = validatedDraft(lifecycle, TIMELINE_WORKSPACE, "Middle");
    const third = validatedDraft(lifecycle, TIMELINE_WORKSPACE, "Final piece");
    engine.addDependency({
      projectId: TIMELINE_WORKSPACE.projectId,
      dependentEventId: second.event.id,
      requiredEventId: first.event.id,
      createdBy: "member-1",
    });
    engine.addDependency({
      projectId: TIMELINE_WORKSPACE.projectId,
      dependentEventId: third.event.id,
      requiredEventId: second.event.id,
      createdBy: "member-1",
    });

    const plan = engine.plan({
      workspace: TIMELINE_WORKSPACE,
      drafts: lifecycle.exportDrafts(),
      draftIds: [third.id],
    });
    const activation = engine.activate({
      workspace: TIMELINE_WORKSPACE,
      lifecycle,
      draftIds: [third.id],
      activatedBy: "member-1",
    });

    expect(plan.ready).toBe(true);
    expect(plan.includedDraftIds).toEqual(
      expect.arrayContaining([first.id, second.id, third.id]),
    );
    expect(plan.activationOrder).toEqual([first.id, second.id, third.id]);
    expect(activation.accepted).toBe(true);
    expect(
      activation.workspace.events.slice(-3).map((event) => event.title),
    ).toEqual(["Foundation", "Middle", "Final piece"]);
  });

  it("blocks missing dependencies and dependency cycles", () => {
    const lifecycle = new TimelineEventLifecycleEngine();
    const missingEngine = new TimelineEventDependencyEngine();
    const draft = validatedDraft(lifecycle, TIMELINE_WORKSPACE, "Dependent");
    missingEngine.addDependency({
      projectId: TIMELINE_WORKSPACE.projectId,
      dependentEventId: draft.event.id,
      requiredEventId: "missing-required-event",
      createdBy: "member-1",
    });
    const missingPlan = missingEngine.plan({
      workspace: TIMELINE_WORKSPACE,
      drafts: lifecycle.exportDrafts(),
      draftIds: [draft.id],
    });

    const cycleLifecycle = new TimelineEventLifecycleEngine();
    const cycleEngine = new TimelineEventDependencyEngine();
    const left = validatedDraft(cycleLifecycle, TIMELINE_WORKSPACE, "Left");
    const right = validatedDraft(cycleLifecycle, TIMELINE_WORKSPACE, "Right");
    cycleEngine.addDependency({
      projectId: TIMELINE_WORKSPACE.projectId,
      dependentEventId: left.event.id,
      requiredEventId: right.event.id,
      createdBy: "member-1",
    });
    cycleEngine.addDependency({
      projectId: TIMELINE_WORKSPACE.projectId,
      dependentEventId: right.event.id,
      requiredEventId: left.event.id,
      createdBy: "member-1",
    });
    const cyclePlan = cycleEngine.plan({
      workspace: TIMELINE_WORKSPACE,
      drafts: cycleLifecycle.exportDrafts(),
      draftIds: [left.id],
    });

    expect(missingPlan.ready).toBe(false);
    expect(missingPlan.issues.map((issue) => issue.code)).toContain(
      "missing-dependency",
    );
    expect(cyclePlan.ready).toBe(false);
    expect(cyclePlan.issues.map((issue) => issue.code)).toContain(
      "dependency-cycle",
    );
  });

  it("rolls back the whole group when a later activation fails", () => {
    const workspace = structuredClone(TIMELINE_WORKSPACE);
    const lifecycle = new TimelineEventLifecycleEngine();
    const engine = new TimelineEventDependencyEngine();
    const first = validatedDraft(lifecycle, workspace, "Activates first");
    const lockedTrack = workspace.tracks[1];
    lockedTrack.locked = true;
    const second = validatedDraft(
      lifecycle,
      workspace,
      "Fails on locked track",
      lockedTrack.id,
    );
    engine.addDependency({
      projectId: workspace.projectId,
      dependentEventId: second.event.id,
      requiredEventId: first.event.id,
      createdBy: "member-1",
    });
    const eventCount = workspace.events.length;

    const activation = engine.activate({
      workspace,
      lifecycle,
      draftIds: [second.id],
      activatedBy: "member-1",
    });

    expect(activation.plan.ready).toBe(true);
    expect(activation.accepted).toBe(false);
    expect(activation.workspace.events).toHaveLength(eventCount);
    expect(activation.activatedDraftIds).toEqual([]);
    expect(lifecycle.getDraft(first.id)?.lifecycle).toBe("validated");
    expect(lifecycle.getDraft(second.id)?.lifecycle).toBe("validated");
    expect(activation.issues[0].code).toBe("activation-failed");
  });
  it("reports direct and transitive held-event impact from a live requirement", () => {
    const lifecycle = new TimelineEventLifecycleEngine();
    const engine = new TimelineEventDependencyEngine();
    const direct = validatedDraft(
      lifecycle,
      TIMELINE_WORKSPACE,
      "Direct dependent",
    );
    const transitive = validatedDraft(
      lifecycle,
      TIMELINE_WORKSPACE,
      "Transitive dependent",
    );
    const liveEventId = TIMELINE_WORKSPACE.events[0].id;
    engine.addDependency({
      projectId: TIMELINE_WORKSPACE.projectId,
      dependentEventId: direct.event.id,
      requiredEventId: liveEventId,
      createdBy: "member-1",
    });
    engine.addDependency({
      projectId: TIMELINE_WORKSPACE.projectId,
      dependentEventId: transitive.event.id,
      requiredEventId: direct.event.id,
      createdBy: "member-1",
    });

    const impact = engine.impact({
      projectId: TIMELINE_WORKSPACE.projectId,
      eventId: liveEventId,
      drafts: lifecycle.exportDrafts(),
    });
    const unrelated = engine.impact({
      projectId: TIMELINE_WORKSPACE.projectId,
      eventId: "unrelated-live-event",
      drafts: lifecycle.exportDrafts(),
    });

    expect(impact.safeToChange).toBe(false);
    expect(impact.affectedDraftIds).toEqual([direct.id, transitive.id]);
    expect(impact.paths.map((path) => path.distance)).toEqual([1, 2]);
    expect(impact.paths[1].path).toEqual([
      liveEventId,
      direct.event.id,
      transitive.event.id,
    ]);
    expect(unrelated.safeToChange).toBe(true);
    expect(unrelated.paths).toEqual([]);
  });
});
