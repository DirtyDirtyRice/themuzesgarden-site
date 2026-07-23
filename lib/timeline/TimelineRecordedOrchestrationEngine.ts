import type {
  TimelineAIExecution,
  TimelineAIProposal,
} from "./TimelineAIEngine";
import type {
  TimelineActionPlan,
  TimelineActionReceipt,
} from "./TimelineActionEngine";
import {
  TimelineOrchestrationEngine,
  type TimelineWorkflow,
  type TimelineWorkflowApplication,
  type TimelineWorkflowReview,
  type TimelineWorkflowStartInput,
} from "./TimelineOrchestrationEngine";
import {
  TimelineWorkflowLedger,
  type TimelineWorkflowLedgerRecord,
  type TimelineWorkflowLedgerSnapshot,
} from "./TimelineWorkflowLedger";
import type {
  TimelineId,
  TimelineProjectId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineRecordedWorkflowResult<T> = {
  result: T;
  ledgerRecord: TimelineWorkflowLedgerRecord;
};

export type TimelineRecordedOrchestrationPricing = {
  inputTokenRatePerMillion: number;
  outputTokenRatePerMillion: number;
};

export type TimelineRecordedOrchestrationOptions = {
  pricing?: TimelineRecordedOrchestrationPricing;
};

type WorkflowEvidence = {
  workflow: TimelineWorkflow;
  execution: TimelineAIExecution | null;
  proposals: TimelineAIProposal[];
  actionPlan: TimelineActionPlan | null;
  receipt: TimelineActionReceipt | null;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class TimelineRecordedOrchestrationEngine {
  private initialized = false;
  private initialization: Promise<TimelineWorkflowLedgerSnapshot> | null = null;

  constructor(
    readonly orchestration: TimelineOrchestrationEngine,
    readonly ledger: TimelineWorkflowLedger,
    private readonly options: TimelineRecordedOrchestrationOptions = {}
  ) {}

  async initialize(): Promise<TimelineWorkflowLedgerSnapshot> {
    if (!this.initialization) {
      this.initialization = this.ledger.initialize().then((snapshot) => {
        this.recoverFromLedger();
        this.initialized = true;
        return snapshot;
      });
    }
    return this.initialization;
  }

  async start(
    input: TimelineWorkflowStartInput
  ): Promise<TimelineRecordedWorkflowResult<TimelineWorkflow>> {
    await this.ensureInitialized();
    const workflow = this.orchestration.start(input);
    const ledgerRecord = await this.recordWorkflow(
      workflow,
      input.createdBy
    );
    return { result: workflow, ledgerRecord };
  }

  async execute(
    workflowId: TimelineId
  ): Promise<TimelineRecordedWorkflowResult<TimelineWorkflowReview>> {
    await this.ensureInitialized();
    try {
      const review = await this.orchestration.execute(workflowId);
      const ledgerRecord = await this.recordEvidence(
        {
          workflow: review.workflow,
          execution: review.execution,
          proposals: review.proposals,
          actionPlan: review.actionPlan,
          receipt: this.receiptFor(review.workflow),
        },
        "engine"
      );
      return { result: clone(review), ledgerRecord };
    } catch (error) {
      await this.recordCurrentFailure(workflowId, error);
      throw error;
    }
  }

  async approve(
    workflowId: TimelineId,
    reviewedBy: TimelineUserId
  ): Promise<TimelineRecordedWorkflowResult<TimelineWorkflowReview>> {
    await this.ensureInitialized();
    try {
      const review = this.orchestration.approve(workflowId, reviewedBy);
      const ledgerRecord = await this.recordEvidence(
        {
          workflow: review.workflow,
          execution: review.execution,
          proposals: review.proposals,
          actionPlan: review.actionPlan,
          receipt: null,
        },
        reviewedBy
      );
      return { result: clone(review), ledgerRecord };
    } catch (error) {
      await this.recordCurrentFailure(workflowId, error, reviewedBy);
      throw error;
    }
  }

  async reject(
    workflowId: TimelineId,
    reviewedBy: TimelineUserId,
    reason: string
  ): Promise<TimelineRecordedWorkflowResult<TimelineWorkflow>> {
    await this.ensureInitialized();
    const workflow = this.orchestration.reject(workflowId, reviewedBy, reason);
    const ledgerRecord = await this.recordWorkflow(workflow, reviewedBy);
    return { result: workflow, ledgerRecord };
  }

  async apply(
    workflowId: TimelineId,
    currentWorkspace: TimelineWorkspace,
    appliedBy: TimelineUserId
  ): Promise<TimelineRecordedWorkflowResult<TimelineWorkflowApplication>> {
    await this.ensureInitialized();
    try {
      const application = this.orchestration.apply(
        workflowId,
        currentWorkspace,
        appliedBy
      );
      const ledgerRecord = await this.recordEvidence(
        {
          workflow: application.workflow,
          execution: this.executionFor(application.workflow),
          proposals: this.proposalsFor(application.workflow),
          actionPlan: this.planFor(application.workflow),
          receipt: application.receipt,
        },
        appliedBy
      );
      return { result: clone(application), ledgerRecord };
    } catch (error) {
      await this.recordCurrentFailure(workflowId, error, appliedBy);
      throw error;
    }
  }

  async revert(
    workflowId: TimelineId,
    revertedBy: TimelineUserId
  ): Promise<TimelineRecordedWorkflowResult<TimelineWorkflowApplication>> {
    await this.ensureInitialized();
    const application = this.orchestration.revert(workflowId, revertedBy);
    const ledgerRecord = await this.recordEvidence(
      {
        workflow: application.workflow,
        execution: this.executionFor(application.workflow),
        proposals: this.proposalsFor(application.workflow),
        actionPlan: this.planFor(application.workflow),
        receipt: application.receipt,
      },
      revertedBy
    );
    return { result: clone(application), ledgerRecord };
  }

  async cancel(
    workflowId: TimelineId,
    actor: TimelineUserId
  ): Promise<TimelineRecordedWorkflowResult<TimelineWorkflow>> {
    await this.ensureInitialized();
    const workflow = this.orchestration.cancel(workflowId, actor);
    const ledgerRecord = await this.recordWorkflow(workflow, actor);
    return { result: workflow, ledgerRecord };
  }

  getWorkflow(workflowId: TimelineId): TimelineWorkflow | null {
    return this.orchestration.getWorkflow(workflowId);
  }

  listWorkflows(projectId?: TimelineProjectId): TimelineWorkflow[] {
    return this.orchestration.listWorkflows(projectId);
  }

  private async recordWorkflow(
    workflow: TimelineWorkflow,
    recordedBy: TimelineUserId | "engine"
  ): Promise<TimelineWorkflowLedgerRecord> {
    return this.recordEvidence(
      {
        workflow,
        execution: this.executionFor(workflow),
        proposals: this.proposalsFor(workflow),
        actionPlan: this.planFor(workflow),
        receipt: this.receiptFor(workflow),
      },
      recordedBy
    );
  }

  private async recordEvidence(
    evidence: WorkflowEvidence,
    recordedBy: TimelineUserId | "engine"
  ): Promise<TimelineWorkflowLedgerRecord> {
    return this.ledger.record({
      workflow: evidence.workflow,
      baselineWorkspace: this.orchestration.getBaselineWorkspace(
        evidence.workflow.id
      ),
      transitions: this.orchestration.getTransitions(evidence.workflow.id),
      execution: evidence.execution,
      proposals: evidence.proposals,
      actionPlan: evidence.actionPlan,
      receipt: evidence.receipt,
      recordedBy,
      pricing: this.options.pricing,
    });
  }

  private async recordCurrentFailure(
    workflowId: TimelineId,
    error: unknown,
    recordedBy: TimelineUserId | "engine" = "engine"
  ): Promise<void> {
    const workflow = this.orchestration.getWorkflow(workflowId);
    if (!workflow) return;
    const message = error instanceof Error ? error.message : "Unknown workflow error.";
    const recordedWorkflow: TimelineWorkflow = {
      ...workflow,
      errors: workflow.errors.includes(message)
        ? [...workflow.errors]
        : [...workflow.errors, message],
    };
    await this.recordWorkflow(recordedWorkflow, recordedBy);
  }

  private executionFor(workflow: TimelineWorkflow): TimelineAIExecution | null {
    if (!workflow.executionId) return null;
    return this.orchestration.aiEngine.getExecution(workflow.executionId);
  }

  private proposalsFor(workflow: TimelineWorkflow): TimelineAIProposal[] {
    if (!workflow.executionId) return [];
    return this.orchestration.aiEngine.listProposals(workflow.executionId);
  }

  private planFor(workflow: TimelineWorkflow): TimelineActionPlan | null {
    if (!workflow.actionPlanId) return null;
    return this.orchestration.actionEngine.getPlan(workflow.actionPlanId);
  }

  private receiptFor(workflow: TimelineWorkflow): TimelineActionReceipt | null {
    if (!workflow.receiptId) return null;
    return this.orchestration.actionEngine.getReceipt(workflow.receiptId);
  }

  private recoverFromLedger(): void {
    const latest = new Map<string, TimelineWorkflowLedgerRecord>();
    for (const record of this.ledger.exportDocument().records) {
      latest.set(record.workflowId, record);
    }
    for (const record of latest.values()) {
      if (!record.baselineWorkspace) continue;
      if (["queued", "running"].includes(record.workflow.status)) continue;
      this.orchestration.restore({
        workflow: record.workflow,
        baselineWorkspace: record.baselineWorkspace,
        transitions: record.transitions,
        execution: record.execution,
        proposals: record.proposals,
        actionPlan: record.actionPlan,
        receipt: record.receipt,
      });
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize();
  }
}

