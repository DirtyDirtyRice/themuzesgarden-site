import { describe, expect, it, vi } from "vitest";
import { TimelineDawRenderDeliveryService } from "../../lib/timeline/TimelineDawRenderDeliveryService";
import type { TimelineOfflineRenderJob } from "../../lib/timeline/TimelineOfflineRenderAndExportEngine";

function completedJob(target: "mix" | "stem", outputUri: string): TimelineOfflineRenderJob {
  return {
    id: "job-1", projectId: "project-1", name: "Render", target,
    sourceIds: ["source-1"], startSample: 0, endSample: 4,
    sampleRate: 48_000, bitDepth: 24, channels: 1, format: "wav",
    normalizePeakDb: null, dither: false, state: "completed", issues: [],
    renderedFrames: 4, totalFrames: 4, checksum: "sha256:render",
    outputUri, head: 5, createdBy: "owner-1", updatedBy: "worker-1",
  };
}

describe("TimelineDawRenderDeliveryService", () => {
  it("routes completed stem re-downloads through the ZIP package store", async () => {
    const createWavUrl = vi.fn(async () => "wav-url");
    const createZipUrl = vi.fn(async () => "zip-url");
    const service = new TimelineDawRenderDeliveryService(
      { save: vi.fn(), createDeliveryUrl: createWavUrl },
      { save: vi.fn(), createDeliveryUrl: createZipUrl },
    );
    await expect(service.createDeliveryUrl({
      ownerId: "owner-1", sessionId: "session-1",
      job: completedJob("stem", "supabase://timeline-daw-renders/owner-1/session-1/job-1-stems.zip"),
    })).resolves.toBe("zip-url");
    expect(createWavUrl).not.toHaveBeenCalled();
    expect(createZipUrl).toHaveBeenCalledWith(expect.objectContaining({
      contentType: "application/zip", jobId: "job-1",
    }));
  });

  it("keeps completed mix re-downloads on the WAV artifact store", async () => {
    const createWavUrl = vi.fn(async () => "wav-url");
    const createZipUrl = vi.fn(async () => "zip-url");
    const service = new TimelineDawRenderDeliveryService(
      { save: vi.fn(), createDeliveryUrl: createWavUrl },
      { save: vi.fn(), createDeliveryUrl: createZipUrl },
    );
    await expect(service.createDeliveryUrl({
      ownerId: "owner-1", sessionId: "session-1",
      job: completedJob("mix", "supabase://timeline-daw-renders/owner-1/session-1/job-1.wav"),
    })).resolves.toBe("wav-url");
    expect(createZipUrl).not.toHaveBeenCalled();
  });
});
