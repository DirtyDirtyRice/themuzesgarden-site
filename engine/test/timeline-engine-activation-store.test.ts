import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  TimelineEngineActivationDocument,
  TimelineEngineActivationStore,
} from "../../lib/timeline/TimelineEngineActivationStore";
import { TimelineEngineActivationGate } from "../../lib/timeline/TimelineEngineActivationGate";
import { TimelineEngineActivationSupabaseStore } from "../../lib/timeline/TimelineEngineActivationSupabaseStore";
import { TimelineEngineActivationService } from "../../lib/timeline/TimelineEngineActivationService";
import {
  TimelineEngineRegistry,
  type TimelineEngineDescriptor,
} from "../../lib/timeline/TimelineEngineRegistry";

class MemoryStore implements TimelineEngineActivationStore {
  readonly kind = "supabase" as const;
  document: TimelineEngineActivationDocument | null = null;
  saves = 0;

  async load() {
    return this.document ? structuredClone(this.document) : null;
  }

  async save(document: TimelineEngineActivationDocument) {
    this.document = structuredClone(document);
    this.saves += 1;
  }
}

function registry(): TimelineEngineRegistry {
  const descriptor: TimelineEngineDescriptor = {
    id: "production",
    name: "Production",
    module: "./production",
    version: "1.0.0",
    domain: "production",
    capabilities: ["coordinate"],
    dependencies: [],
    required: true,
  };
  const value = new TimelineEngineRegistry([descriptor]);
  value.probeAll(() => ({ healthy: true, message: "green" }));
  return value;
}

describe("TimelineEngineActivationStore", () => {
  it("persists and restores activation evidence through a pluggable durable store", async () => {
    const store = new MemoryStore();
    const source = new TimelineEngineActivationService(
      store,
      new TimelineEngineActivationGate(registry()),
    );
    const authorization = await source.request({
      workflowId: "plan-durable",
      requestedBy: "producer-1",
    });
    await source.consume({
      authorizationId: authorization.id,
      workflowId: "plan-durable",
      consumedBy: "producer-1",
    });

    const restarted = new TimelineEngineActivationService(
      store,
      new TimelineEngineActivationGate(registry()),
    );
    const snapshot = await restarted.initialize();

    expect(source.storageKind).toBe("supabase");
    expect(store.saves).toBe(2);
    expect(snapshot).toMatchObject({ total: 1, consumed: 1 });
  });

  it("rejects an unsupported persisted schema", async () => {
    const store = new MemoryStore();
    store.document = {
      schemaVersion: 2 as 1,
      savedAt: new Date().toISOString(),
      archive: { decisions: [] },
    };
    const service = new TimelineEngineActivationService(
      store,
      new TimelineEngineActivationGate(registry()),
    );
    await expect(service.initialize()).rejects.toThrow("unsupported format");
  });

  it("maps the private Supabase singleton row without losing archive evidence", async () => {
    let row: Record<string, unknown> | null = null;
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: row, error: null }),
          }),
        }),
        upsert: async (value: Record<string, unknown>) => {
          row = {
            schema_version: value.schema_version,
            saved_at: value.saved_at,
            archive: value.archive,
          };
          return { error: null };
        },
      }),
    } as unknown as SupabaseClient;
    const store = new TimelineEngineActivationSupabaseStore(client);
    const document: TimelineEngineActivationDocument = {
      schemaVersion: 1,
      savedAt: "2026-07-25T22:00:00.000Z",
      archive: { decisions: [] },
    };

    expect(await store.load()).toBeNull();
    await store.save(document);
    expect(await store.load()).toEqual(document);
  });
});
