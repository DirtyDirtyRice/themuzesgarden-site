import { describe, expect, it, vi } from "vitest";
import type { TimelineAITransport } from "../../lib/timeline/TimelineAIEngine";
import { TimelineOrchestrationEngine } from "../../lib/timeline/TimelineOrchestrationEngine";
import { TimelinePromptEngine } from "../../lib/timeline/TimelinePromptEngine";
import { TimelineRecordedOrchestrationEngine } from "../../lib/timeline/TimelineRecordedOrchestrationEngine";
import {
  TimelineWorkflowLedger,
  TimelineWorkflowMemoryStore,
} from "../../lib/timeline/TimelineWorkflowLedger";
import { TIMELINE_WORKSPACE } from "../../lib/timeline/TimelineSeed";

function setup(
  proposals: unknown[],
  store = new TimelineWorkflowMemoryStore()
) {
  const promptEngine = new TimelinePromptEngine();
  promptEngine.saveTemplate({
    id: "recorded-test",
    name: "Recorded test",
    description: "Recorded orchestration test",
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
    text: JSON.stringify({ answer: "Review complete.", proposals }),
    usage: { inputTokens: 100, outputTokens: 25, totalTokens: 125 },
  }));
  const orchestration = new TimelineOrchestrationEngine(
    promptEngine,
    transport
  );
  const ledger = new TimelineWorkflowLedger(store);
  const recorded = new TimelineRecordedOrchestrationEngine(
    orchestration,
    ledger,
    {
      pricing: {
        inputTokenRatePerMillion: 2,
        outputTokenRatePerMillion: 8,
      },
    }
  );
  return { recorded, ledger };
}

async function start(recorded: TimelineRecordedOrchestrationEngine) {
  return recorded.start({
    templateId: "recorded-test",
    workspace: TIMELINE_WORKSPACE,
    variables: { title: "Opening" },
    context: { maxEvents: 1 },
    model: "test-model",
    responseFormat: "json",
    createdBy: "member",
  });
}

describe("TimelineRecordedOrchestrationEngine", () => {
  it("automatically records every step through apply and revert", async () => {
    const { recorded, ledger } = setup([
      {
        kind: "update-event",
        targetId: TIMELINE_WORKSPACE.events[0].id,
        payload: { title: "Recorded Opening" },
      },
    ]);
    const started = await start(recorded);
    const workflowId = started.result.id;
    await recorded.execute(workflowId);
    await recorded.approve(workflowId, "reviewer");
    const applied = await recorded.apply(
      workflowId,
      TIMELINE_WORKSPACE,
      "reviewer"
    );
    await recorded.revert(workflowId, "reviewer");

    const history = ledger.getWorkflowHistory(workflowId);
    expect(history.map((record) => record.workflow.status)).toEqual([
      "queued",
      "awaiting-review",
      "ready-to-apply",
      "applied",
      "reverted",
    ]);
    expect(history[3].receipt?.id).toBe(applied.result.receipt.id);
    expect(history[3].proposals[0].status).toBe("applied");
    expect(history[1].cost?.estimatedTotalCost).toBe(0.0004);
    expect(ledger.verifyIntegrity().valid).toBe(true);
  });

  it("records a no-action completion without requiring review", async () => {
    const { recorded, ledger } = setup([]);
    const started = await start(recorded);
    const completed = await recorded.execute(started.result.id);

    expect(completed.result.workflow.status).toBe("completed");
    expect(ledger.getWorkflowHistory(started.result.id)).toHaveLength(2);
    expect(
      ledger.latestWorkflowRecord(started.result.id)?.workflow.status
    ).toBe("completed");
  });

  it("records rejected proposals and the reviewer reason", async () => {
    const { recorded, ledger } = setup([
      {
        kind: "update-event",
        targetId: TIMELINE_WORKSPACE.events[0].id,
        payload: { title: "Rejected title" },
      },
    ]);
    const started = await start(recorded);
    await recorded.execute(started.result.id);
    await recorded.reject(
      started.result.id,
      "reviewer",
      "Keep the original title."
    );

    const latest = ledger.latestWorkflowRecord(started.result.id);
    expect(latest?.workflow.status).toBe("cancelled");
    expect(latest?.workflow.errors).toContain("Keep the original title.");
    expect(latest?.proposals[0].status).toBe("rejected");
    expect(latest?.recordedBy).toBe("reviewer");
  });

  it("records refused stale applications as failed attempts", async () => {
    const { recorded, ledger } = setup([
      {
        kind: "update-event",
        targetId: TIMELINE_WORKSPACE.events[0].id,
        payload: { title: "Proposed title" },
      },
    ]);
    const started = await start(recorded);
    await recorded.execute(started.result.id);
    await recorded.approve(started.result.id, "reviewer");
    const stale = structuredClone(TIMELINE_WORKSPACE);
    stale.events[0].notes = "Concurrent edit";

    await expect(
      recorded.apply(started.result.id, stale, "reviewer")
    ).rejects.toThrow("changed after AI preview");

    const latest = ledger.latestWorkflowRecord(started.result.id);
    expect(latest?.workflow.errors.at(-1)).toContain("changed after AI preview");
    expect(latest?.workflow.status).toBe("ready-to-apply");
  });
  it("restores an awaiting-review workflow after a server restart", async () => {
    const store = new TimelineWorkflowMemoryStore();
    const proposal = {
      kind: "update-event",
      targetId: TIMELINE_WORKSPACE.events[0].id,
      payload: { title: "Recovered title" },
    };
    const first = setup([proposal], store);
    const started = await start(first.recorded);
    await first.recorded.execute(started.result.id);

    const restarted = setup([], store);
    await restarted.recorded.initialize();
    expect(restarted.recorded.getWorkflow(started.result.id)?.status).toBe(
      "awaiting-review"
    );
    await restarted.recorded.approve(started.result.id, "reviewer");
    const applied = await restarted.recorded.apply(
      started.result.id,
      TIMELINE_WORKSPACE,
      "reviewer"
    );
    expect(applied.result.workspace.events[0].title).toBe("Recovered title");
  });
});
