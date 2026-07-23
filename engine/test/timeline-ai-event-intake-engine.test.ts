import { describe, expect, it } from "vitest";

import type { TimelineAIProposal } from "../../lib/timeline/TimelineAIEngine";
import { TimelineAIEventIntakeEngine } from "../../lib/timeline/TimelineAIEventIntakeEngine";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";

function proposal(
  payload: Record<string, unknown>,
  overrides: Partial<TimelineAIProposal> = {},
): TimelineAIProposal {
  return {
    id: "ai-proposal-create-1",
    executionId: "ai-execution-1",
    projectId: TIMELINE_WORKSPACE.projectId,
    kind: "create-event",
    targetId: null,
    payload,
    status: "held",
    reasons: [],
    createdAt: "2026-07-23T00:00:00.000Z",
    ...overrides,
  };
}

describe("TimelineAIEventIntakeEngine", () => {
  it("holds an AI-invented event type and records the runtime validation failure", () => {
    const engine = new TimelineAIEventIntakeEngine();
    const result = engine.intake({
      proposal: proposal({
        type: "imaginary-song-thought",
        trackId: TIMELINE_WORKSPACE.tracks[0].id,
        title: "AI invention",
        content: "This must not become live.",
      }),
      workspace: TIMELINE_WORKSPACE,
      reviewedBy: "reviewer-1",
      model: "test-model",
      provider: "test-provider",
    });

    expect(result.handled).toBe(true);
    expect(result.acceptedForReview).toBe(false);
    expect(result.draft?.lifecycle).toBe("incomplete");
    expect(
      result.draft?.lastValidationReport?.detailedIssues.map(
        (issue) => issue.code,
      ),
    ).toContain("invalid-type");
    expect(result.draft?.event).toMatchObject({
      source: "ai",
      aiGenerated: true,
      aiModel: "test-model",
      aiProvider: "test-provider",
    });
    expect(TIMELINE_WORKSPACE.events).not.toContainEqual(result.draft?.event);
  });

  it("holds missing type, track, title, and content as explicit evidence", () => {
    const engine = new TimelineAIEventIntakeEngine();
    const result = engine.intake({
      proposal: proposal({}),
      workspace: TIMELINE_WORKSPACE,
      reviewedBy: "reviewer-1",
    });
    const codes = result.draft?.lastValidationReport?.detailedIssues.map(
      (issue) => issue.code,
    );

    expect(result.acceptedForReview).toBe(false);
    expect(codes).toEqual(
      expect.arrayContaining(["invalid-type", "required", "missing-payload"]),
    );
  });

  it("validates a complete AI event but does not activate it", () => {
    const engine = new TimelineAIEventIntakeEngine();
    const eventCount = TIMELINE_WORKSPACE.events.length;
    const result = engine.intake({
      proposal: proposal({
        type: "note",
        trackId: TIMELINE_WORKSPACE.tracks[0].id,
        title: "AI review note",
        content: "A complete suggestion awaiting a human decision.",
      }),
      workspace: TIMELINE_WORKSPACE,
      reviewedBy: "reviewer-1",
    });

    expect(result.acceptedForReview).toBe(true);
    expect(result.draft?.lifecycle).toBe("validated");
    expect(result.draft?.event.status).toBe("approved");
    expect(TIMELINE_WORKSPACE.events).toHaveLength(eventCount);
    expect(engine.getLifecycleEngine().getHoldingSnapshot().heldCount).toBe(1);
  });

  it("rejects forbidden AI payload fields before creating a draft", () => {
    const engine = new TimelineAIEventIntakeEngine();
    const result = engine.intake({
      proposal: proposal({
        type: "note",
        trackId: TIMELINE_WORKSPACE.tracks[0].id,
        title: "Unsafe request",
        content: "Attempted protected mutation",
        audit: { createdBy: "invented-admin" },
      }),
      workspace: TIMELINE_WORKSPACE,
      reviewedBy: "reviewer-1",
    });

    expect(result.acceptedForReview).toBe(false);
    expect(result.draft).toBeNull();
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "invalid-payload-field",
        field: "audit",
      }),
    ]);
    expect(engine.getLifecycleEngine().getHoldingSnapshot().heldCount).toBe(0);
  });
});
