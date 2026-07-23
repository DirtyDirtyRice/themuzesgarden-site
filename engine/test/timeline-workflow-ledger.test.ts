import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { TimelineAIExecution } from "../../lib/timeline/TimelineAIEngine";
import type { TimelineWorkflow } from "../../lib/timeline/TimelineOrchestrationEngine";
import {
  TimelineWorkflowFileStore,
  TimelineWorkflowLedger,
  TimelineWorkflowMemoryStore,
} from "../../lib/timeline/TimelineWorkflowLedger";

function workflow(
  id = "workflow-1",
  projectId = "project-1"
): TimelineWorkflow {
  const timestamp = new Date().toISOString();
  return {
    id,
    projectId,
    status: "completed",
    promptRequestId: "prompt-1",
    executionId: "execution-1",
    proposalIds: [],
    actionPlanId: null,
    receiptId: null,
    responseText: "No changes needed.",
    errors: [],
    warnings: [],
    createdAt: timestamp,
    createdBy: "member",
    updatedAt: timestamp,
    completedAt: timestamp,
  };
}

function execution(projectId = "project-1"): TimelineAIExecution {
  const timestamp = new Date().toISOString();
  return {
    id: "execution-1",
    promptRequestId: "prompt-1",
    projectId,
    status: "completed",
    responseFormat: "json",
    attempt: 1,
    maxAttempts: 2,
    timeoutMs: 120_000,
    createdAt: timestamp,
    createdBy: "member",
    completedAt: timestamp,
    responseText: "{\"answer\":\"No changes\",\"proposals\":[]}",
    usage: { inputTokens: 1_000, outputTokens: 500, totalTokens: 1_500 },
  };
}

describe("TimelineWorkflowLedger", () => {
  it("persists workflow history and reloads it after a simulated restart", async () => {
    const directory = await mkdtemp(join(tmpdir(), "timeline-ledger-"));
    const path = join(directory, "workflow-ledger.json");
    const first = new TimelineWorkflowLedger(new TimelineWorkflowFileStore(path));
    await first.initialize();
    await first.record({
      workflow: workflow(),
      execution: execution(),
      pricing: { inputTokenRatePerMillion: 2, outputTokenRatePerMillion: 8 },
    });

    const restarted = new TimelineWorkflowLedger(
      new TimelineWorkflowFileStore(path)
    );
    const snapshot = await restarted.initialize();

    expect(snapshot.recordCount).toBe(1);
    expect(snapshot.totalInputTokens).toBe(1_000);
    expect(snapshot.estimatedTotalCost).toBe(0.006);
    expect(restarted.latestWorkflowRecord("workflow-1")?.workflow.status).toBe(
      "completed"
    );
  });

  it("serializes concurrent records without losing sequence or hash links", async () => {
    const ledger = new TimelineWorkflowLedger(new TimelineWorkflowMemoryStore());
    await ledger.initialize();

    await Promise.all([
      ledger.record({ workflow: workflow("workflow-1") }),
      ledger.record({ workflow: workflow("workflow-2") }),
      ledger.record({ workflow: workflow("workflow-3") }),
    ]);

    const document = ledger.exportDocument();
    expect(document.records.map((record) => record.sequence)).toEqual([1, 2, 3]);
    expect(ledger.verifyIntegrity().valid).toBe(true);
  });

  it("keeps project histories isolated and rejects mismatched evidence", async () => {
    const ledger = new TimelineWorkflowLedger(new TimelineWorkflowMemoryStore());
    await ledger.initialize();
    await ledger.record({ workflow: workflow("workflow-1", "project-1") });
    await ledger.record({ workflow: workflow("workflow-2", "project-2") });

    expect(ledger.getProjectHistory("project-1")).toHaveLength(1);
    await expect(
      ledger.record({
        workflow: workflow("workflow-3", "project-1"),
        execution: execution("project-2"),
      })
    ).rejects.toThrow("does not match");
  });

  it("detects tampering before loading a persisted ledger", async () => {
    const directory = await mkdtemp(join(tmpdir(), "timeline-ledger-tamper-"));
    const path = join(directory, "workflow-ledger.json");
    const store = new TimelineWorkflowFileStore(path);
    const ledger = new TimelineWorkflowLedger(store);
    await ledger.initialize();
    await ledger.record({ workflow: workflow() });
    const document = JSON.parse(await readFile(path, "utf8"));
    document.records[0].workflow.status = "applied";
    await writeFile(path, JSON.stringify(document), "utf8");

    const restarted = new TimelineWorkflowLedger(store);
    await expect(restarted.initialize()).rejects.toThrow("integrity failed");
  });
});
