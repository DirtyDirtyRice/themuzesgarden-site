import { describe, expect, it } from "vitest";
import { TimelineActionEngine } from "../../lib/timeline/TimelineActionEngine";
import type { TimelineAIProposal } from "../../lib/timeline/TimelineAIEngine";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";

function proposal(
  overrides: Partial<TimelineAIProposal> = {}
): TimelineAIProposal {
  return {
    id: "proposal-1",
    executionId: "execution-1",
    projectId: TIMELINE_WORKSPACE.projectId,
    kind: "update-event",
    targetId: TIMELINE_WORKSPACE.events[0].id,
    payload: { title: "AI-reviewed title" },
    status: "held",
    reasons: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("TimelineActionEngine", () => {
  it("previews validated changes without mutating the live workspace", () => {
    const engine = new TimelineActionEngine();
    const originalTitle = TIMELINE_WORKSPACE.events[0].title;
    const plan = engine.preview({
      workspace: TIMELINE_WORKSPACE,
      proposals: [proposal()],
      createdBy: "member",
    });

    expect(plan.status).toBe("ready");
    expect(plan.previewWorkspace?.events[0].title).toBe("AI-reviewed title");
    expect(TIMELINE_WORKSPACE.events[0].title).toBe(originalTitle);
    expect(plan.changes.some((change) => change.field === "title")).toBe(true);
  });

  it("blocks protected fields, missing targets, and cross-project proposals", () => {
    const engine = new TimelineActionEngine();
    const protectedPlan = engine.preview({
      workspace: TIMELINE_WORKSPACE,
      proposals: [proposal({ payload: { id: "replacement-id" } })],
      createdBy: "member",
    });
    const missingPlan = engine.preview({
      workspace: TIMELINE_WORKSPACE,
      proposals: [proposal({ id: "proposal-2", targetId: "missing" })],
      createdBy: "member",
    });
    const foreignPlan = engine.preview({
      workspace: TIMELINE_WORKSPACE,
      proposals: [proposal({ id: "proposal-3", projectId: "other-project" })],
      createdBy: "member",
    });

    expect(protectedPlan.issues[0].code).toBe("protected-field");
    expect(missingPlan.issues[0].code).toBe("missing-target");
    expect(foreignPlan.issues[0].code).toBe("wrong-project");
  });

  it("requires every proposal to be validated and applies a batch atomically", () => {
    const engine = new TimelineActionEngine();
    const held = proposal();
    const plan = engine.preview({
      workspace: TIMELINE_WORKSPACE,
      proposals: [held],
      createdBy: "member",
    });

    expect(() =>
      engine.apply({
        planId: plan.id,
        workspace: TIMELINE_WORKSPACE,
        proposals: [held],
        appliedBy: "member",
      })
    ).toThrow("validated");

    const receipt = engine.apply({
      planId: plan.id,
      workspace: TIMELINE_WORKSPACE,
      proposals: [{ ...held, status: "validated" }],
      appliedBy: "member",
    });
    expect(receipt.status).toBe("applied");
    expect(receipt.afterWorkspace.events[0].title).toBe("AI-reviewed title");
    expect(receipt.afterWorkspace.history.at(-1)?.action).toBe(
      "apply-ai-action-plan"
    );
  });

  it("creates a reversible receipt and preserves the exact prior workspace", () => {
    const engine = new TimelineActionEngine();
    const validated = proposal({ status: "validated" });
    const plan = engine.preview({
      workspace: TIMELINE_WORKSPACE,
      proposals: [validated],
      createdBy: "member",
    });
    const receipt = engine.apply({
      planId: plan.id,
      workspace: TIMELINE_WORKSPACE,
      proposals: [validated],
      appliedBy: "member",
    });
    const reverted = engine.revert(receipt.id, "reviewer");

    expect(reverted.status).toBe("reverted");
    expect(reverted.beforeWorkspace.events[0].title).toBe(
      TIMELINE_WORKSPACE.events[0].title
    );
    expect(engine.getPlan(plan.id)?.status).toBe("reverted");
  });
});
