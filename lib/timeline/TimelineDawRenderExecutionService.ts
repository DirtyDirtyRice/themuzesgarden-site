import { TimelineDawSessionCoordinator } from "./TimelineDawSessionCoordinator";
import type {
  TimelineDawRenderArtifact,
  TimelineDawRenderArtifactStore,
} from "./TimelineDawRenderArtifactStore";
import {
  TimelineDawWorkspaceConflictError,
  type TimelineDawWorkspaceDocument,
  type TimelineDawWorkspaceStore,
} from "./TimelineDawWorkspaceService";
import {
  TimelineOfflineRenderAndExportEngine,
  type TimelineOfflineRenderJob,
} from "./TimelineOfflineRenderAndExportEngine";
import {
  TimelinePcmWavRenderWorker,
  type TimelinePcmWavRenderProgress,
} from "./TimelinePcmWavRenderWorker";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineDawRenderExecutionReceipt = {
  workspaceRevision: number;
  job: TimelineOfflineRenderJob;
  artifact: TimelineDawRenderArtifact;
  deliveryUrl: string;
  progress: TimelinePcmWavRenderProgress[];
};

export class TimelineDawRenderExecutionService {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly workspaceStore: TimelineDawWorkspaceStore,
    private readonly artifactStore: TimelineDawRenderArtifactStore,
    private readonly worker = new TimelinePcmWavRenderWorker(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  execute(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    expectedWorkspaceRevision: number;
    channels: Float32Array[];
    workerId: string;
    chunkFrames?: number;
  }): Promise<TimelineDawRenderExecutionReceipt> {
    const operation = this.queue.then(() => this.executeSerial(input));
    this.queue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async executeSerial(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    jobId: TimelineId;
    expectedWorkspaceRevision: number;
    channels: Float32Array[];
    workerId: string;
    chunkFrames?: number;
  }): Promise<TimelineDawRenderExecutionReceipt> {
    let document = await this.workspaceStore.load();
    if (!document) throw new Error("DAW workspace was not found.");
    if (document.revision !== input.expectedWorkspaceRevision) {
      throw new TimelineDawWorkspaceConflictError(
        `DAW workspace revision conflict: expected ${input.expectedWorkspaceRevision}, current ${document.revision}.`,
      );
    }
    const session = this.requireOwnedSession(document, input.actorId, input.sessionId);
    const engine = new TimelineOfflineRenderAndExportEngine();
    const archive = document.archive.renders?.[input.sessionId];
    if (!archive) throw new Error("DAW render history was not found.");
    engine.restoreArchive(archive);
    const current = engine.getJob(input.jobId);
    if (current.projectId !== session.projectId) {
      throw new Error("DAW render job does not belong to this session project.");
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

    const progress: TimelinePcmWavRenderProgress[] = [];
    try {
      const rendered = this.worker.render({
        job: queued,
        channels: input.channels,
        workerId: input.workerId,
        chunkFrames: input.chunkFrames,
        onProgress: (event) => progress.push(event),
      });
      for (const event of progress) {
        running = engine.reportProgress({
          jobId: running.id,
          expectedHead: running.head,
          renderedFrames: event.renderedFrames,
          workerId: input.workerId,
        });
        document = await this.persist(document, input.sessionId, engine);
      }
      const artifact = await this.artifactStore.save({
        ownerId: input.actorId,
        sessionId: input.sessionId,
        jobId: running.id,
        bytes: rendered.bytes,
        checksum: rendered.checksum,
        contentType: rendered.mimeType,
      });
      const deliveryUrl = await this.artifactStore.createDeliveryUrl(artifact);
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
        progress,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "PCM WAV rendering failed.";
      const latest = engine.getJob(input.jobId);
      if (latest.state === "rendering") {
        engine.fail({
          jobId: latest.id,
          expectedHead: latest.head,
          message,
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
  ): Promise<TimelineDawWorkspaceDocument> {
    const next = {
      revision: document.revision + 1,
      archive: {
        ...document.archive,
        renders: {
          ...document.archive.renders,
          [sessionId]: engine.exportArchive(),
        },
      },
      updatedAt: this.now().toISOString(),
    };
    await this.workspaceStore.save(next, document.revision);
    return next;
  }

  private requireOwnedSession(
    document: TimelineDawWorkspaceDocument,
    actorId: TimelineUserId,
    sessionId: TimelineId,
  ) {
    const coordinator = new TimelineDawSessionCoordinator();
    coordinator.restoreArchive(document.archive);
    const session = coordinator.get(sessionId);
    if (!session || session.ownerId !== actorId) {
      throw new Error("DAW render execution is limited to its session owner.");
    }
    return session;
  }
}
