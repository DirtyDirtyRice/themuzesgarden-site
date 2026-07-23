import { describe, expect, it, vi } from "vitest";
import { TimelineAIEngine, type TimelineAITransport } from "../../lib/timeline/TimelineAIEngine";
import { TimelinePromptEngine } from "../../lib/timeline/TimelinePromptEngine";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";

function setup(transport: TimelineAITransport, maxAttempts = 2) {
  const prompts = new TimelinePromptEngine();
  prompts.saveTemplate({
    id: "timeline-ai-test",
    name: "Timeline AI test",
    description: "Test template",
    role: "user",
    content: "Review {{title}}\n{{timelineContext}}",
    requiredVariables: ["title", "timelineContext"],
    optionalVariables: [],
    tags: ["test"],
    createdBy: "member",
  });
  const built = prompts.buildRequest({
    templateId: "timeline-ai-test",
    workspace: TIMELINE_WORKSPACE,
    variables: { title: "Verse" },
    context: { maxEvents: 1 },
    model: "test-model",
    createdBy: "member",
  });
  const engine = new TimelineAIEngine(prompts, transport, {
    defaultMaxAttempts: maxAttempts,
  });
  const execution = engine.queue({
    promptRequestId: built.request!.id,
    createdBy: "member",
    responseFormat: "json",
  });
  return { engine, prompts, execution };
}

describe("TimelineAIEngine", () => {
  it("executes a prompt and holds structured proposals until validated", async () => {
    const transport: TimelineAITransport = vi.fn(async () => ({
      id: "response-1",
      model: "test-model",
      text: JSON.stringify({
        answer: "Use a tighter opening.",
        proposals: [
          { kind: "update-event", targetId: "event-1", payload: { title: "Opening" } },
        ],
      }),
      usage: { inputTokens: 20, outputTokens: 10 },
    }));
    const { engine, prompts, execution } = setup(transport);

    const completed = await engine.execute(execution.id);
    const proposal = engine.listProposals(execution.id)[0];

    expect(completed.status).toBe("completed");
    expect(completed.usage?.totalTokens).toBe(30);
    expect(prompts.getRequest(execution.promptRequestId)?.status).toBe("completed");
    expect(proposal.status).toBe("held");
    expect(engine.validateProposal(proposal.id, "reviewer").status).toBe("validated");
    expect(engine.markProposalApplied(proposal.id).status).toBe("applied");
  });

  it("retries transient failures and preserves the complete audit trail", async () => {
    let attempts = 0;
    const transport: TimelineAITransport = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary provider failure");
      return {
        id: "response-2",
        model: "test-model",
        text: JSON.stringify({ answer: "Recovered", proposals: [] }),
        usage: {},
      };
    });
    const { engine, execution } = setup(transport);

    const completed = await engine.execute(execution.id);

    expect(completed.status).toBe("completed");
    expect(completed.attempt).toBe(2);
    expect(engine.getEvents(execution.id).map((event) => event.type)).toEqual([
      "queued",
      "started",
      "retrying",
      "completed",
    ]);
  });

  it("fails closed when structured output is invalid", async () => {
    const transport: TimelineAITransport = vi.fn(async () => ({
      id: null,
      model: "test-model",
      text: "not json",
      usage: {},
    }));
    const { engine, prompts, execution } = setup(transport, 1);

    const failed = await engine.execute(execution.id);

    expect(failed.status).toBe("failed");
    expect(failed.error).toContain("valid JSON");
    expect(prompts.getRequest(execution.promptRequestId)?.status).toBe("failed");
    expect(engine.listProposals()).toHaveLength(0);
  });

  it("keeps incomplete AI proposals in the holding pattern", async () => {
    const transport: TimelineAITransport = vi.fn(async () => ({
      id: "response-3",
      model: "test-model",
      text: JSON.stringify({ proposals: [{ kind: "", payload: {} }] }),
      usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    }));
    const { engine, execution } = setup(transport);

    await engine.execute(execution.id);
    const proposal = engine.listProposals()[0];

    expect(proposal.status).toBe("held");
    expect(proposal.reasons).toHaveLength(2);
    expect(() => engine.validateProposal(proposal.id, "reviewer")).toThrow(
      "incomplete"
    );
  });
});
