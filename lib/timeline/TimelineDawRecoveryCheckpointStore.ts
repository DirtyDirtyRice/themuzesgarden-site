import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

const BUCKET = "timeline-daw-renders";
const PREFIX = `supabase://${BUCKET}/`;

export type TimelineDawRecoveryCheckpoint = {
  id: TimelineId;
  ownerId: TimelineUserId;
  sessionId: TimelineId;
  label: string;
  uri: string;
  byteLength: number;
  checksum: string;
  workspaceRevision: number;
  createdAt: string;
  createdBy: TimelineUserId;
  lastRestoredAt?: string;
  lastRestoredBy?: TimelineUserId;
};

export interface TimelineDawRecoveryCheckpointStore {
  save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    checkpointId: TimelineId;
    bytes: Uint8Array;
  }): Promise<string>;
  load(uri: string): Promise<Uint8Array>;
}

function segment(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
    throw new Error(`${label} contains unsupported storage-path characters.`);
  }
  return normalized;
}

export class TimelineDawRecoverySupabaseCheckpointStore implements TimelineDawRecoveryCheckpointStore {
  constructor(private readonly client: SupabaseClient, private readonly ownerId: TimelineUserId) {
    segment(ownerId, "Recovery owner ID");
  }

  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    checkpointId: TimelineId;
    bytes: Uint8Array;
  }): Promise<string> {
    if (input.ownerId !== this.ownerId) throw new Error("Recovery storage is limited to its owner.");
    const path = [
      segment(input.ownerId, "Recovery owner ID"),
      segment(input.sessionId, "Recovery session ID"),
      "recovery",
      `${segment(input.checkpointId, "Recovery checkpoint ID")}.json`,
    ].join("/");
    const { error } = await this.client.storage.from(BUCKET).upload(path, input.bytes, {
      contentType: "application/json",
      cacheControl: "private, max-age=0, no-store",
      upsert: false,
    });
    if (error) throw new Error(`Recovery checkpoint upload failed: ${error.message}`);
    return `${PREFIX}${path}`;
  }

  async load(uri: string): Promise<Uint8Array> {
    if (!uri.startsWith(PREFIX)) throw new Error("Recovery checkpoint URI is invalid.");
    const path = uri.slice(PREFIX.length);
    if (!path.startsWith(`${this.ownerId}/`)) {
      throw new Error("Recovery checkpoint access is limited to its owner.");
    }
    const { data, error } = await this.client.storage.from(BUCKET).download(path);
    if (error || !data) {
      throw new Error(`Recovery checkpoint download failed: ${error?.message ?? "bytes missing"}`);
    }
    return new Uint8Array(await data.arrayBuffer());
  }
}

export class InMemoryTimelineDawRecoveryCheckpointStore implements TimelineDawRecoveryCheckpointStore {
  private readonly values = new Map<string, Uint8Array>();

  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    checkpointId: TimelineId;
    bytes: Uint8Array;
  }): Promise<string> {
    const uri = `memory://daw-recovery/${input.ownerId}/${input.sessionId}/${input.checkpointId}.json`;
    this.values.set(uri, input.bytes.slice());
    return uri;
  }

  async load(uri: string): Promise<Uint8Array> {
    const bytes = this.values.get(uri);
    if (!bytes) throw new Error("Recovery checkpoint was not found.");
    return bytes.slice();
  }

  replace(uri: string, bytes: Uint8Array): void {
    this.values.set(uri, bytes.slice());
  }
}
