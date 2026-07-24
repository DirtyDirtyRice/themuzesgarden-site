import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  TimelineEventLifecycleEngine,
  type TimelineEventDraft,
  type TimelineEventDraftPatch,
  type TimelineEventHoldingSnapshot,
  type TimelineEventLifecycleResult,
} from "./TimelineEventLifecycleEngine";
import {
  TimelineAIEventIntakeEngine,
  type TimelineAIEventIntakeResult,
} from "./TimelineAIEventIntakeEngine";
import type { TimelineAIProposal } from "./TimelineAIEngine";
import {
  TimelineEventDependencyEngine,
  type TimelineEventDependency,
  type TimelineEventDependencyPlan,
  type TimelineEventDependencyImpact,
} from "./TimelineEventDependencyEngine";
import type {
  TimelineId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineEventEvidenceIssue = {
  code: string;
  message: string;
  path?: string;
};

export type TimelineEventEvidenceRecord = {
  id: TimelineId;
  projectId: TimelineId;
  draftId: TimelineId;
  eventId: TimelineId;
  originEventId?: TimelineId;
  action:
    | "begin-edit"
    | "validation"
    | "activation"
    | "ai-intake"
    | "dependency-activation";
  outcome: "prevented" | "validated" | "activated" | "edit-held";
  lifecycle: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
  issues: TimelineEventEvidenceIssue[];
};

export type TimelineEventLifecycleServiceSnapshot =
  TimelineEventHoldingSnapshot & {
    evidence: TimelineEventEvidenceRecord[];
    evidenceCount: number;
    successfulActivationCount: number;
    dependencies: TimelineEventDependency[];
  };

type TimelineEventLifecycleFile = {
  schemaVersion: 1 | 2 | 3;
  savedAt: string;
  drafts: TimelineEventDraft[];
  evidence?: TimelineEventEvidenceRecord[];
  dependencies?: TimelineEventDependency[];
};

export class TimelineEventLifecycleService {
  readonly engine: TimelineEventLifecycleEngine;
  readonly dependencyEngine: TimelineEventDependencyEngine;
  private initialized = false;
  private writeQueue: Promise<void> = Promise.resolve();
  private evidence: TimelineEventEvidenceRecord[] = [];
  private evidenceSequence = 0;

  constructor(
    private readonly filePath: string,
    engine = new TimelineEventLifecycleEngine(),
    dependencyEngine = new TimelineEventDependencyEngine(),
  ) {
    this.engine = engine;
    this.dependencyEngine = dependencyEngine;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      const parsed = JSON.parse(
        await readFile(this.filePath, "utf8"),
      ) as TimelineEventLifecycleFile;
      if (
        ![1, 2, 3].includes(parsed.schemaVersion) ||
        !Array.isArray(parsed.drafts) ||
        (parsed.evidence !== undefined && !Array.isArray(parsed.evidence)) ||
        (parsed.dependencies !== undefined &&
          !Array.isArray(parsed.dependencies))
      ) {
        throw new Error("Timeline lifecycle file has an unsupported format.");
      }
      this.engine.restoreDrafts(parsed.drafts);
      this.dependencyEngine.restore(parsed.dependencies ?? []);
      this.evidence = structuredClone(parsed.evidence ?? []);
      for (const record of this.evidence) {
        this.evidenceSequence = Math.max(
          this.evidenceSequence,
          Number(record.id.match(/(\d+)$/)?.[1] ?? 0),
        );
      }
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        error.code !== "ENOENT"
      ) {
        throw error;
      }
    }
    this.initialized = true;
  }

  async intakeAIProposal(input: {
    proposal: TimelineAIProposal;
    workspace: TimelineWorkspace;
    reviewedBy: TimelineUserId;
    model?: string;
    provider?: string;
  }): Promise<TimelineAIEventIntakeResult> {
    await this.initialize();
    const intake = new TimelineAIEventIntakeEngine(this.engine);
    const result = intake.intake(input);
    const reportIssues =
      result.draft?.lastValidationReport?.detailedIssues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      })) ?? [];
    this.record({
      projectId: input.workspace.projectId,
      draftId: result.draft?.id ?? `refused-ai-${input.proposal.id}`,
      eventId: result.draft?.event.id ?? "uncreated-ai-event",
      action: "ai-intake",
      outcome: result.acceptedForReview ? "validated" : "prevented",
      lifecycle: result.draft?.lifecycle ?? "incomplete",
      recordedBy: input.reviewedBy,
      issues: reportIssues.length ? reportIssues : result.issues,
    });
    await this.save();
    return result;
  }
  async createDraft(input: {
    workspace: TimelineWorkspace;
    createdBy: TimelineUserId;
    patch?: TimelineEventDraftPatch;
  }): Promise<TimelineEventDraft> {
    await this.initialize();
    const draft = this.engine.createDraft(input);
    await this.save();
    return draft;
  }

  async beginEdit(input: {
    workspace: TimelineWorkspace;
    eventId: TimelineId;
    createdBy: TimelineUserId;
  }): Promise<TimelineEventLifecycleResult> {
    await this.initialize();
    const result = this.engine.beginEdit(input);
    this.record({
      projectId: input.workspace.projectId,
      draftId: result.draft?.id ?? `refused-edit-${input.eventId}`,
      eventId: input.eventId,
      originEventId: input.eventId,
      action: "begin-edit",
      outcome: result.accepted ? "edit-held" : "prevented",
      lifecycle: result.lifecycle,
      recordedBy: input.createdBy,
      issues: result.issues,
    });
    await this.save();
    return result;
  }

  async updateDraft(
    draftId: TimelineId,
    patch: TimelineEventDraftPatch,
    updatedBy: TimelineUserId,
  ): Promise<TimelineEventDraft | null> {
    await this.initialize();
    const draft = this.engine.updateDraft(draftId, patch, updatedBy);
    if (draft) await this.save();
    return draft;
  }

  async validateDraft(input: {
    draftId: TimelineId;
    workspace: TimelineWorkspace;
    validatedBy: TimelineUserId;
  }): Promise<TimelineEventLifecycleResult> {
    await this.initialize();
    const result = this.engine.validateDraft(input);
    const reportIssues =
      result.draft?.lastValidationReport?.detailedIssues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        path: issue.path,
      })) ?? [];
    this.record({
      projectId: input.workspace.projectId,
      draftId: input.draftId,
      eventId: result.draft?.event.id ?? "unknown-event",
      originEventId: result.draft?.originEventId,
      action: "validation",
      outcome: result.accepted ? "validated" : "prevented",
      lifecycle: result.lifecycle,
      recordedBy: input.validatedBy,
      issues: reportIssues.length ? reportIssues : result.issues,
    });
    await this.save();
    return result;
  }

  async activateDraft(input: {
    draftId: TimelineId;
    workspace: TimelineWorkspace;
    activatedBy: TimelineUserId;
  }): Promise<TimelineEventLifecycleResult> {
    await this.initialize();
    const before = this.engine.getDraft(input.draftId);
    const activation = this.dependencyEngine.activate({
      ...input,
      lifecycle: this.engine,
      draftIds: [input.draftId],
    });
    let result: TimelineEventLifecycleResult;
    if (activation.accepted) {
      const activated = new Map(
        activation.results.map((item) => [item.draft?.id, item]),
      );
      for (const draftId of activation.activatedDraftIds) {
        const item = activated.get(draftId);
        const held = this.engine.getDraft(draftId);
        this.record({
          projectId: input.workspace.projectId,
          draftId,
          eventId: item?.draft?.event.id ?? held?.event.id ?? "unknown-event",
          originEventId: item?.draft?.originEventId ?? held?.originEventId,
          action:
            activation.activatedDraftIds.length > 1
              ? "dependency-activation"
              : "activation",
          outcome: "activated",
          lifecycle: "active",
          recordedBy: input.activatedBy,
          issues: [],
        });
        this.engine.removeDraft(draftId);
      }
      result =
        activation.results.find((item) => item.draft?.id === input.draftId) ??
        ({
          accepted: true,
          lifecycle: "active",
          draft: before,
          workspace: activation.workspace,
          issues: [],
        } satisfies TimelineEventLifecycleResult);
      result = { ...result, workspace: activation.workspace };
    } else {
      result = {
        accepted: false,
        lifecycle: before?.lifecycle ?? "incomplete",
        draft: before,
        workspace: activation.workspace,
        issues: activation.issues.map((issue) => ({
          code: "not-validated",
          message: issue.message,
        })),
      };
      this.record({
        projectId: input.workspace.projectId,
        draftId: input.draftId,
        eventId: before?.event.id ?? "unknown-event",
        originEventId: before?.originEventId,
        action: "dependency-activation",
        outcome: "prevented",
        lifecycle: result.lifecycle,
        recordedBy: input.activatedBy,
        issues: activation.issues,
      });
    }
    await this.save();
    return result;
  }

  async addDependency(input: {
    projectId: TimelineId;
    dependentEventId: TimelineId;
    requiredEventId: TimelineId;
    createdBy: TimelineUserId;
  }): Promise<TimelineEventDependency> {
    await this.initialize();
    const dependency = this.dependencyEngine.addDependency(input);
    await this.save();
    return dependency;
  }

  async removeDependency(
    dependencyId: TimelineId,
    projectId: TimelineId,
  ): Promise<boolean> {
    await this.initialize();
    const dependency = this.dependencyEngine
      .listDependencies(projectId)
      .find((item) => item.id === dependencyId);
    if (!dependency) return false;
    const removed = this.dependencyEngine.removeDependency(dependencyId);
    if (removed) await this.save();
    return removed;
  }

  async planDependencies(input: {
    workspace: TimelineWorkspace;
    draftIds?: TimelineId[];
  }): Promise<TimelineEventDependencyPlan> {
    await this.initialize();
    return this.dependencyEngine.plan({
      ...input,
      drafts: this.engine.exportDrafts(),
    });
  }

  async inspectDependencyImpact(input: {
    projectId: TimelineId;
    eventId: TimelineId;
  }): Promise<TimelineEventDependencyImpact> {
    await this.initialize();
    return this.dependencyEngine.impact({
      ...input,
      drafts: this.engine.exportDrafts(),
    });
  }

  async snapshot(
    projectId?: TimelineId,
  ): Promise<TimelineEventLifecycleServiceSnapshot> {
    await this.initialize();
    const holding = this.engine.getHoldingSnapshot(projectId);
    const evidence = this.evidence
      .filter((record) => !projectId || record.projectId === projectId)
      .slice(-200)
      .reverse()
      .map((record) => structuredClone(record));
    return {
      ...holding,
      preventedActivationCount: evidence.filter(
        (record) => record.outcome === "prevented",
      ).length,
      evidence,
      evidenceCount: evidence.length,
      successfulActivationCount: evidence.filter(
        (record) => record.outcome === "activated",
      ).length,
      dependencies: this.dependencyEngine.listDependencies(projectId),
    };
  }

  async getDraft(draftId: TimelineId): Promise<TimelineEventDraft | null> {
    await this.initialize();
    return this.engine.getDraft(draftId);
  }

  private record(
    input: Omit<TimelineEventEvidenceRecord, "id" | "recordedAt">,
  ): void {
    this.evidence.push({
      ...structuredClone(input),
      id: `timeline-event-evidence-${++this.evidenceSequence}`,
      recordedAt: new Date().toISOString(),
    });
  }

  private async save(): Promise<void> {
    const operation = async () => {
      const payload: TimelineEventLifecycleFile = {
        schemaVersion: 3,
        savedAt: new Date().toISOString(),
        drafts: this.engine.exportDrafts(),
        evidence: structuredClone(this.evidence),
        dependencies: this.dependencyEngine.listDependencies(),
      };
      const folder = dirname(this.filePath);
      const temporary = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      await mkdir(folder, { recursive: true });
      await writeFile(
        temporary,
        `${JSON.stringify(payload, null, 2)}\n`,
        "utf8",
      );
      await rename(temporary, this.filePath);
    };
    this.writeQueue = this.writeQueue.then(operation, operation);
    await this.writeQueue;
  }
}
