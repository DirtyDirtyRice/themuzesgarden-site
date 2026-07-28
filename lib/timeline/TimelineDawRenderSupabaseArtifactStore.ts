import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TimelineDawRenderArtifact,
  TimelineDawRenderArtifactStore,
} from "./TimelineDawRenderArtifactStore";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

const BUCKET = "timeline-daw-renders";

function segment(value: string, label: string): string {
  const normalized = value.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(normalized)) {
    throw new Error(`${label} contains unsupported storage-path characters.`);
  }
  return normalized;
}

export class TimelineDawRenderSupabaseArtifactStore implements TimelineDawRenderArtifactStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: TimelineUserId,
  ) {
    segment(ownerId, "DAW render owner ID");
  }

  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    bytes: Uint8Array;
    checksum: string;
    contentType: "audio/wav";
  }): Promise<TimelineDawRenderArtifact> {
    if (input.ownerId !== this.ownerId) {
      throw new Error("DAW render artifact storage is limited to its owner.");
    }
    const path = [
      segment(input.ownerId, "DAW render owner ID"),
      segment(input.sessionId, "DAW render session ID"),
      `${segment(input.jobId, "DAW render job ID")}.wav`,
    ].join("/");
    const { error } = await this.client.storage.from(BUCKET).upload(path, input.bytes, {
      contentType: input.contentType,
      cacheControl: "private, max-age=0, no-store",
      upsert: true,
    });
    if (error) throw new Error(`DAW render artifact upload failed: ${error.message}`);
    return {
      ownerId: input.ownerId,
      sessionId: input.sessionId,
      jobId: input.jobId,
      uri: `supabase://${BUCKET}/${path}`,
      byteLength: input.bytes.byteLength,
      checksum: input.checksum,
      contentType: input.contentType,
    };
  }

  async createDeliveryUrl(
    artifact: TimelineDawRenderArtifact,
    expiresInSeconds = 3_600,
  ): Promise<string> {
    if (artifact.ownerId !== this.ownerId) {
      throw new Error("DAW render artifact delivery is limited to its owner.");
    }
    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 60 || expiresInSeconds > 86_400) {
      throw new Error("DAW render delivery expiration must be from 60 to 86400 seconds.");
    }
    const prefix = `supabase://${BUCKET}/`;
    if (!artifact.uri.startsWith(prefix)) throw new Error("DAW render artifact URI is invalid.");
    const path = artifact.uri.slice(prefix.length);
    const { data, error } = await this.client.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresInSeconds, { download: true });
    if (error || !data?.signedUrl) {
      throw new Error(`DAW render artifact delivery failed: ${error?.message ?? "signed URL missing"}`);
    }
    return data.signedUrl;
  }
}
