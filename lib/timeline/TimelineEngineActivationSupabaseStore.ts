import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  TimelineEngineActivationDocument,
  TimelineEngineActivationStore,
} from "./TimelineEngineActivationStore";

const LEDGER_ID = "primary";
const TABLE = "timeline_engine_activation_ledgers";

type LedgerRow = {
  schema_version: number;
  saved_at: string;
  archive: TimelineEngineActivationDocument["archive"];
};

export class TimelineEngineActivationSupabaseStore
implements TimelineEngineActivationStore {
  readonly kind = "supabase" as const;

  constructor(private readonly client: SupabaseClient) {}

  async load(): Promise<TimelineEngineActivationDocument | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("schema_version, saved_at, archive")
      .eq("id", LEDGER_ID)
      .maybeSingle<LedgerRow>();
    if (error) throw new Error(`Activation ledger database read failed: ${error.message}`);
    if (!data) return null;
    return {
      schemaVersion: data.schema_version as 1,
      savedAt: data.saved_at,
      archive: data.archive,
    };
  }

  async save(document: TimelineEngineActivationDocument): Promise<void> {
    const { error } = await this.client.from(TABLE).upsert({
      id: LEDGER_ID,
      schema_version: document.schemaVersion,
      saved_at: document.savedAt,
      archive: document.archive,
    }, { onConflict: "id" });
    if (error) throw new Error(`Activation ledger database write failed: ${error.message}`);
  }
}
