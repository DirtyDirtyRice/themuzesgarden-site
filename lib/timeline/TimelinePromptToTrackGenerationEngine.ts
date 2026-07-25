import {
  TimelineAudioProcessingQueueEngine,
  type TimelineAudioArtifact,
  type TimelineAudioProcessingArchive,
} from "./TimelineAudioProcessingQueueEngine";
import {
  TimelineRightsProvenanceEngine,
  type TimelineRightsArchive,
  type TimelineRightsIssue,
} from "./TimelineRightsProvenanceEngine";
import type {
  TimelineId,
  TimelineProjectId,
  TimelineTrackId,
  TimelineUserId,
} from "./TimelineTypes";

export type TimelinePromptToTrackStatus =
  | "held-rights"
  | "queued"
  | "running"
  | "awaiting-review"
  | "active"
  | "rejected"
  | "failed"
  | "stale";

export type TimelinePromptToTrackWorkflow = {
  id: TimelineId;
  projectId: TimelineProjectId;
  trackId: TimelineTrackId;
  rightsRecordId: TimelineId;
  baseRevisionId: TimelineId | null;
  revisionId: TimelineId | null;
  jobId: TimelineId | null;
  status: TimelinePromptToTrackStatus;
  prompt: string;
  provider: string;
  model: string;
  requestId: string;
  seed?: string;
  outputFormat: "wav" | "flac" | "mp3" | "midi";
  issues: Array<TimelineRightsIssue | { code: string; message: string }>;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
};

export type TimelinePromptToTrackReceipt = {
  id: TimelineId;
  workflowId: TimelineId;
  outcome:
    | "held-rights"
    | "queued"
    | "generated"
    | "activated"
    | "rejected"
    | "failed"
    | "stale";
  revisionId: TimelineId | null;
  jobId: TimelineId | null;
  recordedAt: string;
  recordedBy: TimelineUserId;
  message: string;
};

