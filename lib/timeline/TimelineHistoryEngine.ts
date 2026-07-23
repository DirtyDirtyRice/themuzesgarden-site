import type {
  TimelineEvent,
  TimelineHistoryEntry,
  TimelineId,
  TimelineUserId,
  TimelineWorkspace,
} from "./TimelineTypes";

export type TimelineHistoryOperation =
  | "create"
  | "update"
  | "delete"
  | "move"
  | "activate"
  | "deactivate"
  | "archive"
  | "restore"
  | "link"
  | "unlink"
  | "import"
  | "batch"
  | "checkpoint";

export type TimelineHistoryChange = {
  path: string;
  before: unknown;
  after: unknown;
};

export type TimelineAuditRecord = TimelineHistoryEntry & {
  sequence: number;
  operation: TimelineHistoryOperation;
  entityType: "event" | "track" | "workspace" | "relationship";
  entityId: TimelineId;
  projectId: TimelineId;
  reason?: string;
  changes: TimelineHistoryChange[];
  before?: unknown;
  after?: unknown;
  transactionId?: TimelineId;
  previousRecordHash: string;
  recordHash: string;
};

export type TimelineHistoryCheckpoint = {
  id: TimelineId;
  label: string;
  description: string;
  createdAt: string;
  createdBy: TimelineUserId;
  sequence: number;
  workspace: TimelineWorkspace;
};

export type TimelineUndoPlan = {
  available: boolean;
  record: TimelineAuditRecord | null;
  operation: TimelineHistoryOperation | null;
  entityId: TimelineId | null;
  value: unknown;
};

export type TimelineHistorySnapshot = {
  generatedAt: string;
  records: TimelineAuditRecord[];
  checkpoints: TimelineHistoryCheckpoint[];
  recordCount: number;
  undoCount: number;
  redoCount: number;
  integrityValid: boolean;
};

export type TimelineHistoryRecordInput = {
  operation: TimelineHistoryOperation;
  entityType: TimelineAuditRecord["entityType"];
  entityId: TimelineId;
  projectId: TimelineId;
  userId: TimelineUserId;
  before?: unknown;
  after?: unknown;
  reason?: string;
  eventIds?: TimelineId[];
  transactionId?: TimelineId;
};

