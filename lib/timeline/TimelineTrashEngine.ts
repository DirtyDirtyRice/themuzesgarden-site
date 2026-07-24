import type {
  TimelineEvent,
  TimelineId,
  TimelineTrackId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineTrashState = "trashed" | "restored" | "purged";
export type TimelineTrashAction = "trash" | "restore" | "purge";

export type TimelineTrashAuditEntry = {
  id: TimelineId;
  action: TimelineTrashAction;
  at: string;
  by: TimelineUserId;
  reason: string;
};

export type TimelineTrashRecord = {
  id: TimelineId;
  projectId: TimelineId;
  eventId: TimelineId;
  eventTitle: string;
  originalTrackId: TimelineTrackId;
  originalIndex: number;
  state: TimelineTrashState;
  trashedAt: string;
  trashedBy: TimelineUserId;
  retentionUntil: string;
  restoredAt?: string;
  restoredBy?: TimelineUserId;
  purgedAt?: string;
  purgedBy?: TimelineUserId;
  event?: TimelineEvent;
  audit: TimelineTrashAuditEntry[];
};

export type TimelineTrashIssue = {
  code:
    | "event-not-found"
    | "event-locked"
    | "record-not-found"
    | "wrong-project"
    | "not-restorable"
    | "event-id-conflict"
    | "track-not-found"
    | "confirmation-required";
  message: string;
};

export type TimelineTrashResult = {
  accepted: boolean;
  workspace: TimelineWorkspace;
  record: TimelineTrashRecord | null;
  issues: TimelineTrashIssue[];
};

export type TimelineTrashSnapshot = {
  generatedAt: string;
  records: TimelineTrashRecord[];
  trashedCount: number;
  restoredCount: number;
  purgedCount: number;
  expiredCount: number;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function retentionDate(now: Date, retentionDays: number): string {
  const retained = new Date(now);
  retained.setUTCDate(retained.getUTCDate() + Math.max(1, retentionDays));
  return retained.toISOString();
}

export function permanentTimelineDeletionConfirmation(
  trashId: TimelineId,
): string {
  return `PERMANENTLY DELETE ${trashId}`;
}

export class TimelineTrashEngine {
  private readonly records = new Map<TimelineId, TimelineTrashRecord>();
  private sequence = 0;
  private auditSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  trashEvent(input: {
    workspace: TimelineWorkspace;
    eventId: TimelineId;
    trashedBy: TimelineUserId;
    reason: string;
    retentionDays?: number;
  }): TimelineTrashResult {
    const workspace = clone(input.workspace);
    const originalIndex = workspace.events.findIndex(
      (event) => event.id === input.eventId,
    );
    if (originalIndex < 0) {
      return this.refused(
        workspace,
        "event-not-found",
        "Timeline event was not found.",
      );
    }
    const event = workspace.events[originalIndex];
    if (event.locked) {
      return this.refused(
        workspace,
        "event-locked",
        "Locked Timeline events must be unlocked before moving them to Trash.",
      );
    }
    const now = this.now();
    const id = `timeline-trash-${++this.sequence}`;
    const reason = input.reason.trim() || "Removed from active Timeline";
    const audit: TimelineTrashAuditEntry = {
      id: `timeline-trash-audit-${++this.auditSequence}`,
      action: "trash",
      at: now.toISOString(),
      by: input.trashedBy,
      reason,
    };
    const record: TimelineTrashRecord = {
      id,
      projectId: workspace.projectId,
      eventId: event.id,
      eventTitle: event.title,
      originalTrackId: event.trackId,
      originalIndex,
      state: "trashed",
      trashedAt: now.toISOString(),
      trashedBy: input.trashedBy,
      retentionUntil: retentionDate(now, input.retentionDays ?? 30),
      event: clone(event),
      audit: [audit],
    };
    workspace.events.splice(originalIndex, 1);
    this.records.set(record.id, clone(record));
    return { accepted: true, workspace, record: clone(record), issues: [] };
  }

  restoreEvent(input: {
    workspace: TimelineWorkspace;
    trashId: TimelineId;
    restoredBy: TimelineUserId;
    reason?: string;
    targetTrackId?: TimelineTrackId;
  }): TimelineTrashResult {
    const workspace = clone(input.workspace);
    const stored = this.records.get(input.trashId);
    if (!stored) {
      return this.refused(
        workspace,
        "record-not-found",
        "Timeline Trash record was not found.",
      );
    }
    if (stored.projectId !== workspace.projectId) {
      return this.refused(
        workspace,
        "wrong-project",
        "Trash records cannot be restored into a different project.",
        stored,
      );
    }
    if (stored.state !== "trashed" || !stored.event) {
      return this.refused(
        workspace,
        "not-restorable",
        `Trash record ${stored.id} is ${stored.state} and cannot be restored.`,
        stored,
      );
    }
    if (workspace.events.some((event) => event.id === stored.eventId)) {
      return this.refused(
        workspace,
        "event-id-conflict",
        `Live event ${stored.eventId} already exists; restoration was stopped.`,
        stored,
      );
    }
    const trackId = input.targetTrackId ?? stored.originalTrackId;
    if (!workspace.tracks.some((track) => track.id === trackId)) {
      return this.refused(
        workspace,
        "track-not-found",
        `Track ${trackId} does not exist; choose a valid restoration track.`,
        stored,
      );
    }
    const now = this.now();
    const event = clone(stored.event);
    event.trackId = trackId;
    event.audit.updatedAt = now.toISOString();
    event.audit.updatedBy = input.restoredBy;
    workspace.events.splice(
      Math.min(stored.originalIndex, workspace.events.length),
      0,
      event,
    );
    const record: TimelineTrashRecord = {
      ...stored,
      state: "restored",
      restoredAt: now.toISOString(),
      restoredBy: input.restoredBy,
      audit: [
        ...stored.audit,
        {
          id: `timeline-trash-audit-${++this.auditSequence}`,
          action: "restore",
          at: now.toISOString(),
          by: input.restoredBy,
          reason: input.reason?.trim() || "Restored to active Timeline",
        },
      ],
    };
    this.records.set(record.id, clone(record));
    return { accepted: true, workspace, record: clone(record), issues: [] };
  }

  purgeEvent(input: {
    workspace: TimelineWorkspace;
    trashId: TimelineId;
    purgedBy: TimelineUserId;
    confirmation: string;
    reason: string;
  }): TimelineTrashResult {
    const workspace = clone(input.workspace);
    const stored = this.records.get(input.trashId);
    if (!stored) {
      return this.refused(
        workspace,
        "record-not-found",
        "Timeline Trash record was not found.",
      );
    }
    if (stored.projectId !== workspace.projectId) {
      return this.refused(
        workspace,
        "wrong-project",
        "Trash records cannot be purged from a different project.",
        stored,
      );
    }
    if (stored.state !== "trashed" || !stored.event) {
      return this.refused(
        workspace,
        "not-restorable",
        `Trash record ${stored.id} is ${stored.state} and has no active Trash payload.`,
        stored,
      );
    }
    if (
      input.confirmation !== permanentTimelineDeletionConfirmation(stored.id)
    ) {
      return this.refused(
        workspace,
        "confirmation-required",
        `Permanent deletion requires the exact confirmation: ${permanentTimelineDeletionConfirmation(stored.id)}`,
        stored,
      );
    }
    const now = this.now();
    const record: TimelineTrashRecord = {
      ...stored,
      state: "purged",
      purgedAt: now.toISOString(),
      purgedBy: input.purgedBy,
      event: undefined,
      audit: [
        ...stored.audit,
        {
          id: `timeline-trash-audit-${++this.auditSequence}`,
          action: "purge",
          at: now.toISOString(),
          by: input.purgedBy,
          reason: input.reason.trim() || "Permanently deleted",
        },
      ],
    };
    this.records.set(record.id, clone(record));
    return { accepted: true, workspace, record: clone(record), issues: [] };
  }

  getRecord(trashId: TimelineId): TimelineTrashRecord | null {
    const record = this.records.get(trashId);
    return record ? clone(record) : null;
  }

  snapshot(projectId?: TimelineId): TimelineTrashSnapshot {
    const now = this.now().getTime();
    const records = Array.from(this.records.values())
      .filter((record) => !projectId || record.projectId === projectId)
      .sort((left, right) => right.trashedAt.localeCompare(left.trashedAt))
      .map(clone);
    return {
      generatedAt: this.now().toISOString(),
      records,
      trashedCount: records.filter((record) => record.state === "trashed")
        .length,
      restoredCount: records.filter((record) => record.state === "restored")
        .length,
      purgedCount: records.filter((record) => record.state === "purged").length,
      expiredCount: records.filter(
        (record) =>
          record.state === "trashed" &&
          Date.parse(record.retentionUntil) <= now,
      ).length,
    };
  }

  exportRecords(): TimelineTrashRecord[] {
    return Array.from(this.records.values()).map(clone);
  }

  restoreRecords(records: TimelineTrashRecord[]): void {
    this.records.clear();
    this.sequence = 0;
    this.auditSequence = 0;
    records.forEach((record) => {
      this.records.set(record.id, clone(record));
      this.sequence = Math.max(
        this.sequence,
        Number(record.id.match(/(\d+)$/)?.[1] ?? 0),
      );
      record.audit.forEach((entry) => {
        this.auditSequence = Math.max(
          this.auditSequence,
          Number(entry.id.match(/(\d+)$/)?.[1] ?? 0),
        );
      });
    });
  }

  private refused(
    workspace: TimelineWorkspace,
    code: TimelineTrashIssue["code"],
    message: string,
    record: TimelineTrashRecord | null = null,
  ): TimelineTrashResult {
    return {
      accepted: false,
      workspace: clone(workspace),
      record: record ? clone(record) : null,
      issues: [{ code, message }],
    };
  }
}

export const timelineTrashEngine = new TimelineTrashEngine();
