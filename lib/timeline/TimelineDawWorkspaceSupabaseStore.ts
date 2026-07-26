import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimelineUserId } from "./TimelineTypes";
import {
  TimelineDawWorkspaceConflictError,
  type TimelineDawWorkspaceDocument,
  type TimelineDawWorkspaceStore,
} from "./TimelineDawWorkspaceService";

const TABLE = "timeline_daw_workspace_archives";
const SAVE_RPC = "save_timeline_daw_workspace_archive";

type WorkspaceRow = {
  revision: number;
  archive: TimelineDawWorkspaceDocument["archive"];
  archive_hash: string;
  updated_at: string;
};

export function hashTimelineDawWorkspaceArchive(
  archive: TimelineDawWorkspaceDocument["archive"],
): string {
  return createHash("sha256").update(JSON.stringify(archive)).digest("hex");
}

export class TimelineDawWorkspaceSupabaseStore implements TimelineDawWorkspaceStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: TimelineUserId,
  ) {
    if (!ownerId.trim()) throw new Error("DAW workspace owner identity is required.");
  }

  async load(): Promise<TimelineDawWorkspaceDocument | null> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("revision, archive, archive_hash, updated_at")
      .eq("owner_id", this.ownerId)
      .maybeSingle<WorkspaceRow>();
    if (error) throw new Error(`DAW workspace database read failed: ${error.message}`);
    if (!data) return null;
    const actualHash = hashTimelineDawWorkspaceArchive(data.archive);
    if (actualHash !== data.archive_hash) {
      throw new Error("DAW workspace archive integrity verification failed.");
    }
    return {
      revision: data.revision,
      archive: data.archive,
      updatedAt: data.updated_at,
    };
  }

  async save(document: TimelineDawWorkspaceDocument, expectedRevision: number): Promise<void> {
    const archiveHash = hashTimelineDawWorkspaceArchive(document.archive);
    const { data, error } = await this.client.rpc(SAVE_RPC, {
      p_owner_id: this.ownerId,
      p_expected_revision: expectedRevision,
      p_next_revision: document.revision,
      p_archive: document.archive,
      p_archive_hash: archiveHash,
      p_updated_at: document.updatedAt,
    });
    if (error) throw new Error(`DAW workspace database write failed: ${error.message}`);
    if (data !== true) {
      throw new TimelineDawWorkspaceConflictError(
        `DAW workspace storage conflict: expected ${expectedRevision}.`,
      );
    }
  }
}
