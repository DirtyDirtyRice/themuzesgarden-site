import type {
  TimelinePromptEngine,
  TimelinePromptMessage,
  TimelinePromptRequest,
  TimelinePromptResult,
} from "./TimelinePromptEngine";
import type { TimelineId, TimelineProjectId, TimelineUserId } from "./TimelineTypes";

export type TimelineAIExecutionStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type TimelineAIProposalStatus =
  | "held"
  | "validated"
  | "rejected"
  | "applied";

export type TimelineAIResponseFormat = "text" | "json";

export type TimelineAIUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type TimelineAITransportRequest = {
  model: string;
  messages: TimelinePromptMessage[];
  temperature: number;
  maxOutputTokens: number;
  responseFormat: TimelineAIResponseFormat;
  signal: AbortSignal;
};

export type TimelineAITransportResponse = {
  id: string | null;
  text: string;
  model: string;
  usage: Partial<TimelineAIUsage>;
};

export type TimelineAITransport = (
  request: TimelineAITransportRequest
) => Promise<TimelineAITransportResponse>;

export type TimelineAIExecution = {
  id: TimelineId;
  promptRequestId: TimelineId;
  projectId: TimelineProjectId;
  status: TimelineAIExecutionStatus;
  responseFormat: TimelineAIResponseFormat;
  attempt: number;
  maxAttempts: number;
  timeoutMs: number;
  createdAt: string;
  createdBy: TimelineUserId;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  providerResponseId?: string | null;
  responseText?: string;
  structuredResponse?: unknown;
  usage?: TimelineAIUsage;
  error?: string;
};

export type TimelineAIProposal = {
  id: TimelineId;
  executionId: TimelineId;
  projectId: TimelineProjectId;
  kind: string;
  targetId: TimelineId | null;
  payload: Record<string, unknown>;
  status: TimelineAIProposalStatus;
  reasons: string[];
  createdAt: string;
  validatedAt?: string;
  reviewedBy?: TimelineUserId;
  appliedAt?: string;
};

export type TimelineAIExecutionEvent = {
  id: TimelineId;
  executionId: TimelineId;
  type:
    | "queued"
    | "started"
    | "retrying"
    | "completed"
    | "failed"
    | "cancelled"
    | "proposal-held"
    | "proposal-validated"
    | "proposal-rejected"
    | "proposal-applied";
  occurredAt: string;
  detail: string;
};

export type TimelineAIEngineOptions = {
  defaultTimeoutMs?: number;
  defaultMaxAttempts?: number;
  now?: () => Date;
};

type StructuredEnvelope = {
  answer?: unknown;
  proposals?: unknown;
};

function cloneExecution(execution: TimelineAIExecution): TimelineAIExecution {
  return {
    ...execution,
    usage: execution.usage ? { ...execution.usage } : undefined,
  };
}

function cloneProposal(proposal: TimelineAIProposal): TimelineAIProposal {
  return {
    ...proposal,
    payload: { ...proposal.payload },
    reasons: [...proposal.reasons],
  };
}

function normalizeUsage(usage: Partial<TimelineAIUsage>): TimelineAIUsage {
  const inputTokens = Math.max(0, Math.floor(usage.inputTokens ?? 0));
  const outputTokens = Math.max(0, Math.floor(usage.outputTokens ?? 0));
  return {
    inputTokens,
    outputTokens,
    totalTokens: Math.max(
      inputTokens + outputTokens,
      Math.floor(usage.totalTokens ?? 0)
    ),
  };
}

function parseJsonObject(text: string): StructuredEnvelope {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("AI response was required to be valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("AI JSON response must be an object.");
  }
  return value as StructuredEnvelope;
}

function proposalCandidates(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function validateProposalCandidate(candidate: unknown): {
  kind: string;
  targetId: TimelineId | null;
  payload: Record<string, unknown>;
  reasons: string[];
} {
  const reasons: string[] = [];
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return {
      kind: "invalid",
      targetId: null,
      payload: {},
      reasons: ["Proposal must be an object."],
    };
  }
  const object = candidate as Record<string, unknown>;
  const kind = typeof object.kind === "string" ? object.kind.trim() : "";
  const targetId =
    typeof object.targetId === "string" && object.targetId.trim()
      ? object.targetId.trim()
      : null;
  const payload =
    object.payload && typeof object.payload === "object" && !Array.isArray(object.payload)
      ? { ...(object.payload as Record<string, unknown>) }
      : {};
  if (!kind) reasons.push("Proposal kind is required.");
  if (!Object.keys(payload).length) reasons.push("Proposal payload is required.");
  return { kind: kind || "invalid", targetId, payload, reasons };
}

export class TimelineAIEngine {
  private readonly executions = new Map<TimelineId, TimelineAIExecution>();
  private readonly proposals = new Map<TimelineId, TimelineAIProposal>();
  private readonly events: TimelineAIExecutionEvent[] = [];
  private readonly controllers = new Map<TimelineId, AbortController>();
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxAttempts: number;
  private readonly now: () => Date;
  private executionSequence = 0;
  private proposalSequence = 0;
  private eventSequence = 0;

