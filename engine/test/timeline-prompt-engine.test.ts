import { describe, expect, it } from "vitest";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";
import { TimelinePromptEngine } from "../../lib/timeline/TimelinePromptEngine";

function setup() {
  const engine = new TimelinePromptEngine();
  engine.saveTemplate({
    id: "rewrite",
    name: "Rewrite",
    description: "Rewrite lyrics with context",
    role: "user",
    content: "Rewrite {{title}}.\n\nTimeline:\n{{timelineContext}}",
    requiredVariables: ["title", "timelineContext"],
    optionalVariables: [],
    tags: ["lyrics"],
    createdBy: "member",
  });
  return engine;
}

describe("TimelinePromptEngine", () => {
  it("builds deterministic requests with selected Timeline context", () => {
    const engine = setup();
    const result = engine.buildRequest({
      templateId: "rewrite",
      workspace: TIMELINE_WORKSPACE,
      variables: { title: "Verse One" },
      context: { maxEvents: 1, includeMetadata: true },
      model: "test-model",
      createdBy: "member",
    });

    expect(result.valid).toBe(true);
    expect(result.request?.messages[0].content).toContain("Verse One");
    expect(result.request?.contextEventIds).toHaveLength(1);
    expect(result.request?.estimatedInputTokens).toBeGreaterThan(0);
  });

  it("holds requests with missing variables or exceeded token budgets", () => {
    const engine = setup();
    const missing = engine.buildRequest({
      templateId: "rewrite",
      workspace: TIMELINE_WORKSPACE,
      variables: {},
      model: "test-model",
      createdBy: "member",
    });
    const overBudget = engine.buildRequest({
      templateId: "rewrite",
      workspace: TIMELINE_WORKSPACE,
      variables: { title: "Verse" },
      model: "test-model",
      maxInputTokens: 1,
      createdBy: "member",
    });

    expect(missing.valid).toBe(false);
    expect(missing.errors[0]).toContain("title");
    expect(overBudget.valid).toBe(false);
    expect(overBudget.errors.some((error) => error.includes("budget"))).toBe(true);
  });

  it("tracks the real queue lifecycle through completion", () => {
    const engine = setup();
    const built = engine.buildRequest({
      templateId: "rewrite",
      workspace: TIMELINE_WORKSPACE,
      variables: { title: "Verse" },
      model: "test-model",
      createdBy: "member",
    });
    const requestId = built.request!.id;
    engine.enqueue(requestId);
    expect(engine.startNext()?.status).toBe("running");
    const completed = engine.complete(requestId, {
      requestId,
      response: "Rewritten verse",
      inputTokens: 10,
      outputTokens: 5,
      completedAt: new Date().toISOString(),
    });

    expect(completed.status).toBe("completed");
    expect(engine.getQueueStatus().completed).toBe(1);
  });
});
