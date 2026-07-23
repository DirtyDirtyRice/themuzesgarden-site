import "server-only";

import { join } from "node:path";
import { TimelineOrchestrationEngine } from "./TimelineOrchestrationEngine";
import { TimelinePromptEngine } from "./TimelinePromptEngine";
import { TimelineProjectWorkspaceStore } from "./TimelineProjectWorkspaceStore";
import { TimelineEventLifecycleService } from "./TimelineEventLifecycleService";
import { TimelineRecordedOrchestrationEngine } from "./TimelineRecordedOrchestrationEngine";
import { createTimelineOpenAITransport } from "./TimelineOpenAITransport";
import {
  TimelineWorkflowFileStore,
  TimelineWorkflowLedger,
} from "./TimelineWorkflowLedger";

export const TIMELINE_ASSISTANT_TEMPLATE_ID = "timeline-workspace-assistant";

let servicePromise: Promise<TimelineRecordedOrchestrationEngine> | null = null;
let projectWorkspaceStore: TimelineProjectWorkspaceStore | null = null;
let eventLifecycleService: TimelineEventLifecycleService | null = null;

function nonNegativeRate(name: string): number {
  const value = Number(process.env[name] ?? 0);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function ledgerPath(): string {
  return (
    process.env.TIMELINE_WORKFLOW_LEDGER_PATH?.trim() ||
    join(process.cwd(), "code-map-reports", "timeline-workflows", "ledger.json")
  );
}

async function createService(): Promise<TimelineRecordedOrchestrationEngine> {
  const promptEngine = new TimelinePromptEngine();
  promptEngine.saveTemplate({
    id: TIMELINE_ASSISTANT_TEMPLATE_ID,
    name: "Timeline Workspace Assistant",
    description: "Analyzes Timeline context and returns held proposals.",
    role: "user",
    content:
      "Developer request:\n{{instruction}}\n\nTimeline evidence:\n{{timelineContext}}",
    requiredVariables: ["instruction", "timelineContext"],
    optionalVariables: [],
    tags: ["timeline", "assistant", "review-required"],
    createdBy: "system",
  });
  const orchestration = new TimelineOrchestrationEngine(
    promptEngine,
    createTimelineOpenAITransport(),
  );
  const ledger = new TimelineWorkflowLedger(
    new TimelineWorkflowFileStore(ledgerPath()),
  );
  const service = new TimelineRecordedOrchestrationEngine(
    orchestration,
    ledger,
    {
      pricing: {
        inputTokenRatePerMillion: nonNegativeRate(
          "OPENAI_TIMELINE_INPUT_RATE_PER_MILLION",
        ),
        outputTokenRatePerMillion: nonNegativeRate(
          "OPENAI_TIMELINE_OUTPUT_RATE_PER_MILLION",
        ),
      },
    },
  );
  await service.initialize();
  return service;
}

export function getTimelineWorkflowServer(): Promise<TimelineRecordedOrchestrationEngine> {
  if (!servicePromise) {
    servicePromise = createService().catch((error) => {
      servicePromise = null;
      throw error;
    });
  }
  return servicePromise;
}

export function getTimelineProjectWorkspaceStore(): TimelineProjectWorkspaceStore {
  if (!projectWorkspaceStore) {
    projectWorkspaceStore = new TimelineProjectWorkspaceStore(
      join(process.cwd(), "code-map-reports", "timeline-workflows", "projects"),
    );
  }
  return projectWorkspaceStore;
}
export function getTimelineEventLifecycleService(): TimelineEventLifecycleService {
  if (!eventLifecycleService) {
    eventLifecycleService = new TimelineEventLifecycleService(
      join(
        process.cwd(),
        "code-map-reports",
        "timeline-workflows",
        "event-lifecycle.json",
      ),
    );
  }
  return eventLifecycleService;
}
