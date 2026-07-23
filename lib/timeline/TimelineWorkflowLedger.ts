import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type {
  TimelineActionPlan,
  TimelineActionReceipt,
} from "./TimelineActionEngine";
import type {
  TimelineAIExecution,
  TimelineAIProposal,
  TimelineAIUsage,
} from "./TimelineAIEngine";
import type {
  TimelineWorkflow,
  TimelineWorkflowTransition,
} from "./TimelineOrchestrationEngine";
import type {
  TimelineId,
  TimelineProjectId,
  TimelineUserId,
} from "./TimelineTypes";

export const TIMELINE_WORKFLOW_LEDGER_SCHEMA_VERSION = 1;

export type TimelineWorkflowLedgerCost = {
  currency: "USD";
  inputTokenRatePerMillion: number;
  outputTokenRatePerMillion: number;
  estimatedInputCost: number;
  estimatedOutputCost: number;
  estimatedTotalCost: number;
};

export type TimelineWorkflowLedgerRecord = {
  id: TimelineId;
  sequence: number;
  projectId: TimelineProjectId;
  workflowId: TimelineId;
  workflow: TimelineWorkflow;
  transitions: TimelineWorkflowTransition[];
  execution: TimelineAIExecution | null;
  proposals: TimelineAIProposal[];
  actionPlan: TimelineActionPlan | null;
  receipt: TimelineActionReceipt | null;
  usage: TimelineAIUsage | null;
  cost: TimelineWorkflowLedgerCost | null;
  recordedAt: string;
  recordedBy: TimelineUserId | "engine";
  previousHash: string | null;
  hash: string;
};

export type TimelineWorkflowLedgerDocument = {
  schemaVersion: typeof TIMELINE_WORKFLOW_LEDGER_SCHEMA_VERSION;
  ledgerId: TimelineId;
  createdAt: string;
  updatedAt: string;
  records: TimelineWorkflowLedgerRecord[];
};

export type TimelineWorkflowLedgerSnapshot = {
  ledgerId: TimelineId;
  recordCount: number;
  projectCount: number;
  workflowCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedTotalCost: number;
  latestRecordAt: string | null;
  integrityValid: boolean;
};

export type TimelineWorkflowLedgerIntegrity = {
  valid: boolean;
  checkedRecords: number;
  errors: string[];
};

export type TimelineWorkflowLedgerStore = {
  load(): Promise<TimelineWorkflowLedgerDocument | null>;
  save(document: TimelineWorkflowLedgerDocument): Promise<void>;
};

export type TimelineWorkflowLedgerRecordInput = {
  workflow: TimelineWorkflow;
  transitions?: TimelineWorkflowTransition[];
  execution?: TimelineAIExecution | null;
  proposals?: TimelineAIProposal[];
  actionPlan?: TimelineActionPlan | null;
  receipt?: TimelineActionReceipt | null;
  recordedBy?: TimelineUserId | "engine";
  pricing?: {
    inputTokenRatePerMillion: number;
    outputTokenRatePerMillion: number;
  };
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100_000_000) / 100_000_000;
}

