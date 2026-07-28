import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

const BUCKET = "timeline-daw-render-sources";
const PREFIX = `supabase://${BUCKET}/`;

export type TimelineDawRenderSourceArtifact = {
  id: TimelineId;
  ownerId: TimelineUserId;
  sessionId: TimelineId;
  name: string;
  uri: string;
  byteLength: number;
  checksum: string;
};

export interface TimelineDawRenderSourceStore {
  save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    name: string;
    bytes: Uint8Array;
  }): Promise<TimelineDawRenderSourceArtifact>;
  load(ownerId: TimelineUserId, uri: string): Promise<Uint8Array>;
}

function segment(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
    throw new Error(`${label} contains unsupported storage-path characters.`);
  }
  return normalized;
}

function fileName(value: string): string {
  const normalized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  if (!normalized || normalized.length > 180) throw new Error("Render source file name is invalid.");
  if (!normalized.toLowerCase().endsWith(".wav")) {
    throw new Error("Render sources must be WAV files.");
  }
  return normalized;
}

export class TimelineDawRenderSupabaseSourceStore implements TimelineDawRenderSourceStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: TimelineUserId,
  ) {
    segment(ownerId, "Render source owner ID");
  }

  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    name: string;
    bytes: Uint8Array;
  }): Promise<TimelineDawRenderSourceArtifact> {
    if (input.ownerId !== this.ownerId) throw new Error("Render source storage is limited to its owner.");
    if (!input.bytes.byteLength) throw new Error("Render source bytes are required.");
    const checksum = `sha256:${createHash("sha256").update(input.bytes).digest("hex")}`;
    const id = `timeline-daw-source-${checksum.slice(7, 23)}`;
    const path = [
      segment(input.ownerId, "Render source owner ID"),
      segment(input.sessionId, "Render source session ID"),
      `${id}-${fileName(input.name)}`,
    ].join("/");
    const { error } = await this.client.storage.from(BUCKET).upload(path, input.bytes, {
      contentType: "audio/wav",
      cacheControl: "private, max-age=0, no-store",
      upsert: true,
    });
    if (error) throw new Error(`Render source upload failed: ${error.message}`);
    return {
      id,
      ownerId: input.ownerId,
      sessionId: input.sessionId,
      name: input.name.trim(),
      uri: `${PREFIX}${path}`,
      byteLength: input.bytes.byteLength,
      checksum,
    };
  }

  async load(ownerId: TimelineUserId, uri: string): Promise<Uint8Array> {
    if (ownerId !== this.ownerId) throw new Error("Render source access is limited to its owner.");
    if (!uri.startsWith(PREFIX)) throw new Error("Render source URI is invalid.");
    const path = uri.slice(PREFIX.length);
    if (!path.startsWith(`${segment(ownerId, "Render source owner ID")}/`)) {
      throw new Error("Render source path does not belong to its owner.");
    }
    const { data, error } = await this.client.storage.from(BUCKET).download(path);
    if (error || !data) throw new Error(`Render source download failed: ${error?.message ?? "file missing"}`);
    return new Uint8Array(await data.arrayBuffer());
  }
}

export class InMemoryTimelineDawRenderSourceStore implements TimelineDawRenderSourceStore {
  private readonly bytes = new Map<string, Uint8Array>();

  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    name: string;
    bytes: Uint8Array;
  }): Promise<TimelineDawRenderSourceArtifact> {
    const checksum = `sha256:${createHash("sha256").update(input.bytes).digest("hex")}`;
    const id = `timeline-daw-source-${checksum.slice(7, 23)}`;
    const uri = `memory://render-sources/${input.ownerId}/${input.sessionId}/${id}.wav`;
    this.bytes.set(uri, input.bytes.slice());
    return { id, ownerId: input.ownerId, sessionId: input.sessionId, name: input.name, uri, byteLength: input.bytes.byteLength, checksum };
  }

  async load(ownerId: TimelineUserId, uri: string): Promise<Uint8Array> {
    if (!uri.includes(`/${ownerId}/`)) throw new Error("Render source path does not belong to its owner.");
    const value = this.bytes.get(uri);
    if (!value) throw new Error("Render source was not found.");
    return value.slice();
  }
}
