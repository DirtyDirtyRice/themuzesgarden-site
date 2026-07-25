import "server-only";

import {
  TimelineEngineActivationGate,
  type TimelineEngineActivationDecision,
} from "./TimelineEngineActivationGate";
import {
  TimelineEngineActivationFileStore,
  type TimelineEngineActivationDocument,
  type TimelineEngineActivationStore,
} from "./TimelineEngineActivationStore";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineEngineActivationSnapshot = {
  total: number;
  authorized: number;
  blocked: number;
  consumed: number;
  expired: number;
  revoked: number;
  latestDecisionAt: string | null;
  decisions: TimelineEngineActivationDecision[];
};

export class TimelineEngineActivationService {
  private initialized = false;
  private writeQueue: Promise<void> = Promise.resolve();

  private readonly store: TimelineEngineActivationStore;

  constructor(
    store: string | TimelineEngineActivationStore,
    readonly gate: TimelineEngineActivationGate,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.store = typeof store === "string"
      ? new TimelineEngineActivationFileStore(store)
      : store;
  }

  get storageKind(): TimelineEngineActivationStore["kind"] {
    return this.store.kind;
  }

  async initialize(): Promise<TimelineEngineActivationSnapshot> {
    if (!this.initialized) {
      const document = await this.store.load();
      if (document) {
        if (
          document.schemaVersion !== 1 ||
          !document.archive ||
          !Array.isArray(document.archive.decisions)
        ) {
          throw new Error("Engine activation ledger has an unsupported format.");
        }
        this.gate.restoreArchive(document.archive);
      }
      this.initialized = true;
    }
    return this.snapshot();
  }

  async request(input: {
    workflowId: TimelineId;
    requestedBy: TimelineUserId;
  }): Promise<TimelineEngineActivationDecision> {
    await this.initialize();
    const decision = this.gate.request(input);
    await this.save();
    return decision;
  }

  async consume(input: {
    authorizationId: TimelineId;
    workflowId: TimelineId;
    consumedBy: TimelineUserId;
  }): Promise<TimelineEngineActivationDecision> {
    await this.initialize();
    try {
      return this.gate.consume(input);
    } finally {
      await this.save();
    }
  }

  async revoke(input: {
    authorizationId: TimelineId;
    revokedBy: TimelineUserId;
    reason: string;
  }): Promise<TimelineEngineActivationDecision> {
    await this.initialize();
    const decision = this.gate.revoke(input);
    await this.save();
    return decision;
  }

  async getDecision(id: TimelineId): Promise<TimelineEngineActivationDecision | null> {
    await this.initialize();
    return this.gate.getDecision(id);
  }

  async snapshot(workflowId?: TimelineId): Promise<TimelineEngineActivationSnapshot> {
    if (!this.initialized) await this.initialize();
    const decisions = this.gate.listDecisions(workflowId);
    return {
      total: decisions.length,
      authorized: decisions.filter((value) => value.status === "authorized").length,
      blocked: decisions.filter((value) => value.status === "blocked").length,
      consumed: decisions.filter((value) => value.status === "consumed").length,
      expired: decisions.filter((value) => value.status === "expired").length,
      revoked: decisions.filter((value) => value.status === "revoked").length,
      latestDecisionAt: decisions.at(-1)?.requestedAt ?? null,
      decisions,
    };
  }

  private async save(): Promise<void> {
    const operation = async () => {
      const document: TimelineEngineActivationDocument = {
        schemaVersion: 1,
        savedAt: this.now().toISOString(),
        archive: this.gate.exportArchive(),
      };
      await this.store.save(document);
    };
    this.writeQueue = this.writeQueue.then(operation, operation);
    await this.writeQueue;
  }
}
