import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  TimelineEngineActivationGate,
  type TimelineEngineActivationArchive,
  type TimelineEngineActivationDecision,
} from "./TimelineEngineActivationGate";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

type TimelineEngineActivationFile = {
  schemaVersion: 1;
  savedAt: string;
  archive: TimelineEngineActivationArchive;
};

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

  constructor(
    private readonly filePath: string,
    readonly gate: TimelineEngineActivationGate,
    private readonly now: () => Date = () => new Date(),
  ) {
    if (!filePath.trim()) throw new Error("Engine activation ledger path is required.");
  }

  async initialize(): Promise<TimelineEngineActivationSnapshot> {
    if (!this.initialized) {
      try {
        const document = JSON.parse(
          await readFile(this.filePath, "utf8"),
        ) as Partial<TimelineEngineActivationFile>;
        if (
          document.schemaVersion !== 1 ||
          !document.archive ||
          !Array.isArray(document.archive.decisions)
        ) {
          throw new Error("Engine activation ledger has an unsupported format.");
        }
        this.gate.restoreArchive(document.archive);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !("code" in error) ||
          error.code !== "ENOENT"
        ) {
          if (error instanceof SyntaxError) {
            throw new Error("Engine activation ledger contains invalid JSON.");
          }
          throw error;
        }
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
      const document: TimelineEngineActivationFile = {
        schemaVersion: 1,
        savedAt: this.now().toISOString(),
        archive: this.gate.exportArchive(),
      };
      await mkdir(dirname(this.filePath), { recursive: true });
      const temporary = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(temporary, `${JSON.stringify(document, null, 2)}\n`, "utf8");
      await rename(temporary, this.filePath);
    };
    this.writeQueue = this.writeQueue.then(operation, operation);
    await this.writeQueue;
  }
}
