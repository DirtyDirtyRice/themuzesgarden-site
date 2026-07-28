import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineDawRenderArtifact = {
  ownerId: TimelineUserId;
  sessionId: TimelineId;
  jobId: TimelineId;
  uri: string;
  byteLength: number;
  checksum: string;
  contentType: "audio/wav";
};

export interface TimelineDawRenderArtifactStore {
  save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    bytes: Uint8Array;
    checksum: string;
    contentType: "audio/wav";
  }): Promise<TimelineDawRenderArtifact>;
  createDeliveryUrl(
    artifact: TimelineDawRenderArtifact,
    expiresInSeconds?: number,
  ): Promise<string>;
}

const clone = <T>(value: T): T => structuredClone(value);

export class InMemoryTimelineDawRenderArtifactStore implements TimelineDawRenderArtifactStore {
  private readonly artifacts = new Map<string, {
    artifact: TimelineDawRenderArtifact;
    bytes: Uint8Array;
  }>();

  async save(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    bytes: Uint8Array;
    checksum: string;
    contentType: "audio/wav";
  }): Promise<TimelineDawRenderArtifact> {
    const uri = `memory://daw-renders/${input.ownerId}/${input.sessionId}/${input.jobId}.wav`;
    const artifact = {
      ownerId: input.ownerId,
      sessionId: input.sessionId,
      jobId: input.jobId,
      uri,
      byteLength: input.bytes.byteLength,
      checksum: input.checksum,
      contentType: input.contentType,
    } satisfies TimelineDawRenderArtifact;
    this.artifacts.set(uri, { artifact: clone(artifact), bytes: input.bytes.slice() });
    return clone(artifact);
  }

  async createDeliveryUrl(artifact: TimelineDawRenderArtifact): Promise<string> {
    if (!this.artifacts.has(artifact.uri)) throw new Error("DAW render artifact was not found.");
    return `${artifact.uri}?delivery=signed`;
  }

  read(uri: string): Uint8Array | null {
    return this.artifacts.get(uri)?.bytes.slice() ?? null;
  }
}
