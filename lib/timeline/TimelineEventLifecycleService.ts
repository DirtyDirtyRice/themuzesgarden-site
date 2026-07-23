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
  action: "begin-edit" | "validation" | "activation";
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
  };

type TimelineEventLifecycleFile = {
  schemaVersion: 1 | 2;
  savedAt: string;
  drafts: TimelineEventDraft[];
  evidence?: TimelineEventEvidenceRecord[];
};

export class TimelineEventLifecycleService {
  readonly engine: TimelineEventLifecycleEngine;
  private initialized = false;
  private writeQueue: Promise<void> = Promise.resolve();
  private evidence: TimelineEventEvidenceRecord[] = [];
  private evidenceSequence = 0;

  constructor(
    private readonly filePath: string,
    engine = new TimelineEventLifecycleEngine(),
  ) {
    this.engine = engine;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      const parsed = JSON.parse(
        await readFile(this.filePath, "utf8"),
      ) as TimelineEventLifecycleFile;
      if (
        ![1, 2].includes(parsed.schemaVersion) ||
        !Array.isArray(parsed.drafts) ||
        (parsed.evidence !== undefined && !Array.isArray(parsed.evidence))
      ) {
        throw new Error("Timeline lifecycle file has an unsupported format.");
      }
      this.engine.restoreDrafts(parsed.drafts);
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
    const result = this.engine.activateDraft(input);
    this.record({
      projectId: input.workspace.projectId,
      draftId: input.draftId,
      eventId: result.draft?.event.id ?? before?.event.id ?? "unknown-event",
      originEventId: result.draft?.originEventId ?? before?.originEventId,
      action: "activation",
      outcome: result.accepted ? "activated" : "prevented",
      lifecycle: result.lifecycle,
      recordedBy: input.activatedBy,
      issues: result.issues,
    });
    if (result.accepted) this.engine.removeDraft(input.draftId);
    await this.save();
    return result;
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
        schemaVersion: 2,
        savedAt: new Date().toISOString(),
        drafts: this.engine.exportDrafts(),
        evidence: structuredClone(this.evidence),
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
