import type { TimelineId, TimelineProjectId, TimelineUserId } from "./TimelineTypes";
import {
  TimelineDawSessionCoordinator,
  type TimelineDawSession,
  type TimelineDawSessionArchive,
} from "./TimelineDawSessionCoordinator";

export type TimelineDawWorkspaceDocument = {
  revision: number;
  archive: TimelineDawSessionArchive;
  updatedAt: string;
};

export interface TimelineDawWorkspaceStore {
  load(): Promise<TimelineDawWorkspaceDocument | null>;
  save(document: TimelineDawWorkspaceDocument, expectedRevision: number): Promise<void>;
}

export class TimelineDawWorkspaceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimelineDawWorkspaceConflictError";
  }
}

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryTimelineDawWorkspaceStore implements TimelineDawWorkspaceStore {
  private document: TimelineDawWorkspaceDocument | null = null;

  async load(): Promise<TimelineDawWorkspaceDocument | null> {
    return clone(this.document);
  }

  async save(document: TimelineDawWorkspaceDocument, expectedRevision: number): Promise<void> {
    const currentRevision = this.document?.revision ?? 0;
    if (currentRevision !== expectedRevision) {
      throw new TimelineDawWorkspaceConflictError(
        `DAW workspace storage conflict: expected ${expectedRevision}, current ${currentRevision}.`,
      );
    }
    if (document.revision !== expectedRevision + 1) {
      throw new Error("DAW workspace document revision must advance exactly once.");
    }
    this.document = clone(document);
  }
}

export type TimelineDawWorkspaceCommand =
  | {
      action: "open";
      projectId: TimelineProjectId;
      songId: TimelineId;
      name: string;
      expectedWorkspaceRevision: number;
    }
  | {
      action: "validate" | "activate" | "suspend" | "resume" | "close";
      sessionId: TimelineId;
      expectedSessionRevision: number;
      expectedWorkspaceRevision: number;
    };

export type TimelineDawWorkspaceReceipt = {
  id: TimelineId;
  action: TimelineDawWorkspaceCommand["action"];
  session: TimelineDawSession;
  workspaceRevision: number;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export class TimelineDawWorkspaceService {
  private queue: Promise<void> = Promise.resolve();
  private receiptSequence = 0;

  constructor(
    private readonly store: TimelineDawWorkspaceStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(command: TimelineDawWorkspaceCommand, actorId: TimelineUserId): Promise<TimelineDawWorkspaceReceipt> {
    const operation = this.queue.then(() => this.executeSerial(command, this.required(actorId, "Actor identity")));
    this.queue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async list(actorId: TimelineUserId, projectId?: TimelineProjectId): Promise<TimelineDawSession[]> {
    const ownerId = this.required(actorId, "Actor identity");
    await this.queue;
    const document = await this.store.load();
    if (!document) return [];
    const coordinator = new TimelineDawSessionCoordinator();
    coordinator.restoreArchive(document.archive);
    return coordinator.list({ ownerId, projectId, includeClosed: true });
  }

  async get(actorId: TimelineUserId, sessionId: TimelineId): Promise<TimelineDawSession | null> {
    const ownerId = this.required(actorId, "Actor identity");
    await this.queue;
    const document = await this.store.load();
    if (!document) return null;
    const coordinator = new TimelineDawSessionCoordinator();
    coordinator.restoreArchive(document.archive);
    const session = coordinator.get(sessionId);
    if (session && session.ownerId !== ownerId) throw new Error("DAW session access is limited to its owner.");
    return session;
  }

  private async executeSerial(
    command: TimelineDawWorkspaceCommand,
    actorId: TimelineUserId,
  ): Promise<TimelineDawWorkspaceReceipt> {
    const document = await this.store.load();
    const currentRevision = document?.revision ?? 0;
    if (currentRevision !== command.expectedWorkspaceRevision) {
      throw new TimelineDawWorkspaceConflictError(
        `DAW workspace revision conflict: expected ${command.expectedWorkspaceRevision}, current ${currentRevision}.`,
      );
    }
    const coordinator = new TimelineDawSessionCoordinator();
    if (document) coordinator.restoreArchive(document.archive);
    let session: TimelineDawSession;
    if (command.action === "open") {
      session = coordinator.open({
        projectId: command.projectId,
        songId: command.songId,
        ownerId: actorId,
        name: command.name,
      });
    } else {
      const current = coordinator.get(command.sessionId);
      if (!current) throw new Error(`DAW session ${command.sessionId} was not found.`);
      if (current.ownerId !== actorId) throw new Error("Only the DAW session owner can change it.");
      const args = [command.sessionId, command.expectedSessionRevision, actorId] as const;
      session = command.action === "validate" ? coordinator.validate(...args)
        : command.action === "activate" ? coordinator.activate(...args)
        : command.action === "suspend" ? coordinator.suspend(...args)
        : command.action === "resume" ? coordinator.resume(...args)
        : coordinator.close(...args);
    }
    const nextRevision = currentRevision + 1;
    const recordedAt = this.now().toISOString();
    await this.store.save({
      revision: nextRevision,
      archive: coordinator.exportArchive(),
      updatedAt: recordedAt,
    }, currentRevision);
    return {
      id: `timeline-daw-workspace-receipt-${++this.receiptSequence}`,
      action: command.action,
      session,
      workspaceRevision: nextRevision,
      recordedAt,
      recordedBy: actorId,
    };
  }

  private required(value: string, label: string): string {
    const normalized = value.trim();
    if (!normalized) throw new Error(`${label} is required.`);
    return normalized;
  }
}
