import { describe, expect, it, vi } from "vitest";
import type { TimelineAITransport } from "../../lib/timeline/TimelineAIEngine";
import { TimelineOrchestrationEngine } from "../../lib/timeline/TimelineOrchestrationEngine";
import { TimelinePromptEngine } from "../../lib/timeline/TimelinePromptEngine";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";

function setup(response: Record<string, unknown>) {
  const prompts = new TimelinePromptEngine();
  prompts.saveTemplate({
    id: "orchestration-test",
    name: "Orchestration test",
    description: "Full workflow test",
    role: "user",
    content: "Review {{title}}\n{{timelineContext}}",
    requiredVariables: ["title", "timelineContext"],
    optionalVariables: [],
    tags: ["test"],
    createdBy: "member",
  });
  const transport: TimelineAITransport = vi.fn(async (request) => ({
    id: "provider-response",
    model: request.model,
    text: JSON.stringify(response),
    usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
  }));
  return new TimelineOrchestrationEngine(prompts, transport);
}

function start(engine: TimelineOrchestrationEngine) {
  return engine.start({
    templateId: "orchestration-test",
    workspace: TIMELINE_WORKSPACE,
    variables: { title: "Opening" },
    context: { maxEvents: 1 },
    model: "test-model",
    responseFormat: "json",
    createdBy: "member",
  });
}

describe("TimelineOrchestrationEngine", () => {
  it("runs prompt through held proposal and human review to atomic application", async () => {
    const engine = setup({
      answer: "A clearer title will help.",
      proposals: [
        {
          kind: "update-event",
          targetId: TIMELINE_WORKSPACE.events[0].id,
          payload: { title: "Clear Opening" },
        },
      ],
    });
    const workflow = start(engine);
    const review = await engine.execute(workflow.id);

    expect(review.workflow.status).toBe("awaiting-review");
    expect(review.proposals[0].status).toBe("held");
    expect(review.actionPlan?.status).toBe("ready");

    const approved = engine.approve(workflow.id, "reviewer");
    expect(approved.workflow.status).toBe("ready-to-apply");
    const applied = engine.apply(
      workflow.id,
      TIMELINE_WORKSPACE,
      "reviewer"
    );
    expect(applied.workflow.status).toBe("applied");
    expect(applied.workspace.events[0].title).toBe("Clear Opening");
    expect(engine.aiEngine.listProposals()[0].status).toBe("applied");
  });

  it("reverts an applied workflow to the exact original workspace", async () => {
    const engine = setup({
      answer: "Archive it.",
      proposals: [
        {
          kind: "archive-event",
          targetId: TIMELINE_WORKSPACE.events[0].id,
          payload: {},
        },
      ],
    });
    const workflow = start(engine);
    await engine.execute(workflow.id);
    engine.approve(workflow.id, "reviewer");
    engine.apply(workflow.id, TIMELINE_WORKSPACE, "reviewer");

    const reverted = engine.revert(workflow.id, "reviewer");

    expect(reverted.workflow.status).toBe("reverted");
    expect(reverted.workspace).toEqual(TIMELINE_WORKSPACE);
  });

  it("refuses stale application when the timeline changed after preview", async () => {
    const engine = setup({
      answer: "Update it.",
      proposals: [
        {
          kind: "update-event",
          targetId: TIMELINE_WORKSPACE.events[0].id,
          payload: { title: "Proposed" },
        },
      ],
    });
    const workflow = start(engine);
    await engine.execute(workflow.id);
    engine.approve(workflow.id, "reviewer");
    const changed = structuredClone(TIMELINE_WORKSPACE);
    changed.events[0].notes = "Another person edited this.";

    expect(() => engine.apply(workflow.id, changed, "reviewer")).toThrow(
      "changed after AI preview"
    );
  });

  it("completes safely when AI returns an answer without actions", async () => {
    const engine = setup({ answer: "No changes needed.", proposals: [] });
    const workflow = start(engine);
    const review = await engine.execute(workflow.id);

    expect(review.workflow.status).toBe("completed");
    expect(review.actionPlan).toBeNull();
    expect(engine.getTransitions(workflow.id).map((entry) => entry.to)).toEqual([
      "queued",
      "running",
      "completed",
    ]);
  });
});
