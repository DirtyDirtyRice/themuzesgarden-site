import "server-only";
import { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TimelineDawRenderArtifact,
  TimelineDawRenderArtifactStore,
} from "./TimelineDawRenderArtifactStore";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

const BUCKET = "timeline-daw-renders";
const RESUMABLE_THRESHOLD_BYTES = 6 * 1024 * 1024;
const RESUMABLE_CHUNK_BYTES = 6 * 1024 * 1024;

type ResumableUploadOptions = {
  supabaseUrl: string;
  anonKey: string;
  accessToken: string;
};

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
    private readonly resumable?: ResumableUploadOptions,
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
    if (input.bytes.byteLength > RESUMABLE_THRESHOLD_BYTES && this.resumable) {
      await this.uploadResumable(path, input.bytes, input.contentType);
    } else {
      const { error } = await this.client.storage.from(BUCKET).upload(path, input.bytes, {
        contentType: input.contentType,
        cacheControl: "private, max-age=0, no-store",
        upsert: true,
      });
      if (error) throw new Error(`DAW render artifact upload failed: ${error.message}`);
    }
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

  private async uploadResumable(
    path: string,
    bytes: Uint8Array,
    contentType: "audio/wav",
  ): Promise<void> {
    if (!this.resumable) throw new Error("Large DAW render upload is not configured.");
    const storageOrigin = this.resumable.supabaseUrl.replace(
      /\.supabase\.co\/?$/,
      ".storage.supabase.co",
    );
    const endpoint = `${storageOrigin}/storage/v1/upload/resumable`;
    const metadata = [
      ["bucketName", BUCKET],
      ["objectName", path],
      ["contentType", contentType],
      ["cacheControl", "0"],
    ].map(([key, value]) => `${key} ${Buffer.from(value).toString("base64")}`).join(",");
    const created = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.resumable.accessToken}`,
        apikey: this.resumable.anonKey,
        "Tus-Resumable": "1.0.0",
        "Upload-Length": String(bytes.byteLength),
        "Upload-Metadata": metadata,
        "x-upsert": "true",
      },
    });
    const location = created.headers.get("location");
    if (created.status !== 201 || !location) {
      throw new Error(`DAW render resumable upload could not start (${created.status}).`);
    }
    const uploadUrl = new URL(location, endpoint).toString();
    let offset = 0;
    while (offset < bytes.byteLength) {
      const end = Math.min(bytes.byteLength, offset + RESUMABLE_CHUNK_BYTES);
      const chunk = new Uint8Array(end - offset);
      chunk.set(bytes.subarray(offset, end));
      const response = await fetch(uploadUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${this.resumable.accessToken}`,
          apikey: this.resumable.anonKey,
          "Content-Type": "application/offset+octet-stream",
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": String(offset),
        },
        body: chunk.buffer,
      });
      if (response.status !== 204) {
        throw new Error(`DAW render resumable upload failed at byte ${offset} (${response.status}).`);
      }
      const nextOffset = Number(response.headers.get("upload-offset"));
      offset = Number.isSafeInteger(nextOffset) && nextOffset > offset ? nextOffset : end;
    }
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
