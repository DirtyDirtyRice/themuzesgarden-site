import { createHash } from "node:crypto";
import { TimelineDawSessionCoordinator } from "./TimelineDawSessionCoordinator";
import type {
  TimelineDawInterchangeArtifact,
  TimelineDawInterchangePackageStore,
} from "./TimelineDawInterchangePackageStore";
import {
  TimelineDawWorkspaceConflictError,
  type TimelineDawWorkspaceDocument,
  type TimelineDawWorkspaceStore,
} from "./TimelineDawWorkspaceService";
import {
  TimelineInterchangeExportEngine,
  type TimelineInterchangePackage,
} from "./TimelineInterchangeExportEngine";
import type { TimelineOfflineRenderJob } from "./TimelineOfflineRenderAndExportEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";
import { TimelineZipStoreEngine } from "./TimelineZipStoreEngine";

const encoder = new TextEncoder();

export type TimelineDawInterchangeReceipt = {
  workspaceRevision: number;
  package: TimelineInterchangePackage;
  artifact: TimelineDawInterchangeArtifact;
  deliveryUrl: string;
};

export class TimelineDawInterchangePackageService {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly workspaceStore: TimelineDawWorkspaceStore,
    private readonly packageStore: TimelineDawInterchangePackageStore,
    private readonly zip = new TimelineZipStoreEngine(),
  ) {}

  execute(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    jobIds: TimelineId[];
    name: string;
    destination: string;
    expectedWorkspaceRevision: number;
    workerId: string;
  }): Promise<TimelineDawInterchangeReceipt> {
    const operation = this.queue.then(() => this.executeSerial(input));
    this.queue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  async snapshot(actorId: TimelineUserId, sessionId: TimelineId) {
    await this.queue;
    const document = await this.workspaceStore.load();
    if (!document) throw new Error("DAW workspace was not found.");
    this.requireOwner(document, actorId, sessionId);
    return {
      workspaceRevision: document.revision,
      packages: document.archive.interchange?.[sessionId]?.packages ?? [],
    };
  }

  async createDeliveryUrl(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    packageId: TimelineId;
  }): Promise<string> {
    const snapshot = await this.snapshot(input.actorId, input.sessionId);
    const value = snapshot.packages.find((item) => item.id === input.packageId);
    if (!value || value.status !== "delivered" || !value.deliveryReference) {
      throw new Error("Delivered interchange package was not found.");
    }
    return this.packageStore.createDeliveryUrl({
      ownerId: input.actorId,
      sessionId: input.sessionId,
      packageId: value.id,
      uri: value.deliveryReference,
      byteLength: 0,
      checksum: value.manifestFingerprint,
      contentType: "application/zip",
    });
  }

  private async executeSerial(input: {
    actorId: TimelineUserId;
    sessionId: TimelineId;
    jobIds: TimelineId[];
    name: string;
    destination: string;
    expectedWorkspaceRevision: number;
    workerId: string;
  }): Promise<TimelineDawInterchangeReceipt> {
    const document = await this.workspaceStore.load();
    if (!document) throw new Error("DAW workspace was not found.");
    if (document.revision !== input.expectedWorkspaceRevision) {
      throw new TimelineDawWorkspaceConflictError(
        `DAW workspace revision conflict: expected ${input.expectedWorkspaceRevision}, current ${document.revision}.`,
      );
    }
    const session = this.requireOwner(document, input.actorId, input.sessionId);
    const jobs = this.completedJobs(document, input.sessionId, input.jobIds);
    const engine = new TimelineInterchangeExportEngine();
    const archive = document.archive.interchange?.[input.sessionId];
    if (archive) engine.restoreArchive(archive);

    const loaded = await Promise.all(jobs.map(async (job, index) => {
      const bytes = await this.packageStore.load(job.outputUri!);
      const checksum = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
      if (checksum !== job.checksum) throw new Error(`Render ${job.id} failed package fingerprint verification.`);
      const extension = job.target === "stem" ? "zip" : job.format;
      return { job, bytes, path: `renders/${String(index + 1).padStart(2, "0")}-${job.id}.${extension}` };
    }));
    const seedManifest = encoder.encode(JSON.stringify({
      schema: "the-muzes-garden/interchange-input/v1",
      projectId: session.projectId,
      sessionId: input.sessionId,
      renders: jobs.map((job) => ({ id: job.id, checksum: job.checksum })),
    }, null, 2));
    const manifestChecksum = `sha256:${createHash("sha256").update(seedManifest).digest("hex")}`;
    let value = engine.createPackage({
      projectId: session.projectId,
      name: input.name,
      destination: input.destination,
      specification: {
        format: "archive",
        sampleRate: jobs[0].sampleRate,
        bitDepth: jobs[0].bitDepth,
        startTimecode: "00:00:00:00",
        handleLengthMs: 0,
        consolidateAudio: false,
        includeMedia: true,
        requiredRoles: ["manifest"],
      },
      assets: [
        ...loaded.map(({ job, bytes, path }) => ({
          artifactId: job.id,
          role: job.target === "stem" ? "session" as const : "audio" as const,
          path,
          format: job.target === "stem" ? "zip" : job.format,
          mediaType: job.target === "stem" ? "application/zip" : "audio/wav",
          fingerprint: job.checksum!,
          sizeBytes: bytes.byteLength,
          ...(job.target === "stem" ? {} : {
            durationMs: Math.max(1, Math.round((job.totalFrames / job.sampleRate) * 1000)),
            sampleRate: job.sampleRate,
            bitDepth: job.bitDepth,
            channels: job.channels,
          }),
        })),
        {
          artifactId: `${input.sessionId}-manifest`,
          role: "manifest",
          path: "manifest-input.json",
          format: "json",
          mediaType: "application/json",
          fingerprint: manifestChecksum,
          sizeBytes: seedManifest.byteLength,
        },
      ],
      createdBy: input.workerId,
    });
    value = engine.verify({
      packageId: value.id,
      observedFingerprints: Object.fromEntries(value.assets.map((asset) => [asset.id, asset.fingerprint])),
      verifiedBy: input.workerId,
    });
    value = engine.approve({ packageId: value.id, approvedBy: input.actorId });
    const packageManifest = encoder.encode(JSON.stringify(value, null, 2));
    const zipped = this.zip.create([
      ...loaded.map(({ path, bytes }) => ({ name: path, bytes })),
      { name: "manifest-input.json", bytes: seedManifest },
      { name: "package.json", bytes: packageManifest },
    ]);
    const artifact = await this.packageStore.save({
      ownerId: input.actorId,
      sessionId: input.sessionId,
      packageId: value.id,
      bytes: zipped.bytes,
      checksum: zipped.checksum,
    });
    value = engine.deliver({
      packageId: value.id,
      deliveryReference: artifact.uri,
      deliveredBy: input.actorId,
    });
    const next: TimelineDawWorkspaceDocument = {
      revision: document.revision + 1,
      archive: {
        ...document.archive,
        interchange: {
          ...document.archive.interchange,
          [input.sessionId]: engine.exportArchive(),
        },
      },
      updatedAt: new Date().toISOString(),
    };
    await this.workspaceStore.save(next, document.revision);
    return {
      workspaceRevision: next.revision,
      package: value,
      artifact,
      deliveryUrl: await this.packageStore.createDeliveryUrl(artifact),
    };
  }

  private completedJobs(
    document: TimelineDawWorkspaceDocument,
    sessionId: TimelineId,
    requestedIds: TimelineId[],
  ): TimelineOfflineRenderJob[] {
    const ids = [...new Set(requestedIds.map((id) => id.trim()).filter(Boolean))];
    if (!ids.length) throw new Error("Interchange package requires at least one completed render.");
    const jobs = document.archive.renders?.[sessionId]?.jobs ?? [];
    return ids.map((id) => {
      const job = jobs.find((candidate) => candidate.id === id);
      if (!job || job.state !== "completed" || !job.outputUri || !job.checksum) {
        throw new Error(`Completed render ${id} was not found.`);
      }
      return job;
    });
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
      throw new Error("Interchange package access is limited to its session owner.");
    }
    return session;
  }
}