export type TimelinePromptToTrackArchive = {
  audio: TimelineAudioProcessingArchive;
  rights: TimelineRightsArchive;
  workflows: TimelinePromptToTrackWorkflow[];
  receipts: TimelinePromptToTrackReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class TimelinePromptToTrackGenerationEngine {
  private readonly workflows = new Map<
    TimelineId,
    TimelinePromptToTrackWorkflow
  >();
  private readonly receipts: TimelinePromptToTrackReceipt[] = [];
  private workflowSequence = 0;
  private receiptSequence = 0;

  constructor(
    readonly audio = new TimelineAudioProcessingQueueEngine(),
    readonly rights = new TimelineRightsProvenanceEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  request(input: {
    projectId: TimelineProjectId;
    trackId: TimelineTrackId;
    rightsRecordId: TimelineId;
    prompt: string;
    provider: string;
    model: string;
    requestId: string;
    seed?: string;
    outputFormat?: "wav" | "flac" | "mp3" | "midi";
    requestedBy: TimelineUserId;
  }): TimelinePromptToTrackWorkflow {
    const track = this.audio.revisions.tracks.getTrack(input.trackId);
    if (!track) throw new Error(`Track ${input.trackId} was not found.`);
    if (track.projectId !== input.projectId) {
      throw new Error("Track belongs to a different project.");
    }
    const now = this.now().toISOString();
    const workflow: TimelinePromptToTrackWorkflow = {
      id: `timeline-prompt-track-workflow-${++this.workflowSequence}`,
      projectId: input.projectId,
      trackId: input.trackId,
      rightsRecordId: input.rightsRecordId,
      baseRevisionId:
        this.audio.revisions.getActiveRevision(input.trackId)?.id ?? null,
      revisionId: null,
      jobId: null,
      status: "held-rights",
      prompt: input.prompt.trim(),
      provider: input.provider.trim(),
      model: input.model.trim(),
      requestId: input.requestId.trim(),
      seed: input.seed?.trim(),
      outputFormat: input.outputFormat ?? "wav",
      issues: [],
      createdAt: now,
      createdBy: input.requestedBy,
      updatedAt: now,
      updatedBy: input.requestedBy,
    };
    const rights = this.rights.getRecord(input.rightsRecordId);
    const issues: TimelinePromptToTrackWorkflow["issues"] = [];
    if (!rights || rights.projectId !== input.projectId) {
      issues.push({
        code: "rights-record-not-found",
        message: "A project-matching rights record is required.",
      });
    } else if (rights.state !== "cleared") {
      issues.push(...this.rights.inspect(rights));
      if (!issues.length) {
        issues.push({
          code: "rights-not-cleared",
          message: "Rights review must clear this generation source.",
        });
      }
    }
    if (
      !workflow.prompt ||
      !workflow.provider ||
      !workflow.model ||
      !workflow.requestId
    ) {
      issues.push({
        code: "prompt-provenance-incomplete",
        message:
          "Prompt, provider, model, and provider request ID are required.",
      });
    }
    if (issues.length) {
      workflow.issues = clone(issues);
      this.workflows.set(workflow.id, clone(workflow));
      this.record(
        workflow,
        "held-rights",
        input.requestedBy,
        issues[0].message,
      );
      return clone(workflow);
    }
    const draft = this.audio.revisions.createDraft({
      trackId: input.trackId,
      parentRevisionId: workflow.baseRevisionId ?? undefined,
      branchName: "ai-generation",
      label: `AI generation ${workflow.id}`,
      description: workflow.prompt,
      source: "ai-generation",
      aiPrompt: {
        prompt: workflow.prompt,
        provider: workflow.provider,
        model: workflow.model,
        requestId: workflow.requestId,
        seed: workflow.seed,
        generatedAt: now,
      },
      createdBy: input.requestedBy,
    });
    if (!draft.revision) {
      workflow.issues = clone(draft.issues);
      this.workflows.set(workflow.id, clone(workflow));
      return clone(workflow);
    }
    this.audio.revisions.addOperation({
      revisionId: draft.revision.id,
      kind: "prompt",
      description: workflow.prompt,
      parameters: {
        provider: workflow.provider,
        model: workflow.model,
        requestId: workflow.requestId,
      },
      createdBy: input.requestedBy,
    });
    const job = this.audio.createJob({
      revisionId: draft.revision.id,
      kind: "ai-generate",
      outputSpecification: {
        format: workflow.outputFormat,
        sampleRate: workflow.outputFormat === "midi" ? undefined : 48_000,
        bitDepth: workflow.outputFormat === "midi" ? undefined : 24,
        channels: workflow.outputFormat === "midi" ? undefined : 2,
      },
      createdBy: input.requestedBy,
    });
    if (!job.job) {
      workflow.revisionId = draft.revision.id;
      workflow.issues = clone(job.issues);
      this.workflows.set(workflow.id, clone(workflow));
      return clone(workflow);
    }
    this.audio.enqueue({ jobId: job.job.id, queuedBy: input.requestedBy });
    workflow.revisionId = draft.revision.id;
    workflow.jobId = job.job.id;
    workflow.status = "queued";
    workflow.updatedAt = this.now().toISOString();
    this.workflows.set(workflow.id, clone(workflow));
    this.record(
      workflow,
      "queued",
      input.requestedBy,
      "Generation job passed prompt and rights gates.",
    );
    return clone(workflow);
  }

  claimNext(input: {
    workerId: string;
    leaseMilliseconds: number;
  }): TimelinePromptToTrackWorkflow | null {
    const job = this.audio.claimNext(input);
    if (!job) return null;
    const workflow = this.byJob(job.id);
    const running = this.update(workflow, {
      status: "running",
      updatedAt: this.now().toISOString(),
      updatedBy: input.workerId,
    });
    return running;
  }

  complete(input: {
    workflowId: TimelineId;
    workerId: string;
    output: TimelineAudioArtifact;
  }): TimelinePromptToTrackWorkflow {
    const workflow = this.required(input.workflowId);
    if (workflow.status !== "running" || !workflow.jobId) {
      throw new Error("Only a running generation workflow can complete.");
    }
    const result = this.audio.complete({
      jobId: workflow.jobId,
      workerId: input.workerId,
      output: input.output,
    });
    if (!result.accepted) {
      return this.update(workflow, {
        status: "failed",
        issues: clone(result.issues),
        updatedAt: this.now().toISOString(),
        updatedBy: input.workerId,
      });
    }
    const awaiting = this.update(workflow, {
      status: "awaiting-review",
      updatedAt: this.now().toISOString(),
      updatedBy: input.workerId,
    });
    this.record(
      awaiting,
      "generated",
      input.workerId,
      "Output is attached to a draft and held for human review.",
    );
    return awaiting;
  }

  review(input: {
    workflowId: TimelineId;
    decision: "accept" | "reject";
    reviewedBy: TimelineUserId;
  }): TimelinePromptToTrackWorkflow {
    const workflow = this.required(input.workflowId);
    if (workflow.status !== "awaiting-review" || !workflow.revisionId) {
      throw new Error("Only generated output awaiting review can be decided.");
    }
    const reviewedAt = this.now().toISOString();
    if (input.decision === "reject") {
      this.audio.revisions.moveToTrash({
        revisionId: workflow.revisionId,
        deletedBy: input.reviewedBy,
      });
      const rejected = this.update(workflow, {
        status: "rejected",
        reviewedAt,
        reviewedBy: input.reviewedBy,
        updatedAt: reviewedAt,
        updatedBy: input.reviewedBy,
      });
      this.record(
        rejected,
        "rejected",
        input.reviewedBy,
        "Human reviewer rejected generated output.",
      );
      return rejected;
    }
    const rights = this.rights.getRecord(workflow.rightsRecordId);
    if (!rights || rights.state !== "cleared") {
      return this.update(workflow, {
        status: "held-rights",
        issues: rights
          ? clone(this.rights.inspect(rights))
          : [
              {
                code: "rights-record-not-found",
                message: "Rights record is no longer available.",
              },
            ],
        reviewedAt,
        reviewedBy: input.reviewedBy,
        updatedAt: reviewedAt,
        updatedBy: input.reviewedBy,
      });
    }
    const active =
      this.audio.revisions.getActiveRevision(workflow.trackId)?.id ?? null;
    if (active !== workflow.baseRevisionId) {
      const stale = this.update(workflow, {
        status: "stale",
        reviewedAt,
        reviewedBy: input.reviewedBy,
        updatedAt: reviewedAt,
        updatedBy: input.reviewedBy,
      });
      this.record(
        stale,
        "stale",
        input.reviewedBy,
        "Track changed after generation began; output was not activated.",
      );
      return stale;
    }
    const validation = this.audio.revisions.validate({
      revisionId: workflow.revisionId,
      validatedBy: input.reviewedBy,
    });
    if (!validation.accepted) {
      return this.update(workflow, {
        status: "failed",
        issues: clone(validation.issues),
        reviewedAt,
        reviewedBy: input.reviewedBy,
        updatedAt: reviewedAt,
        updatedBy: input.reviewedBy,
      });
    }
    const activation = this.audio.revisions.activate({
      revisionId: workflow.revisionId,
      activatedBy: input.reviewedBy,
    });
    if (!activation.accepted) {
      return this.update(workflow, {
        status: "failed",
        issues: clone(activation.issues),
        reviewedAt,
        reviewedBy: input.reviewedBy,
        updatedAt: reviewedAt,
        updatedBy: input.reviewedBy,
      });
    }
    const activeWorkflow = this.update(workflow, {
      status: "active",
      reviewedAt,
      reviewedBy: input.reviewedBy,
      updatedAt: reviewedAt,
      updatedBy: input.reviewedBy,
    });
    this.record(
      activeWorkflow,
      "activated",
      input.reviewedBy,
      "Rights, track head, revision, and human review gates passed.",
    );
    return activeWorkflow;
  }

  fail(input: {
    workflowId: TimelineId;
    workerId: string;
    message: string;
  }): TimelinePromptToTrackWorkflow {
    const workflow = this.required(input.workflowId);
    if (!workflow.jobId) throw new Error("Workflow has no generation job.");
    this.audio.fail({
      jobId: workflow.jobId,
      workerId: input.workerId,
      message: input.message,
    });
    const failed = this.update(workflow, {
      status: "failed",
      issues: [{ code: "generation-failed", message: input.message }],
      updatedAt: this.now().toISOString(),
      updatedBy: input.workerId,
    });
    this.record(failed, "failed", input.workerId, input.message);
    return failed;
  }

  getWorkflow(workflowId: TimelineId): TimelinePromptToTrackWorkflow | null {
    const workflow = this.workflows.get(workflowId);
    return workflow ? clone(workflow) : null;
  }

  listWorkflows(trackId?: TimelineTrackId): TimelinePromptToTrackWorkflow[] {
    return Array.from(this.workflows.values())
      .filter((workflow) => !trackId || workflow.trackId === trackId)
      .map(clone);
  }

  receiptHistory(): TimelinePromptToTrackReceipt[] {
    return this.receipts.map(clone);
  }

  exportArchive(): TimelinePromptToTrackArchive {
    return {
      audio: this.audio.exportArchive(),
      rights: this.rights.exportArchive(),
      workflows: this.listWorkflows(),
      receipts: this.receiptHistory(),
    };
  }

  restoreArchive(archive: TimelinePromptToTrackArchive): void {
    const workflowIds = new Set<TimelineId>();
    const receiptIds = new Set<TimelineId>();
    archive.workflows.forEach((workflow) => {
      if (workflowIds.has(workflow.id))
        throw new Error(
          `Duplicate prompt-to-track workflow ID ${workflow.id}.`,
        );
      workflowIds.add(workflow.id);
    });
    archive.receipts.forEach((receipt) => {
      if (receiptIds.has(receipt.id))
        throw new Error(`Duplicate prompt-to-track receipt ID ${receipt.id}.`);
      if (!workflowIds.has(receipt.workflowId)) {
        throw new Error(`Receipt ${receipt.id} has no workflow.`);
      }
      receiptIds.add(receipt.id);
    });
    this.audio.restoreArchive(archive.audio);
    this.rights.restoreArchive(archive.rights);
    this.workflows.clear();
    this.receipts.splice(0);
    archive.workflows.forEach((workflow) =>
      this.workflows.set(workflow.id, clone(workflow)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    this.workflowSequence = this.maxSequence(workflowIds);
    this.receiptSequence = this.maxSequence(receiptIds);
  }

  private required(workflowId: TimelineId): TimelinePromptToTrackWorkflow {
    const workflow = this.workflows.get(workflowId);
    if (!workflow)
      throw new Error(`Prompt-to-track workflow ${workflowId} was not found.`);
    return clone(workflow);
  }

  private byJob(jobId: TimelineId): TimelinePromptToTrackWorkflow {
    const workflow = Array.from(this.workflows.values()).find(
      (candidate) => candidate.jobId === jobId,
    );
    if (!workflow) throw new Error(`No workflow owns audio job ${jobId}.`);
    return clone(workflow);
  }

  private update(
    workflow: TimelinePromptToTrackWorkflow,
    patch: Partial<TimelinePromptToTrackWorkflow>,
  ): TimelinePromptToTrackWorkflow {
    const next = clone({ ...workflow, ...patch });
    this.workflows.set(next.id, clone(next));
    return next;
  }

  private record(
    workflow: TimelinePromptToTrackWorkflow,
    outcome: TimelinePromptToTrackReceipt["outcome"],
    recordedBy: TimelineUserId,
    message: string,
  ): TimelinePromptToTrackReceipt {
    const receipt: TimelinePromptToTrackReceipt = {
      id: `timeline-prompt-track-receipt-${++this.receiptSequence}`,
      workflowId: workflow.id,
      outcome,
      revisionId: workflow.revisionId,
      jobId: workflow.jobId,
      recordedAt: this.now().toISOString(),
      recordedBy,
      message,
    };
    this.receipts.push(clone(receipt));
    return clone(receipt);
  }

  private maxSequence(ids: Set<TimelineId>): number {
    return Math.max(
      0,
      ...Array.from(ids).map((id) => Number(id.match(/(\d+)$/)?.[1] ?? 0)),
    );
  }
}

export const timelinePromptToTrackGenerationEngine =
  new TimelinePromptToTrackGenerationEngine();