  constructor(
    private readonly promptEngine: TimelinePromptEngine,
    private readonly transport: TimelineAITransport,
    options: TimelineAIEngineOptions = {}
  ) {
    this.defaultTimeoutMs = Math.max(100, options.defaultTimeoutMs ?? 120_000);
    this.defaultMaxAttempts = Math.max(1, options.defaultMaxAttempts ?? 2);
    this.now = options.now ?? (() => new Date());
  }

  queue(input: {
    promptRequestId: TimelineId;
    createdBy: TimelineUserId;
    responseFormat?: TimelineAIResponseFormat;
    timeoutMs?: number;
    maxAttempts?: number;
  }): TimelineAIExecution {
    const promptRequest = this.promptEngine.getRequest(input.promptRequestId);
    if (!promptRequest) throw new Error("Prompt request does not exist.");
    if (promptRequest.status !== "ready") {
      throw new Error("Only a ready prompt request can be queued for AI execution.");
    }
    this.promptEngine.enqueue(promptRequest.id);
    this.executionSequence += 1;
    const execution: TimelineAIExecution = {
      id: `timeline-ai-execution-${this.executionSequence}`,
      promptRequestId: promptRequest.id,
      projectId: promptRequest.projectId,
      status: "queued",
      responseFormat: input.responseFormat ?? "text",
      attempt: 0,
      maxAttempts: Math.max(1, input.maxAttempts ?? this.defaultMaxAttempts),
      timeoutMs: Math.max(100, input.timeoutMs ?? this.defaultTimeoutMs),
      createdAt: this.timestamp(),
      createdBy: input.createdBy,
    };
    this.executions.set(execution.id, execution);
    this.record(execution.id, "queued", `Prompt request ${promptRequest.id} queued.`);
    return cloneExecution(execution);
  }

  async execute(executionId: TimelineId): Promise<TimelineAIExecution> {
    const execution = this.requireExecution(executionId);
    if (execution.status !== "queued") {
      throw new Error("Only queued AI executions can start.");
    }
    const promptRequest = this.promptEngine.getRequest(execution.promptRequestId);
    if (!promptRequest) throw new Error("Prompt request no longer exists.");
    const startedPrompt = this.promptEngine.startNext();
    if (!startedPrompt || startedPrompt.id !== promptRequest.id) {
      throw new Error("Prompt queue order does not match AI execution order.");
    }
    execution.status = "running";
    execution.startedAt = this.timestamp();
    this.record(execution.id, "started", `Using model ${promptRequest.model}.`);

    for (let attempt = 1; attempt <= execution.maxAttempts; attempt += 1) {
      execution.attempt = attempt;
      const controller = new AbortController();
      this.controllers.set(execution.id, controller);
      const timeout = setTimeout(() => controller.abort("timeout"), execution.timeoutMs);
      try {
        const response = await this.transport({
          model: promptRequest.model,
          messages: promptRequest.messages.map((message) => ({ ...message })),
          temperature: promptRequest.temperature,
          maxOutputTokens: promptRequest.maxOutputTokens,
          responseFormat: execution.responseFormat,
          signal: controller.signal,
        });
        if (this.wasCancelled(execution.id)) return cloneExecution(execution);
        this.completeExecution(execution, promptRequest, response);
        return cloneExecution(execution);
      } catch (error) {
        if (this.wasCancelled(execution.id)) return cloneExecution(execution);
        const message =
          controller.signal.aborted && controller.signal.reason === "timeout"
            ? `AI request timed out after ${execution.timeoutMs}ms.`
            : error instanceof Error
              ? error.message
              : "AI request failed.";
        if (attempt < execution.maxAttempts) {
          this.record(
            execution.id,
            "retrying",
            `Attempt ${attempt} failed: ${message}`
          );
          continue;
        }
        execution.status = "failed";
        execution.error = message;
        execution.completedAt = this.timestamp();
        this.promptEngine.fail(promptRequest.id, message);
        this.record(execution.id, "failed", message);
        return cloneExecution(execution);
      } finally {
        clearTimeout(timeout);
        this.controllers.delete(execution.id);
      }
    }
    return cloneExecution(execution);
  }

  cancel(executionId: TimelineId): TimelineAIExecution {
    const execution = this.requireExecution(executionId);
    if (execution.status === "completed" || execution.status === "failed") {
      throw new Error("Finished AI executions cannot be cancelled.");
    }
    this.controllers.get(executionId)?.abort("cancelled");
    execution.status = "cancelled";
    execution.cancelledAt = this.timestamp();
    this.promptEngine.cancel(execution.promptRequestId);
    this.record(execution.id, "cancelled", "Execution cancelled by the workspace.");
    return cloneExecution(execution);
  }

