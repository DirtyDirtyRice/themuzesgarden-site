import { createHash } from "node:crypto";
import { TimelineDawSessionCoordinator } from "./TimelineDawSessionCoordinator";
import type {
  TimelineDawRecoveryCheckpoint,
  TimelineDawRecoveryCheckpointStore,
} from "./TimelineDawRecoveryCheckpointStore";
import {
  TimelineDawWorkspaceConflictError,
  type TimelineDawWorkspaceDocument,
  type TimelineDawWorkspaceStore,
} from "./TimelineDawWorkspaceService";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

type RecoveryPayload = {
  schema: "the-muzes-garden/daw-recovery/v1";
  ownerId: TimelineUserId;
  sessionId: TimelineId;
  workspaceRevision: number;
  capturedAt: string;
  archive: TimelineDawWorkspaceDocument["archive"];
};

export class TimelineDawRecoveryCheckpointService {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly workspaceStore: TimelineDawWorkspaceStore,
    private readonly checkpointStore: TimelineDawRecoveryCheckpointStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  snapshot(actorId: TimelineUserId, sessionId: TimelineId): Promise<{
    workspaceRevision: number;
    checkpoints: TimelineDawRecoveryCheckpoint[];
  }> {
    return this.queue.then(async () => {
      const document = await this.requiredDocument();
      this.requireOwner(document, actorId, sessionId);
      return {
        workspaceRevision: document.revision,
        checkpoints: structuredClone(document.archive.recovery?.[sessionId] ?? []),
      };
    });
  }

  capture(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    label: string;
    expectedWorkspaceRevision: number;
  }): Promise<{ workspaceRevision: number; checkpoint: TimelineDawRecoveryCheckpoint }> {
    return this.enqueue(() => this.captureSerial(input));
  }

  restore(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    checkpointId: TimelineId;
    expectedWorkspaceRevision: number;
  }): Promise<{ workspaceRevision: number; checkpoint: TimelineDawRecoveryCheckpoint }> {
    return this.enqueue(() => this.restoreSerial(input));
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  private async captureSerial(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    label: string;
    expectedWorkspaceRevision: number;
  }) {
    const document = await this.requiredDocument();
    this.expectRevision(document, input.expectedWorkspaceRevision);
    this.requireOwner(document, input.actorId, input.sessionId);
    const label = input.label.trim();
    if (!label) throw new Error("Recovery checkpoint label is required.");
    const existing = document.archive.recovery?.[input.sessionId] ?? [];
    const sequence = existing.reduce((highest, item) => {
      return Math.max(highest, Number(item.id.match(/(\d+)$/)?.[1] ?? 0));
    }, 0) + 1;
    const id = `timeline-daw-recovery-${sequence}`;
    const capturedAt = this.now().toISOString();
    const { recovery: _recovery, ...recoverableArchive } = document.archive;
    const payload: RecoveryPayload = {
      schema: "the-muzes-garden/daw-recovery/v1",
      ownerId: input.actorId,
      sessionId: input.sessionId,
      workspaceRevision: document.revision,
      capturedAt,
      archive: recoverableArchive,
    };
    const bytes = encoder.encode(JSON.stringify(payload));
    const checksum = this.checksum(bytes);
    const uri = await this.checkpointStore.save({
      ownerId: input.actorId,
      sessionId: input.sessionId,
      checkpointId: id,
      bytes,
    });
    const checkpoint: TimelineDawRecoveryCheckpoint = {
      id,
      ownerId: input.actorId,
      sessionId: input.sessionId,
      label,
      uri,
      byteLength: bytes.byteLength,
      checksum,
      workspaceRevision: document.revision,
      createdAt: capturedAt,
      createdBy: input.actorId,
    };
    const next = this.nextDocument(document, {
      ...document.archive,
      recovery: {
        ...document.archive.recovery,
        [input.sessionId]: [...existing, checkpoint],
      },
    });
    await this.workspaceStore.save(next, document.revision);
    return { workspaceRevision: next.revision, checkpoint };
  }

  private async restoreSerial(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    checkpointId: TimelineId;
    expectedWorkspaceRevision: number;
  }) {
    const document = await this.requiredDocument();
    this.expectRevision(document, input.expectedWorkspaceRevision);
    this.requireOwner(document, input.actorId, input.sessionId);
    const existing = document.archive.recovery?.[input.sessionId] ?? [];
    const checkpoint = existing.find((item) => item.id === input.checkpointId);
    if (!checkpoint || checkpoint.ownerId !== input.actorId) {
      throw new Error("Recovery checkpoint was not found.");
    }
    const bytes = await this.checkpointStore.load(checkpoint.uri);
    if (bytes.byteLength !== checkpoint.byteLength || this.checksum(bytes) !== checkpoint.checksum) {
      throw new Error("Recovery checkpoint integrity verification failed.");
    }
    const payload = this.parse(bytes);
    if (payload.ownerId !== input.actorId || payload.sessionId !== input.sessionId) {
      throw new Error("Recovery checkpoint identity verification failed.");
    }
    this.requireOwner({ ...document, archive: payload.archive }, input.actorId, input.sessionId);
    const restoredAt = this.now().toISOString();
    const restoredCheckpoint = {
      ...checkpoint,
      lastRestoredAt: restoredAt,
      lastRestoredBy: input.actorId,
    };
    const catalog = {
      ...document.archive.recovery,
      [input.sessionId]: existing.map((item) =>
        item.id === checkpoint.id ? restoredCheckpoint : item),
    };
    const next: TimelineDawWorkspaceDocument = {
      revision: document.revision + 1,
      archive: { ...payload.archive, recovery: catalog },
      updatedAt: restoredAt,
    };
    await this.workspaceStore.save(next, document.revision);
    return { workspaceRevision: next.revision, checkpoint: restoredCheckpoint };
  }

  private parse(bytes: Uint8Array): RecoveryPayload {
    let value: unknown;
    try { value = JSON.parse(decoder.decode(bytes)); }
    catch { throw new Error("Recovery checkpoint payload is invalid."); }
    if (
      !value || typeof value !== "object"
      || (value as RecoveryPayload).schema !== "the-muzes-garden/daw-recovery/v1"
      || !(value as RecoveryPayload).archive
    ) {
      throw new Error("Recovery checkpoint schema is invalid.");
    }
    return value as RecoveryPayload;
  }

  private checksum(bytes: Uint8Array): string {
    return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
  }

  private async requiredDocument(): Promise<TimelineDawWorkspaceDocument> {
    const document = await this.workspaceStore.load();
    if (!document) throw new Error("DAW workspace was not found.");
    return document;
  }

  private expectRevision(document: TimelineDawWorkspaceDocument, expected: number): void {
    if (document.revision !== expected) {
      throw new TimelineDawWorkspaceConflictError(
        `DAW workspace revision conflict: expected ${expected}, current ${document.revision}.`,
      );
    }
  }

  private requireOwner(
    document: TimelineDawWorkspaceDocument,
    actorId: TimelineUserId,
    sessionId: TimelineId,
  ) {
    const coordinator = new TimelineDawSessionCoordinator();
    coordinator.restoreArchive(document.archive);
    const session = coordinator.get(sessionId);
    if (!session || session.ownerId !== actorId) {
      throw new Error("DAW recovery access is limited to its session owner.");
    }
    return session;
  }

  private nextDocument(
    document: TimelineDawWorkspaceDocument,
    archive: TimelineDawWorkspaceDocument["archive"],
  ): TimelineDawWorkspaceDocument {
    return {
      revision: document.revision + 1,
      archive,
      updatedAt: this.now().toISOString(),
    };
  }
}