function clone<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(",")}}`;
}

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16).padStart(8, "0");
}

function diff(before: unknown, after: unknown, path = ""): TimelineHistoryChange[] {
  if (stableStringify(before) === stableStringify(after)) return [];
  if (
    before === null ||
    after === null ||
    typeof before !== "object" ||
    typeof after !== "object" ||
    Array.isArray(before) ||
    Array.isArray(after)
  ) {
    return [{ path: path || "$", before: clone(before), after: clone(after) }];
  }

  const first = before as Record<string, unknown>;
  const second = after as Record<string, unknown>;
  const keys = new Set([...Object.keys(first), ...Object.keys(second)]);
  return Array.from(keys)
    .sort()
    .flatMap((key) => diff(first[key], second[key], path ? `${path}.${key}` : key));
}

export class TimelineHistoryEngine {
  private records: TimelineAuditRecord[] = [];
  private redoRecords: TimelineAuditRecord[] = [];
  private checkpoints = new Map<TimelineId, TimelineHistoryCheckpoint>();
  private activeTransactionId: TimelineId | null = null;

  beginTransaction(transactionId: TimelineId): void {
    if (!transactionId.trim()) throw new Error("Transaction ID is required.");
    if (this.activeTransactionId) throw new Error(`Transaction ${this.activeTransactionId} is already active.`);
    this.activeTransactionId = transactionId;
  }

  commitTransaction(): TimelineAuditRecord[] {
    if (!this.activeTransactionId) return [];
    const transactionId = this.activeTransactionId;
    this.activeTransactionId = null;
    return this.records.filter((record) => record.transactionId === transactionId).map(clone);
  }

  rollbackTransaction(): TimelineAuditRecord[] {
    if (!this.activeTransactionId) return [];
    const transactionId = this.activeTransactionId;
    const removed = this.records.filter((record) => record.transactionId === transactionId);
    this.records = this.records.filter((record) => record.transactionId !== transactionId);
    this.activeTransactionId = null;
    this.rebuildHashes();
    return removed.reverse().map(clone);
  }

  record(input: TimelineHistoryRecordInput): TimelineAuditRecord {
    if (!input.entityId.trim()) throw new Error("History entity ID is required.");
    if (!input.projectId.trim()) throw new Error("History project ID is required.");
    if (!input.userId.trim()) throw new Error("History user ID is required.");

    const sequence = this.records.length + 1;
    const timestamp = new Date().toISOString();
    const previousRecordHash = this.records.at(-1)?.recordHash ?? "ROOT";
    const core = {
      sequence,
      operation: input.operation,
      entityType: input.entityType,
      entityId: input.entityId,
      projectId: input.projectId,
      userId: input.userId,
      timestamp,
      before: clone(input.before),
      after: clone(input.after),
      transactionId: input.transactionId ?? this.activeTransactionId ?? undefined,
      previousRecordHash,
    };
    const recordHash = hash(stableStringify(core));
    const record: TimelineAuditRecord = {
      id: `timeline-history-${sequence}-${recordHash}`,
      action: input.operation,
      timestamp,
      userId: input.userId,
      eventIds: input.eventIds?.length ? [...input.eventIds] : [input.entityId],
      sequence,
      operation: input.operation,
      entityType: input.entityType,
      entityId: input.entityId,
      projectId: input.projectId,
      reason: input.reason,
      changes: diff(input.before, input.after),
      before: clone(input.before),
      after: clone(input.after),
      transactionId: input.transactionId ?? this.activeTransactionId ?? undefined,
      previousRecordHash,
      recordHash,
    };
    this.records.push(record);
    this.redoRecords = [];
    return clone(record);
  }

  recordEventChange(
    operation: TimelineHistoryOperation,
    before: TimelineEvent | null,
    after: TimelineEvent | null,
    userId: TimelineUserId,
    projectId: TimelineId,
    reason?: string
  ): TimelineAuditRecord {
    const entityId = after?.id ?? before?.id;
    if (!entityId) throw new Error("Event change requires a before or after event.");
    return this.record({
      operation,
      entityType: "event",
      entityId,
      projectId,
      userId,
      before,
      after,
      reason,
      eventIds: [entityId],
    });
  }

  createCheckpoint(
    id: TimelineId,
    label: string,
    workspace: TimelineWorkspace,
    createdBy: TimelineUserId,
    description = ""
  ): TimelineHistoryCheckpoint {
    if (!id.trim() || !label.trim()) throw new Error("Checkpoint requires an ID and label.");
    const checkpoint: TimelineHistoryCheckpoint = {
      id,
      label,
      description,
      createdAt: new Date().toISOString(),
      createdBy,
      sequence: this.records.length,
      workspace: clone(workspace),
    };
    this.checkpoints.set(id, checkpoint);
    this.record({
      operation: "checkpoint",
      entityType: "workspace",
      entityId: workspace.projectId,
      projectId: workspace.projectId,
      userId: createdBy,
      after: { checkpointId: id, label },
      reason: description,
    });
    return clone(checkpoint);
  }

  restoreCheckpoint(checkpointId: TimelineId): TimelineWorkspace {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) throw new Error(`Checkpoint ${checkpointId} does not exist.`);
    return clone(checkpoint.workspace);
  }

  planUndo(): TimelineUndoPlan {
    const record = this.records.at(-1) ?? null;
    return {
      available: Boolean(record),
      record: record ? clone(record) : null,
      operation: record?.operation ?? null,
      entityId: record?.entityId ?? null,
      value: clone(record?.before),
    };
  }

  undo(): TimelineUndoPlan {
    const plan = this.planUndo();
    if (!plan.record) return plan;
    this.records.pop();
    this.redoRecords.push(plan.record);
    return plan;
  }

  planRedo(): TimelineUndoPlan {
    const record = this.redoRecords.at(-1) ?? null;
    return {
      available: Boolean(record),
      record: record ? clone(record) : null,
      operation: record?.operation ?? null,
      entityId: record?.entityId ?? null,
      value: clone(record?.after),
    };
  }

  redo(): TimelineUndoPlan {
    const plan = this.planRedo();
    if (!plan.record) return plan;
    this.redoRecords.pop();
    this.records.push(plan.record);
    return plan;
  }

  getEntityTimeline(entityId: TimelineId): TimelineAuditRecord[] {
    return this.records
      .filter((record) => record.entityId === entityId || record.eventIds.includes(entityId))
      .map(clone);
  }

  getRecords(options: {
    projectId?: TimelineId;
    userId?: TimelineUserId;
    operation?: TimelineHistoryOperation;
    since?: string;
    limit?: number;
  } = {}): TimelineAuditRecord[] {
    let records = [...this.records];
    if (options.projectId) records = records.filter((record) => record.projectId === options.projectId);
    if (options.userId) records = records.filter((record) => record.userId === options.userId);
    if (options.operation) records = records.filter((record) => record.operation === options.operation);
    if (options.since) records = records.filter((record) => record.timestamp >= options.since!);
    const limit = Math.max(1, Math.floor(options.limit ?? (records.length || 1)));
    return records.slice(-limit).map(clone);
  }

  verifyIntegrity(): boolean {
    return this.records.every((record, index) => {
      const previousRecordHash = index === 0 ? "ROOT" : this.records[index - 1].recordHash;
      const core = {
        sequence: record.sequence,
        operation: record.operation,
        entityType: record.entityType,
        entityId: record.entityId,
        projectId: record.projectId,
        userId: record.userId,
        timestamp: record.timestamp,
        before: record.before,
        after: record.after,
        transactionId: record.transactionId,
        previousRecordHash,
      };
      return record.previousRecordHash === previousRecordHash && record.recordHash === hash(stableStringify(core));
    });
  }

  private rebuildHashes(): void {
    this.records = this.records.map((record, index) => {
      const previousRecordHash = index === 0 ? "ROOT" : this.records[index - 1].recordHash;
      const sequence = index + 1;
      const core = {
        sequence,
        operation: record.operation,
        entityType: record.entityType,
        entityId: record.entityId,
        projectId: record.projectId,
        userId: record.userId,
        timestamp: record.timestamp,
        before: record.before,
        after: record.after,
        transactionId: record.transactionId,
        previousRecordHash,
      };
      return { ...record, sequence, previousRecordHash, recordHash: hash(stableStringify(core)) };
    });
  }

  getSnapshot(): TimelineHistorySnapshot {
    return {
      generatedAt: new Date().toISOString(),
      records: this.records.map(clone),
      checkpoints: Array.from(this.checkpoints.values()).map(clone),
      recordCount: this.records.length,
      undoCount: this.records.length,
      redoCount: this.redoRecords.length,
      integrityValid: this.verifyIntegrity(),
    };
  }

  reset(): void {
    this.records = [];
    this.redoRecords = [];
    this.checkpoints.clear();
    this.activeTransactionId = null;
  }
}

export const timelineHistoryEngine = new TimelineHistoryEngine();