  validateProposal(
    proposalId: TimelineId,
    reviewedBy: TimelineUserId
  ): TimelineAIProposal {
    const proposal = this.requireProposal(proposalId);
    if (proposal.status !== "held") throw new Error("Only held proposals can be validated.");
    if (proposal.reasons.length) {
      throw new Error(`Proposal is incomplete: ${proposal.reasons.join(" ")}`);
    }
    proposal.status = "validated";
    proposal.validatedAt = this.timestamp();
    proposal.reviewedBy = reviewedBy;
    this.record(proposal.executionId, "proposal-validated", proposal.id);
    return cloneProposal(proposal);
  }

  rejectProposal(
    proposalId: TimelineId,
    reviewedBy: TimelineUserId,
    reason: string
  ): TimelineAIProposal {
    const proposal = this.requireProposal(proposalId);
    if (proposal.status === "applied") throw new Error("Applied proposals cannot be rejected.");
    proposal.status = "rejected";
    proposal.reviewedBy = reviewedBy;
    if (reason.trim()) proposal.reasons.push(reason.trim());
    this.record(proposal.executionId, "proposal-rejected", proposal.id);
    return cloneProposal(proposal);
  }

  markProposalApplied(proposalId: TimelineId): TimelineAIProposal {
    const proposal = this.requireProposal(proposalId);
    if (proposal.status !== "validated") {
      throw new Error("Only validated proposals can be marked applied.");
    }
    proposal.status = "applied";
    proposal.appliedAt = this.timestamp();
    this.record(proposal.executionId, "proposal-applied", proposal.id);
    return cloneProposal(proposal);
  }

  getExecution(executionId: TimelineId): TimelineAIExecution | null {
    const execution = this.executions.get(executionId);
    return execution ? cloneExecution(execution) : null;
  }

  listExecutions(projectId?: TimelineProjectId): TimelineAIExecution[] {
    return Array.from(this.executions.values())
      .filter((execution) => !projectId || execution.projectId === projectId)
      .map(cloneExecution);
  }

  listProposals(executionId?: TimelineId): TimelineAIProposal[] {
    return Array.from(this.proposals.values())
      .filter((proposal) => !executionId || proposal.executionId === executionId)
      .map(cloneProposal);
  }

  getEvents(executionId?: TimelineId): TimelineAIExecutionEvent[] {
    return this.events
      .filter((event) => !executionId || event.executionId === executionId)
      .map((event) => ({ ...event }));
  }

  private completeExecution(
    execution: TimelineAIExecution,
    promptRequest: TimelinePromptRequest,
    response: TimelineAITransportResponse
  ): void {
    const text = response.text.trim();
    if (!text) throw new Error("AI provider returned an empty response.");
    const structured =
      execution.responseFormat === "json" ? parseJsonObject(text) : undefined;
    const usage = normalizeUsage(response.usage);
    execution.status = "completed";
    execution.completedAt = this.timestamp();
    execution.providerResponseId = response.id;
    execution.responseText = text;
    execution.structuredResponse = structured;
    execution.usage = usage;
    const result: TimelinePromptResult = {
      requestId: promptRequest.id,
      response: text,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      completedAt: execution.completedAt,
    };
    this.promptEngine.complete(promptRequest.id, result);
    this.captureProposals(execution, structured?.proposals);
    this.record(execution.id, "completed", `Model ${response.model} completed.`);
  }

  private captureProposals(execution: TimelineAIExecution, value: unknown): void {
    for (const candidate of proposalCandidates(value)) {
      const validated = validateProposalCandidate(candidate);
      this.proposalSequence += 1;
      const proposal: TimelineAIProposal = {
        id: `timeline-ai-proposal-${this.proposalSequence}`,
        executionId: execution.id,
        projectId: execution.projectId,
        kind: validated.kind,
        targetId: validated.targetId,
        payload: validated.payload,
        status: "held",
        reasons: validated.reasons,
        createdAt: this.timestamp(),
      };
      this.proposals.set(proposal.id, proposal);
      this.record(
        execution.id,
        "proposal-held",
        `${proposal.id}: ${proposal.reasons.join(" ") || "awaiting validation"}`
      );
    }
  }

  private wasCancelled(executionId: TimelineId): boolean {
    return this.executions.get(executionId)?.status === "cancelled";
  }

  private requireExecution(executionId: TimelineId): TimelineAIExecution {
    const execution = this.executions.get(executionId);
    if (!execution) throw new Error(`AI execution ${executionId} does not exist.`);
    return execution;
  }

  private requireProposal(proposalId: TimelineId): TimelineAIProposal {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) throw new Error(`AI proposal ${proposalId} does not exist.`);
    return proposal;
  }

  private timestamp(): string {
    return this.now().toISOString();
  }

  private record(
    executionId: TimelineId,
    type: TimelineAIExecutionEvent["type"],
    detail: string
  ): void {
    this.eventSequence += 1;
    this.events.push({
      id: `timeline-ai-event-${this.eventSequence}`,
      executionId,
      type,
      occurredAt: this.timestamp(),
      detail,
    });
  }
}
