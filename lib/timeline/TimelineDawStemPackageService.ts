import { TimelineDawSessionCoordinator } from "./TimelineDawSessionCoordinator";
import type { TimelineDawRenderSourceStore } from "./TimelineDawRenderSourceStore";
import { TimelineDawRenderSourceMixer } from "./TimelineDawRenderSourceMixer";
import type {
  TimelineDawStemPackageArtifact,
  TimelineDawStemPackageStore,
} from "./TimelineDawStemPackageStore";
import {
  TimelineDawWorkspaceConflictError,
  type TimelineDawWorkspaceDocument,
  type TimelineDawWorkspaceStore,
} from "./TimelineDawWorkspaceService";
import {
  TimelineOfflineRenderAndExportEngine,
  type TimelineOfflineRenderJob,
} from "./TimelineOfflineRenderAndExportEngine";
import { TimelinePcmWavRenderWorker } from "./TimelinePcmWavRenderWorker";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";
import { TimelineZipStoreEngine } from "./TimelineZipStoreEngine";

export type TimelineDawStemPackageReceipt = {
  workspaceRevision: number;
  job: TimelineOfflineRenderJob;
  artifact: TimelineDawStemPackageArtifact;
  deliveryUrl: string;
  progressUpdates: number;
  stems: Array<{
    sourceId: TimelineId;
    name: string;
    byteLength: number;
    checksum: string;
  }>;
};

export class TimelineDawStemPackageService {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly workspaceStore: TimelineDawWorkspaceStore,
    private readonly sourceStore: TimelineDawRenderSourceStore,
    private readonly packageStore: TimelineDawStemPackageStore,
    private readonly worker = new TimelinePcmWavRenderWorker(),
    private readonly zip = new TimelineZipStoreEngine(),
  ) {}

  execute(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    expectedWorkspaceRevision: number;
    workerId: string;
    chunkFrames?: number;
  }): Promise<TimelineDawStemPackageReceipt> {
    const operation = this.queue.then(() => this.executeSerial(input));
    this.queue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async executeSerial(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    expectedWorkspaceRevision: number;
    workerId: string;
    chunkFrames?: number;
  }): Promise<TimelineDawStemPackageReceipt> {
    let document = await this.workspaceStore.load();
    if (!document) throw new Error("DAW workspace was not found.");
    if (document.revision !== input.expectedWorkspaceRevision) {
      throw new TimelineDawWorkspaceConflictError(
        `DAW workspace revision conflict: expected ${input.expectedWorkspaceRevision}, current ${document.revision}.`,
      );
    }
    const session = this.requireOwner(document, input.actorId, input.sessionId);
    const archive = document.archive.renders?.[input.sessionId];
    if (!archive) throw new Error("DAW render history was not found.");
    const engine = new TimelineOfflineRenderAndExportEngine();
    engine.restoreArchive(archive);
    const current = engine.getJob(input.jobId);
    if (current.projectId !== session.projectId) throw new Error("Stem job belongs to another project.");
    if (current.target !== "stem" || current.format !== "wav") {
      throw new Error("Stem package execution requires a WAV stem render job.");
    }
    const queued = engine.queue({
      jobId: current.id,
      expectedHead: current.head,
      queuedBy: input.actorId,
    });
    document = await this.persist(document, input.sessionId, engine);
    let running = engine.start({
      jobId: queued.id,
      expectedHead: queued.head,
      workerId: input.workerId,
    });
    document = await this.persist(document, input.sessionId, engine);
    let progressUpdates = 0;
    try {
      const mixer = new TimelineDawRenderSourceMixer(this.sourceStore);
      const rendered: Array<{ sourceId: string; name: string; bytes: Uint8Array; checksum: string }> = [];
      for (let index = 0; index < queued.sourceIds.length; index += 1) {
        const sourceId = queued.sourceIds[index];
        const stemJob = {
          ...queued,
          id: `${queued.id}-stem-${index + 1}`,
          sourceIds: [sourceId],
        };
        const channels = await mixer.resolve(stemJob, input.actorId);
        const sourceProgress: number[] = [];
        const result = this.worker.render({
          job: stemJob,
          channels,
          workerId: input.workerId,
          chunkFrames: input.chunkFrames,
          onProgress: (event) => sourceProgress.push(event.renderedFrames),
        });
        for (const renderedFrames of sourceProgress) {
          const aggregate = Math.min(
            queued.totalFrames,
            Math.floor(((index * queued.totalFrames) + renderedFrames) / queued.sourceIds.length),
          );
          if (aggregate <= running.renderedFrames) continue;
          running = engine.reportProgress({
            jobId: running.id,
            expectedHead: running.head,
            renderedFrames: aggregate,
            workerId: input.workerId,
          });
          document = await this.persist(document, input.sessionId, engine);
          progressUpdates += 1;
        }
        rendered.push({
          sourceId,
          name: `stems/stem-${String(index + 1).padStart(2, "0")}.wav`,
          bytes: result.bytes,
          checksum: result.checksum,
        });
      }
      if (running.renderedFrames < running.totalFrames) {
        running = engine.reportProgress({
          jobId: running.id,
          expectedHead: running.head,
          renderedFrames: running.totalFrames,
          workerId: input.workerId,
        });
        document = await this.persist(document, input.sessionId, engine);
        progressUpdates += 1;
      }
      const zipped = this.zip.create(rendered.map((stem) => ({ name: stem.name, bytes: stem.bytes })));
      const artifact = await this.packageStore.save({
        ownerId: input.actorId,
        sessionId: input.sessionId,
        jobId: running.id,
        bytes: zipped.bytes,
        checksum: zipped.checksum,
      });
      const deliveryUrl = await this.packageStore.createDeliveryUrl(artifact);
      const completed = engine.complete({
        jobId: running.id,
        expectedHead: running.head,
        outputUri: artifact.uri,
        checksum: artifact.checksum,
        workerId: input.workerId,
      });
      document = await this.persist(document, input.sessionId, engine);
      return {
        workspaceRevision: document.revision,
        job: completed,
        artifact,
        deliveryUrl,
        progressUpdates,
        stems: rendered.map(({ sourceId, name, bytes, checksum }) => ({
          sourceId,
          name,
          byteLength: bytes.byteLength,
          checksum,
        })),
      };
    } catch (error) {
      const latest = engine.getJob(input.jobId);
      if (latest.state === "rendering") {
        engine.fail({
          jobId: latest.id,
          expectedHead: latest.head,
          message: error instanceof Error ? error.message : "Stem package rendering failed.",
          workerId: input.workerId,
        });
        await this.persist(document, input.sessionId, engine);
      }
      throw error;
    }
  }

  private async persist(
    document: TimelineDawWorkspaceDocument,
    sessionId: TimelineId,
    engine: TimelineOfflineRenderAndExportEngine,
  ) {
    const next: TimelineDawWorkspaceDocument = {
      revision: document.revision + 1,
      archive: {
        ...document.archive,
        renders: { ...document.archive.renders, [sessionId]: engine.exportArchive() },
      },
      updatedAt: new Date().toISOString(),
    };
    await this.workspaceStore.save(next, document.revision);
    return next;
  }

  private requireOwner(
    document: TimelineDawWorkspaceDocument,
    actorId: TimelineUserId,
    sessionId: TimelineId,
  ) {
    const coordinator = new TimelineDawSessionCoordinator();
    coordinator.restoreArchive(document.archive);
    const session = coordinator.get(sessionId);
    if (!session || session.ownerId !== actorId) {
      throw new Error("Stem package execution is limited to its session owner.");
    }
    return session;
  }
}
