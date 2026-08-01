import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

const BUCKET = "timeline-daw-renders";

export type TimelineDawStemPackageArtifact = {
  ownerId: TimelineUserId;
  sessionId: TimelineId;
  jobId: TimelineId;
  uri: string;
  byteLength: number;
  checksum: string;
  contentType: "application/zip";
};

export interface TimelineDawStemPackageStore {
  save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    bytes: Uint8Array;
    checksum: string;
  }): Promise<TimelineDawStemPackageArtifact>;
  createDeliveryUrl(artifact: TimelineDawStemPackageArtifact): Promise<string>;
}

const safe = (value: string) => {
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) throw new Error("Stem package path is invalid.");
  return normalized;
};

export class TimelineDawStemSupabasePackageStore implements TimelineDawStemPackageStore {
  constructor(private readonly client: SupabaseClient, private readonly ownerId: TimelineUserId) {}

  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    bytes: Uint8Array;
    checksum: string;
  }): Promise<TimelineDawStemPackageArtifact> {
    if (input.ownerId !== this.ownerId) throw new Error("Stem package storage is limited to its owner.");
    const path = `${safe(input.ownerId)}/${safe(input.sessionId)}/${safe(input.jobId)}-stems.zip`;
    const { error } = await this.client.storage.from(BUCKET).upload(path, input.bytes, {
      contentType: "application/zip",
      cacheControl: "private, max-age=0, no-store",
      upsert: true,
    });
    if (error) throw new Error(`Stem package upload failed: ${error.message}`);
    return {
      ownerId: input.ownerId,
      sessionId: input.sessionId,
      jobId: input.jobId,
      uri: `supabase://${BUCKET}/${path}`,
      byteLength: input.bytes.byteLength,
      checksum: input.checksum,
      contentType: "application/zip",
    };
  }

  async createDeliveryUrl(artifact: TimelineDawStemPackageArtifact): Promise<string> {
    if (artifact.ownerId !== this.ownerId) throw new Error("Stem package delivery is limited to its owner.");
    const prefix = `supabase://${BUCKET}/`;
    if (!artifact.uri.startsWith(prefix)) throw new Error("Stem package URI is invalid.");
    const { data, error } = await this.client.storage.from(BUCKET)
      .createSignedUrl(artifact.uri.slice(prefix.length), 3_600, { download: true });
    if (error || !data?.signedUrl) throw new Error(`Stem package delivery failed: ${error?.message ?? "signed URL missing"}`);
    return data.signedUrl;
  }
}

export class InMemoryTimelineDawStemPackageStore implements TimelineDawStemPackageStore {
  private readonly packages = new Map<string, Uint8Array>();
  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    bytes: Uint8Array;
    checksum: string;
  }): Promise<TimelineDawStemPackageArtifact> {
    const uri = `memory://stem-packages/${input.ownerId}/${input.sessionId}/${input.jobId}.zip`;
    this.packages.set(uri, input.bytes.slice());
    return { ...input, uri, byteLength: input.bytes.byteLength, contentType: "application/zip" };
  }
  async createDeliveryUrl(artifact: TimelineDawStemPackageArtifact): Promise<string> {
    if (!this.packages.has(artifact.uri)) throw new Error("Stem package was not found.");
    return `${artifact.uri}?delivery=signed`;
  }
  read(uri: string) { return this.packages.get(uri)?.slice() ?? null; }
}
