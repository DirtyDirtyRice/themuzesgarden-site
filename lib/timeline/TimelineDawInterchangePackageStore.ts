import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

const BUCKET = "timeline-daw-renders";
const PREFIX = `supabase://${BUCKET}/`;

export type TimelineDawInterchangeArtifact = {
  ownerId: TimelineUserId;
  sessionId: TimelineId;
  packageId: TimelineId;
  uri: string;
  byteLength: number;
  checksum: string;
  contentType: "application/zip";
};

export interface TimelineDawInterchangePackageStore {
  load(uri: string): Promise<Uint8Array>;
  save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    packageId: TimelineId;
    bytes: Uint8Array;
    checksum: string;
  }): Promise<TimelineDawInterchangeArtifact>;
  createDeliveryUrl(artifact: TimelineDawInterchangeArtifact): Promise<string>;
}

function segment(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
    throw new Error(`${label} contains unsupported storage-path characters.`);
  }
  return normalized;
}

export class TimelineDawInterchangeSupabasePackageStore implements TimelineDawInterchangePackageStore {
  constructor(private readonly client: SupabaseClient, private readonly ownerId: TimelineUserId) {
    segment(ownerId, "Interchange owner ID");
  }

  async load(uri: string): Promise<Uint8Array> {
    if (!uri.startsWith(PREFIX)) throw new Error("Interchange source URI is invalid.");
    const path = uri.slice(PREFIX.length);
    if (!path.startsWith(`${this.ownerId}/`)) {
      throw new Error("Interchange source access is limited to its owner.");
    }
    const { data, error } = await this.client.storage.from(BUCKET).download(path);
    if (error || !data) throw new Error(`Interchange source download failed: ${error?.message ?? "bytes missing"}`);
    return new Uint8Array(await data.arrayBuffer());
  }

  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    packageId: TimelineId;
    bytes: Uint8Array;
    checksum: string;
  }): Promise<TimelineDawInterchangeArtifact> {
    if (input.ownerId !== this.ownerId) throw new Error("Interchange storage is limited to its owner.");
    const path = [
      segment(input.ownerId, "Interchange owner ID"),
      segment(input.sessionId, "Interchange session ID"),
      `${segment(input.packageId, "Interchange package ID")}.zip`,
    ].join("/");
    const { error } = await this.client.storage.from(BUCKET).upload(path, input.bytes, {
      contentType: "application/zip",
      cacheControl: "private, max-age=0, no-store",
      upsert: true,
    });
    if (error) throw new Error(`Interchange package upload failed: ${error.message}`);
    return {
      ownerId: input.ownerId,
      sessionId: input.sessionId,
      packageId: input.packageId,
      uri: `${PREFIX}${path}`,
      byteLength: input.bytes.byteLength,
      checksum: input.checksum,
      contentType: "application/zip",
    };
  }

  async createDeliveryUrl(artifact: TimelineDawInterchangeArtifact): Promise<string> {
    if (artifact.ownerId !== this.ownerId || !artifact.uri.startsWith(PREFIX)) {
      throw new Error("Interchange package delivery is limited to its owner.");
    }
    const { data, error } = await this.client.storage.from(BUCKET)
      .createSignedUrl(artifact.uri.slice(PREFIX.length), 3_600, { download: true });
    if (error || !data?.signedUrl) {
      throw new Error(`Interchange package delivery failed: ${error?.message ?? "signed URL missing"}`);
    }
    return data.signedUrl;
  }
}

export class InMemoryTimelineDawInterchangePackageStore implements TimelineDawInterchangePackageStore {
  private readonly values = new Map<string, Uint8Array>();

  seed(uri: string, bytes: Uint8Array): void {
    this.values.set(uri, bytes.slice());
  }

  async load(uri: string): Promise<Uint8Array> {
    const bytes = this.values.get(uri);
    if (!bytes) throw new Error("Interchange source was not found.");
    return bytes.slice();
  }

  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    packageId: TimelineId;
    bytes: Uint8Array;
    checksum: string;
  }): Promise<TimelineDawInterchangeArtifact> {
    const uri = `memory://interchange/${input.ownerId}/${input.sessionId}/${input.packageId}.zip`;
    this.values.set(uri, input.bytes.slice());
    return { ...input, uri, byteLength: input.bytes.byteLength, contentType: "application/zip" };
  }

  async createDeliveryUrl(artifact: TimelineDawInterchangeArtifact): Promise<string> {
    if (!this.values.has(artifact.uri)) throw new Error("Interchange package was not found.");
    return `${artifact.uri}?delivery=signed`;
  }

  read(uri: string): Uint8Array | null {
    return this.values.get(uri)?.slice() ?? null;
  }
}
