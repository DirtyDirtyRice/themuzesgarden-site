import type { TimelineDawRenderArtifactStore } from "./TimelineDawRenderArtifactStore";
import type { TimelineDawStemPackageStore } from "./TimelineDawStemPackageStore";
import type { TimelineOfflineRenderJob } from "./TimelineOfflineRenderAndExportEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export class TimelineDawRenderDeliveryService {
  constructor(
    private readonly artifactStore: TimelineDawRenderArtifactStore,
    private readonly stemPackageStore: TimelineDawStemPackageStore,
  ) {}

  createDeliveryUrl(input: {
    ownerId: TimelineUserId;
    sessionId: TimelineId;
    job: TimelineOfflineRenderJob;
  }): Promise<string> {
    const { job } = input;
    if (job.state !== "completed" || !job.outputUri || !job.checksum) {
      throw new Error("Completed DAW render artifact was not found.");
    }
    if (job.target === "stem") {
      return this.stemPackageStore.createDeliveryUrl({
        ownerId: input.ownerId,
        sessionId: input.sessionId,
        jobId: job.id,
        uri: job.outputUri,
        byteLength: 0,
        checksum: job.checksum,
        contentType: "application/zip",
      });
    }
    return this.artifactStore.createDeliveryUrl({
      ownerId: input.ownerId,
      sessionId: input.sessionId,
      jobId: job.id,
      uri: job.outputUri,
      byteLength: 0,
      checksum: job.checksum,
      contentType: "audio/wav",
    });
  }
}