function calculateCost(
  usage: TimelineAIUsage | undefined,
  pricing: TimelineWorkflowLedgerRecordInput["pricing"]
): TimelineWorkflowLedgerCost | null {
  if (!usage || !pricing) return null;
  const estimatedInputCost =
    (usage.inputTokens / 1_000_000) * pricing.inputTokenRatePerMillion;
  const estimatedOutputCost =
    (usage.outputTokens / 1_000_000) * pricing.outputTokenRatePerMillion;
  return {
    currency: "USD",
    inputTokenRatePerMillion: pricing.inputTokenRatePerMillion,
    outputTokenRatePerMillion: pricing.outputTokenRatePerMillion,
    estimatedInputCost: roundCurrency(estimatedInputCost),
    estimatedOutputCost: roundCurrency(estimatedOutputCost),
    estimatedTotalCost: roundCurrency(estimatedInputCost + estimatedOutputCost),
  };
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function recordHash(record: Omit<TimelineWorkflowLedgerRecord, "hash">): string {
  return createHash("sha256").update(stableJson(record)).digest("hex");
}

function withoutHash(
  record: TimelineWorkflowLedgerRecord
): Omit<TimelineWorkflowLedgerRecord, "hash"> {
  const { hash: _hash, ...value } = record;
  return value;
}

function validateDocumentShape(value: unknown): TimelineWorkflowLedgerDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Timeline workflow ledger is not a JSON object.");
  }
  const document = value as Partial<TimelineWorkflowLedgerDocument>;
  if (document.schemaVersion !== TIMELINE_WORKFLOW_LEDGER_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported Timeline workflow ledger schema ${String(document.schemaVersion)}.`
    );
  }
  if (typeof document.ledgerId !== "string" || !document.ledgerId.trim()) {
    throw new Error("Timeline workflow ledger ID is missing.");
  }
  if (!Array.isArray(document.records)) {
    throw new Error("Timeline workflow ledger records are missing.");
  }
  return document as TimelineWorkflowLedgerDocument;
}

export class TimelineWorkflowMemoryStore implements TimelineWorkflowLedgerStore {
  private document: TimelineWorkflowLedgerDocument | null = null;

  async load(): Promise<TimelineWorkflowLedgerDocument | null> {
    return this.document ? clone(this.document) : null;
  }

  async save(document: TimelineWorkflowLedgerDocument): Promise<void> {
    this.document = clone(document);
  }
}

export class TimelineWorkflowFileStore implements TimelineWorkflowLedgerStore {
  readonly filePath: string;

  constructor(filePath: string) {
    if (!filePath.trim()) throw new Error("Timeline workflow ledger path is required.");
    this.filePath = resolve(filePath);
  }

  async load(): Promise<TimelineWorkflowLedgerDocument | null> {
    try {
      const text = await readFile(this.filePath, "utf8");
      return validateDocumentShape(JSON.parse(text));
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return null;
      }
      if (error instanceof SyntaxError) {
        throw new Error("Timeline workflow ledger contains invalid JSON.");
      }
      throw error;
    }
  }

  async save(document: TimelineWorkflowLedgerDocument): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.filePath);
  }
}

export class TimelineWorkflowLedger {
  private document: TimelineWorkflowLedgerDocument | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly store: TimelineWorkflowLedgerStore,
    private readonly now: () => Date = () => new Date()
  ) {}

  async initialize(): Promise<TimelineWorkflowLedgerSnapshot> {
    const loaded = await this.store.load();
    if (loaded) {
      const integrity = this.verifyDocument(loaded);
      if (!integrity.valid) {
        throw new Error(
          `Timeline workflow ledger integrity failed: ${integrity.errors.join(" ")}`
        );
      }
      this.document = clone(loaded);
    } else {
      const timestamp = this.timestamp();
      this.document = {
        schemaVersion: TIMELINE_WORKFLOW_LEDGER_SCHEMA_VERSION,
        ledgerId: `timeline-workflow-ledger-${randomUUID()}`,
        createdAt: timestamp,
        updatedAt: timestamp,
        records: [],
      };
      await this.store.save(this.document);
    }
    return this.snapshot();
  }

  async record(
    input: TimelineWorkflowLedgerRecordInput
  ): Promise<TimelineWorkflowLedgerRecord> {
    let created: TimelineWorkflowLedgerRecord | null = null;
    const operation = async () => {
      const document = this.requireDocument();
      if (input.workflow.projectId.trim() === "") {
        throw new Error("Workflow project ID is required for ledger recording.");
      }
      if (
        input.execution &&
        input.execution.projectId !== input.workflow.projectId
      ) {
        throw new Error("Execution project does not match workflow project.");
      }
      if (
        input.proposals?.some(
          (proposal) => proposal.projectId !== input.workflow.projectId
        )
      ) {
        throw new Error("Proposal project does not match workflow project.");
      }
      const previous = document.records.at(-1);
      const usage = input.execution?.usage
        ? clone(input.execution.usage)
        : null;
      const base: Omit<TimelineWorkflowLedgerRecord, "hash"> = {
        id: `timeline-workflow-ledger-record-${document.records.length + 1}`,
        sequence: document.records.length + 1,
        projectId: input.workflow.projectId,
        workflowId: input.workflow.id,
        workflow: clone(input.workflow),
        transitions: clone(input.transitions ?? []),
        execution: input.execution ? clone(input.execution) : null,
        proposals: clone(input.proposals ?? []),
        actionPlan: input.actionPlan ? clone(input.actionPlan) : null,
        receipt: input.receipt ? clone(input.receipt) : null,
        usage,
        cost: calculateCost(usage ?? undefined, input.pricing),
        recordedAt: this.timestamp(),
        recordedBy: input.recordedBy ?? "engine",
        previousHash: previous?.hash ?? null,
      };
      created = { ...base, hash: recordHash(base) };
      document.records.push(created);
      document.updatedAt = created.recordedAt;
      await this.store.save(document);
    };
    this.writeChain = this.writeChain.then(operation, operation);
    await this.writeChain;
    if (!created) throw new Error("Timeline workflow ledger record was not created.");
    return clone(created);
  }

  getWorkflowHistory(
    workflowId: TimelineId
  ): TimelineWorkflowLedgerRecord[] {
    return this.requireDocument()
      .records.filter((record) => record.workflowId === workflowId)
      .map(clone);
  }

  getProjectHistory(
    projectId: TimelineProjectId
  ): TimelineWorkflowLedgerRecord[] {
    return this.requireDocument()
      .records.filter((record) => record.projectId === projectId)
      .map(clone);
  }

  latestWorkflowRecord(
    workflowId: TimelineId
  ): TimelineWorkflowLedgerRecord | null {
    const record = this.requireDocument()
      .records.filter((candidate) => candidate.workflowId === workflowId)
      .at(-1);
    return record ? clone(record) : null;
  }

  verifyIntegrity(): TimelineWorkflowLedgerIntegrity {
    return this.verifyDocument(this.requireDocument());
  }

  snapshot(): TimelineWorkflowLedgerSnapshot {
    const document = this.requireDocument();
    const integrity = this.verifyDocument(document);
    const workflows = new Set(document.records.map((record) => record.workflowId));
    const projects = new Set(document.records.map((record) => record.projectId));
    return {
      ledgerId: document.ledgerId,
      recordCount: document.records.length,
      projectCount: projects.size,
      workflowCount: workflows.size,
      totalInputTokens: document.records.reduce(
        (sum, record) => sum + (record.usage?.inputTokens ?? 0),
        0
      ),
      totalOutputTokens: document.records.reduce(
        (sum, record) => sum + (record.usage?.outputTokens ?? 0),
        0
      ),
      estimatedTotalCost: roundCurrency(
        document.records.reduce(
          (sum, record) => sum + (record.cost?.estimatedTotalCost ?? 0),
          0
        )
      ),
      latestRecordAt: document.records.at(-1)?.recordedAt ?? null,
      integrityValid: integrity.valid,
    };
  }

  exportDocument(): TimelineWorkflowLedgerDocument {
    return clone(this.requireDocument());
  }

  private verifyDocument(
    document: TimelineWorkflowLedgerDocument
  ): TimelineWorkflowLedgerIntegrity {
    const errors: string[] = [];
    let previousHash: string | null = null;
    document.records.forEach((record, index) => {
      const expectedSequence = index + 1;
      if (record.sequence !== expectedSequence) {
        errors.push(
          `Record ${record.id} sequence ${record.sequence} should be ${expectedSequence}.`
        );
      }
      if (record.previousHash !== previousHash) {
        errors.push(`Record ${record.id} previous hash does not match.`);
      }
      const expectedHash = recordHash(withoutHash(record));
      if (record.hash !== expectedHash) {
        errors.push(`Record ${record.id} content hash does not match.`);
      }
      previousHash = record.hash;
    });
    return {
      valid: errors.length === 0,
      checkedRecords: document.records.length,
      errors,
    };
  }

  private requireDocument(): TimelineWorkflowLedgerDocument {
    if (!this.document) {
      throw new Error("Timeline workflow ledger must be initialized before use.");
    }
    return this.document;
  }

  private timestamp(): string {
    return this.now().toISOString();
  }
}

