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

type TimelineEventLifecycleFile = {
  schemaVersion: 1;
  savedAt: string;
  drafts: TimelineEventDraft[];
};

export class TimelineEventLifecycleService {
  readonly engine: TimelineEventLifecycleEngine;
  private initialized = false;
  private writeQueue: Promise<void> = Promise.resolve();

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
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.drafts)) {
        throw new Error("Timeline lifecycle file has an unsupported format.");
      }
      this.engine.restoreDrafts(parsed.drafts);
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
    await this.save();
    return result;
  }

  async activateDraft(input: {
    draftId: TimelineId;
    workspace: TimelineWorkspace;
    activatedBy: TimelineUserId;
  }): Promise<TimelineEventLifecycleResult> {
    await this.initialize();
    const result = this.engine.activateDraft(input);
    if (result.accepted) this.engine.removeDraft(input.draftId);
    await this.save();
    return result;
  }

  async snapshot(
    projectId?: TimelineId,
  ): Promise<TimelineEventHoldingSnapshot> {
    await this.initialize();
    return this.engine.getHoldingSnapshot(projectId);
  }

  async getDraft(draftId: TimelineId): Promise<TimelineEventDraft | null> {
    await this.initialize();
    return this.engine.getDraft(draftId);
  }

  private async save(): Promise<void> {
    const operation = async () => {
      const payload: TimelineEventLifecycleFile = {
        schemaVersion: 1,
        savedAt: new Date().toISOString(),
        drafts: this.engine.exportDrafts(),
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
