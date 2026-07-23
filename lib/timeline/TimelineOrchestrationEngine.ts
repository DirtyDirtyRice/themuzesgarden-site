import {
  TimelineActionEngine,
  type TimelineActionPlan,
  type TimelineActionReceipt,
} from "./TimelineActionEngine";
import {
  TimelineAIEngine,
  type TimelineAIExecution,
  type TimelineAIProposal,
  type TimelineAIResponseFormat,
  type TimelineAITransport,
} from "./TimelineAIEngine";
import {
  TimelinePromptEngine,
  type TimelinePromptBuildResult,
  type TimelinePromptContextOptions,
} from "./TimelinePromptEngine";
import type {
  TimelineId,
  TimelineProjectId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineWorkflowStatus =
  | "blocked"
  | "queued"
  | "running"
  | "awaiting-review"
  | "completed"
  | "ready-to-apply"
  | "applied"
  | "failed"
  | "cancelled"
  | "reverted";

export type TimelineWorkflowTransition = {
  id: TimelineId;
  workflowId: TimelineId;
  from: TimelineWorkflowStatus | "created";
  to: TimelineWorkflowStatus;
  occurredAt: string;
  actor: TimelineUserId | "engine";
  detail: string;
};

export type TimelineWorkflow = {
  id: TimelineId;
  projectId: TimelineProjectId;
  status: TimelineWorkflowStatus;
  promptRequestId: TimelineId | null;
  executionId: TimelineId | null;
  proposalIds: TimelineId[];
  actionPlanId: TimelineId | null;
  receiptId: TimelineId | null;
  responseText: string | null;
  errors: string[];
  warnings: string[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  completedAt?: string;
};

export type TimelineWorkflowStartInput = {
  templateId: TimelineId;
  templateVersion?: number;
  workspace: TimelineWorkspace;
  variables: Record<string, string>;
  context?: TimelinePromptContextOptions;
  model: string;
  temperature?: number;
  maxOutputTokens?: number;
  maxInputTokens?: number;
  responseFormat?: TimelineAIResponseFormat;
  timeoutMs?: number;
  maxAttempts?: number;
  createdBy: TimelineUserId;
};

export type TimelineWorkflowReview = {
  workflow: TimelineWorkflow;
  execution: TimelineAIExecution;
  proposals: TimelineAIProposal[];
  actionPlan: TimelineActionPlan | null;
};

export type TimelineWorkflowApplication = {
  workflow: TimelineWorkflow;
  receipt: TimelineActionReceipt;
  workspace: TimelineWorkspace;
};

type InternalWorkflow = TimelineWorkflow & {
  baselineWorkspace: TimelineWorkspace;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class TimelineOrchestrationEngine {
  readonly aiEngine: TimelineAIEngine;
  readonly actionEngine: TimelineActionEngine;
  private readonly workflows = new Map<TimelineId, InternalWorkflow>();
  private readonly transitions: TimelineWorkflowTransition[] = [];
  private workflowSequence = 0;
  private transitionSequence = 0;

  constructor(
    readonly promptEngine: TimelinePromptEngine,
    transport: TimelineAITransport,
    options: {
      aiEngine?: TimelineAIEngine;
      actionEngine?: TimelineActionEngine;
      now?: () => Date;
    } = {}
  ) {
    this.now = options.now ?? (() => new Date());
    this.aiEngine =
      options.aiEngine ?? new TimelineAIEngine(promptEngine, transport, { now: this.now });
    this.actionEngine = options.actionEngine ?? new TimelineActionEngine(undefined, this.now);
  }

  private readonly now: () => Date;

  start(input: TimelineWorkflowStartInput): TimelineWorkflow {
    this.workflowSequence += 1;
    const id = `timeline-workflow-${this.workflowSequence}`;
    const createdAt = this.timestamp();
    const build = this.promptEngine.buildRequest({
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      workspace: input.workspace,
      variables: input.variables,
      context: input.context,
      model: input.model,
      temperature: input.temperature,
      maxOutputTokens: input.maxOutputTokens,
      maxInputTokens: input.maxInputTokens,
      createdBy: input.createdBy,
    });
    const workflow: InternalWorkflow = {
      id,
      projectId: input.workspace.projectId,
      status: build.valid ? "queued" : "blocked",
      promptRequestId: build.request?.id ?? null,
      executionId: null,
      proposalIds: [],
      actionPlanId: null,
      receiptId: null,
      responseText: null,
      errors: [...build.errors],
      warnings: [...build.warnings],
      createdAt,
      createdBy: input.createdBy,
      updatedAt: createdAt,
      baselineWorkspace: clone(input.workspace),
    };
    if (build.valid && build.request) {
      const execution = this.aiEngine.queue({
        promptRequestId: build.request.id,
        createdBy: input.createdBy,
        responseFormat: input.responseFormat ?? "json",
        timeoutMs: input.timeoutMs,
        maxAttempts: input.maxAttempts,
      });
      workflow.executionId = execution.id;
    }
    this.workflows.set(workflow.id, workflow);
    this.record(
      workflow,
      "created",
      workflow.status,
      input.createdBy,
      build.valid
        ? `Prompt ${workflow.promptRequestId} queued as ${workflow.executionId}.`
        : build.errors.join(" ")
    );
    return this.publicWorkflow(workflow);
  }

  async execute(workflowId: TimelineId): Promise<TimelineWorkflowReview> {
    const workflow = this.requireWorkflow(workflowId);
    if (workflow.status !== "queued" || !workflow.executionId) {
      throw new Error("Only a queued workflow can execute.");
    }
    this.transition(workflow, "running", "engine", "AI execution started.");
    const execution = await this.aiEngine.execute(workflow.executionId);
    workflow.responseText = execution.responseText ?? null;
    if (execution.status === "failed") {
      workflow.errors.push(execution.error ?? "AI execution failed.");
      this.transition(workflow, "failed", "engine", workflow.errors.at(-1)!);
      workflow.completedAt = this.timestamp();
      return this.review(workflow, execution, [], null);
    }
    if (execution.status === "cancelled") {
      this.transition(workflow, "cancelled", "engine", "AI execution was cancelled.");
      workflow.completedAt = this.timestamp();
      return this.review(workflow, execution, [], null);
    }
    if (execution.status !== "completed") {
      throw new Error(`Unexpected AI execution status ${execution.status}.`);
    }

    const proposals = this.aiEngine.listProposals(execution.id);
    workflow.proposalIds = proposals.map((proposal) => proposal.id);
    if (!proposals.length) {
      this.transition(
        workflow,
        "completed",
        "engine",
        "AI response completed without timeline change proposals."
      );
      workflow.completedAt = this.timestamp();
      return this.review(workflow, execution, proposals, null);
    }
    const plan = this.actionEngine.preview({
      workspace: workflow.baselineWorkspace,
      proposals,
      createdBy: workflow.createdBy,
    });
    workflow.actionPlanId = plan.id;
    if (plan.status === "blocked") {
      workflow.errors.push(...plan.issues.map((issue) => issue.message));
      this.transition(
        workflow,
        "blocked",
        "engine",
        `Action preview blocked with ${plan.issues.length} issue(s).`
      );
    } else {
      this.transition(
        workflow,
        "awaiting-review",
        "engine",
        `${proposals.length} proposal(s) held for human review.`
      );
    }
    return this.review(workflow, execution, proposals, plan);
  }

  approve(workflowId: TimelineId, reviewedBy: TimelineUserId): TimelineWorkflowReview {
    const workflow = this.requireWorkflow(workflowId);
    if (workflow.status !== "awaiting-review" || !workflow.executionId) {
      throw new Error("Only a workflow awaiting review can be approved.");
    }
    const proposals = this.aiEngine
      .listProposals(workflow.executionId)
      .map((proposal) => this.aiEngine.validateProposal(proposal.id, reviewedBy));
    const plan = this.actionEngine.preview({
      workspace: workflow.baselineWorkspace,
      proposals,
      createdBy: reviewedBy,
    });
    workflow.actionPlanId = plan.id;
    if (plan.status !== "ready") {
      workflow.errors.push(...plan.issues.map((issue) => issue.message));
      this.transition(workflow, "blocked", reviewedBy, "Approved proposals failed final preview.");
    } else {
      this.transition(
        workflow,
        "ready-to-apply",
        reviewedBy,
        `${proposals.length} proposal(s) approved and ready to apply.`
      );
    }
    return this.review(
      workflow,
      this.requireExecution(workflow.executionId),
      proposals,
      plan
    );
  }

  reject(
    workflowId: TimelineId,
    reviewedBy: TimelineUserId,
    reason: string
  ): TimelineWorkflow {
    const workflow = this.requireWorkflow(workflowId);
    if (workflow.status !== "awaiting-review" || !workflow.executionId) {
      throw new Error("Only a workflow awaiting review can be rejected.");
    }
    for (const proposal of this.aiEngine.listProposals(workflow.executionId)) {
      this.aiEngine.rejectProposal(proposal.id, reviewedBy, reason);
    }
    workflow.errors.push(reason.trim() || "Proposals rejected by reviewer.");
    this.transition(workflow, "cancelled", reviewedBy, workflow.errors.at(-1)!);
    workflow.completedAt = this.timestamp();
    return this.publicWorkflow(workflow);
  }

  apply(
    workflowId: TimelineId,
    currentWorkspace: TimelineWorkspace,
    appliedBy: TimelineUserId
  ): TimelineWorkflowApplication {
    const workflow = this.requireWorkflow(workflowId);
    if (
      workflow.status !== "ready-to-apply" ||
      !workflow.executionId ||
      !workflow.actionPlanId
    ) {
      throw new Error("Only a ready-to-apply workflow can change the timeline.");
    }
    this.assertWorkspaceUnchanged(workflow, currentWorkspace);
    const proposals = this.aiEngine.listProposals(workflow.executionId);
    const receipt = this.actionEngine.apply({
      planId: workflow.actionPlanId,
      workspace: currentWorkspace,
      proposals,
      appliedBy,
    });
    for (const proposal of proposals) this.aiEngine.markProposalApplied(proposal.id);
    workflow.receiptId = receipt.id;
    this.transition(
      workflow,
      "applied",
      appliedBy,
      `${receipt.changes.length} recorded change(s) applied atomically.`
    );
    workflow.completedAt = this.timestamp();
    return {
      workflow: this.publicWorkflow(workflow),
      receipt,
      workspace: clone(receipt.afterWorkspace),
    };
  }

  revert(workflowId: TimelineId, revertedBy: TimelineUserId): TimelineWorkflowApplication {
    const workflow = this.requireWorkflow(workflowId);
    if (workflow.status !== "applied" || !workflow.receiptId) {
      throw new Error("Only an applied workflow can be reverted.");
    }
    const receipt = this.actionEngine.revert(workflow.receiptId, revertedBy);
    this.transition(
      workflow,
      "reverted",
      revertedBy,
      "Timeline restored to its exact pre-application workspace."
    );
    workflow.completedAt = this.timestamp();
    return {
      workflow: this.publicWorkflow(workflow),
      receipt,
      workspace: clone(receipt.beforeWorkspace),
    };
  }

  cancel(workflowId: TimelineId, actor: TimelineUserId): TimelineWorkflow {
    const workflow = this.requireWorkflow(workflowId);
    if (!["queued", "running"].includes(workflow.status) || !workflow.executionId) {
      throw new Error("Only queued or running workflows can be cancelled.");
    }
    this.aiEngine.cancel(workflow.executionId);
    this.transition(workflow, "cancelled", actor, "Workflow cancelled.");
    workflow.completedAt = this.timestamp();
    return this.publicWorkflow(workflow);
  }

  getWorkflow(workflowId: TimelineId): TimelineWorkflow | null {
    const workflow = this.workflows.get(workflowId);
    return workflow ? this.publicWorkflow(workflow) : null;
  }

  listWorkflows(projectId?: TimelineProjectId): TimelineWorkflow[] {
    return Array.from(this.workflows.values())
      .filter((workflow) => !projectId || workflow.projectId === projectId)
      .map((workflow) => this.publicWorkflow(workflow));
  }

  getTransitions(workflowId?: TimelineId): TimelineWorkflowTransition[] {
    return this.transitions
      .filter((transition) => !workflowId || transition.workflowId === workflowId)
      .map((transition) => ({ ...transition }));
  }

  private assertWorkspaceUnchanged(
    workflow: InternalWorkflow,
    currentWorkspace: TimelineWorkspace
  ): void {
    if (currentWorkspace.projectId !== workflow.projectId) {
      throw new Error("Current workspace belongs to another project.");
    }
    if (JSON.stringify(currentWorkspace) !== JSON.stringify(workflow.baselineWorkspace)) {
      throw new Error(
        "Timeline changed after AI preview. Start a new preview before applying."
      );
    }
  }

  private review(
    workflow: InternalWorkflow,
    execution: TimelineAIExecution,
    proposals: TimelineAIProposal[],
    actionPlan: TimelineActionPlan | null
  ): TimelineWorkflowReview {
    return {
      workflow: this.publicWorkflow(workflow),
      execution: clone(execution),
      proposals: clone(proposals),
      actionPlan: actionPlan ? clone(actionPlan) : null,
    };
  }

  private requireExecution(executionId: TimelineId): TimelineAIExecution {
    const execution = this.aiEngine.getExecution(executionId);
    if (!execution) throw new Error(`AI execution ${executionId} does not exist.`);
    return execution;
  }

  private requireWorkflow(workflowId: TimelineId): InternalWorkflow {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Timeline workflow ${workflowId} does not exist.`);
    return workflow;
  }

  private transition(
    workflow: InternalWorkflow,
    status: TimelineWorkflowStatus,
    actor: TimelineWorkflowTransition["actor"],
    detail: string
  ): void {
    const from = workflow.status;
    workflow.status = status;
    workflow.updatedAt = this.timestamp();
    this.record(workflow, from, status, actor, detail);
  }

  private record(
    workflow: InternalWorkflow,
    from: TimelineWorkflowTransition["from"],
    to: TimelineWorkflowStatus,
    actor: TimelineWorkflowTransition["actor"],
    detail: string
  ): void {
    this.transitionSequence += 1;
    this.transitions.push({
      id: `timeline-workflow-transition-${this.transitionSequence}`,
      workflowId: workflow.id,
      from,
      to,
      occurredAt: this.timestamp(),
      actor,
      detail,
    });
  }

  private publicWorkflow(workflow: InternalWorkflow): TimelineWorkflow {
    const { baselineWorkspace: _baselineWorkspace, ...value } = workflow;
    return clone(value);
  }

  private timestamp(): string {
    return this.now().toISOString();
  }
}

export function blockedTimelineWorkflow(
  build: TimelinePromptBuildResult
): Pick<TimelineWorkflow, "errors" | "warnings" | "status"> {
  return {
    status: build.valid ? "queued" : "blocked",
    errors: [...build.errors],
    warnings: [...build.warnings],
  };
}

