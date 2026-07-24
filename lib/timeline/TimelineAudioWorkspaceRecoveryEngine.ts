import {
  TimelineAudioArtifactIntegrityEngine,
  type TimelineArtifactIntegrityArchive,
} from "./TimelineAudioArtifactIntegrityEngine";
import {
  TimelineAudioArtifactRepositoryEngine,
  type TimelineAudioArtifactArchive,
} from "./TimelineAudioArtifactRepositoryEngine";
import {
  TimelineAudioProcessingQueueEngine,
  type TimelineAudioProcessingArchive,
} from "./TimelineAudioProcessingQueueEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineAudioRecoveryManifest = {
  tracks: number;
  revisions: number;
  jobs: number;
  artifacts: number;
  replicas: number;
  references: number;
  integrityIssues: number;
  integrityScans: number;
  repairs: number;
};

export type TimelineAudioRecoverySnapshot = {
  schemaVersion: 1;
  id: TimelineId;
  label: string;
  createdAt: string;
  createdBy: TimelineUserId;
  manifest: TimelineAudioRecoveryManifest;
  processing: TimelineAudioProcessingArchive;
  artifacts: TimelineAudioArtifactArchive;
  integrity: TimelineArtifactIntegrityArchive;
  checksum: string;
};

export type TimelineAudioRecoveryIssue = {
  code:
    | "checksum-mismatch"
    | "schema-unsupported"
    | "artifact-reference-broken"
    | "replica-reference-broken"
    | "job-output-artifact-missing";
  message: string;
  ownerId?: TimelineId;
};

export type TimelineAudioRecoveryValidation = {
  valid: boolean;
  issues: TimelineAudioRecoveryIssue[];
  manifest: TimelineAudioRecoveryManifest;
};

export type TimelineAudioRecoveredWorkspace = {
  queue: TimelineAudioProcessingQueueEngine;
  artifacts: TimelineAudioArtifactRepositoryEngine;
  integrity: TimelineAudioArtifactIntegrityEngine;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function checksum(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelineAudioWorkspaceRecoveryEngine {
  private readonly snapshots = new Map<
    TimelineId,
    TimelineAudioRecoverySnapshot
  >();
  private sequence = 0;

  constructor(
    readonly queue = new TimelineAudioProcessingQueueEngine(),
    readonly artifacts = new TimelineAudioArtifactRepositoryEngine(),
    readonly integrity = new TimelineAudioArtifactIntegrityEngine(artifacts),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createSnapshot(input: {
    label: string;
    createdBy: TimelineUserId;
  }): TimelineAudioRecoverySnapshot {
    const processing = this.queue.exportArchive();
    const artifacts = this.artifacts.exportArchive();
    const integrity = this.integrity.exportArchive();
    const snapshotWithoutChecksum = {
      schemaVersion: 1 as const,
      id: `timeline-audio-recovery-${++this.sequence}`,
      label: input.label.trim() || "Audio workspace recovery point",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
      manifest: this.manifest(processing, artifacts, integrity),
      processing,
      artifacts,
      integrity,
    };
    const snapshot: TimelineAudioRecoverySnapshot = {
      ...snapshotWithoutChecksum,
      checksum: checksum(snapshotWithoutChecksum),
    };
    this.snapshots.set(snapshot.id, clone(snapshot));
    return clone(snapshot);
  }

  validateSnapshot(
    snapshot: TimelineAudioRecoverySnapshot,
  ): TimelineAudioRecoveryValidation {
    const issues: TimelineAudioRecoveryIssue[] = [];
    if (snapshot.schemaVersion !== 1) {
      issues.push({
        code: "schema-unsupported",
        message: `Recovery schema ${snapshot.schemaVersion} is unsupported.`,
      });
    }
    const { checksum: storedChecksum, ...unsigned } = snapshot;
    if (checksum(unsigned) !== storedChecksum) {
      issues.push({
        code: "checksum-mismatch",
        message: "Recovery snapshot content does not match its checksum.",
      });
    }
    const artifactIds = new Set(
      snapshot.artifacts.artifacts.map((artifact) => artifact.id),
    );
    const replicas = new Map(
      snapshot.artifacts.artifacts.map((artifact) => [
        artifact.id,
        new Set(artifact.replicas.map((replica) => replica.id)),
      ]),
    );
    const fingerprints = new Set(
      snapshot.artifacts.artifacts.map((artifact) => artifact.fingerprint),
    );
    for (const issue of snapshot.integrity.issues) {
      if (!artifactIds.has(issue.artifactId)) {
        issues.push({
          code: "artifact-reference-broken",
          ownerId: issue.id,
          message: `Integrity issue ${issue.id} references a missing artifact.`,
        });
      } else if (
        issue.replicaId &&
        !replicas.get(issue.artifactId)?.has(issue.replicaId)
      ) {
        issues.push({
          code: "replica-reference-broken",
          ownerId: issue.id,
          message: `Integrity issue ${issue.id} references a missing replica.`,
        });
      }
    }
    for (const repair of snapshot.integrity.repairs) {
      const artifactReplicas = replicas.get(repair.artifactId);
      if (!artifactIds.has(repair.artifactId)) {
        issues.push({
          code: "artifact-reference-broken",
          ownerId: repair.id,
          message: `Repair ${repair.id} references a missing artifact.`,
        });
      } else if (
        !artifactReplicas?.has(repair.sourceReplicaId) ||
        !artifactReplicas.has(repair.targetReplicaId)
      ) {
        issues.push({
          code: "replica-reference-broken",
          ownerId: repair.id,
          message: `Repair ${repair.id} references a missing replica.`,
        });
      }
    }
    for (const job of snapshot.processing.jobs) {
      if (
        job.state === "succeeded" &&
        job.output &&
        !fingerprints.has(job.output.fingerprint)
      ) {
        issues.push({
          code: "job-output-artifact-missing",
          ownerId: job.id,
          message: `Succeeded job ${job.id} output is absent from artifact storage.`,
        });
      }
    }
    return {
      valid: issues.length === 0,
      issues,
      manifest: this.manifest(
        snapshot.processing,
        snapshot.artifacts,
        snapshot.integrity,
      ),
    };
  }

  restoreSnapshot(
    snapshot: TimelineAudioRecoverySnapshot,
  ): TimelineAudioRecoveredWorkspace {
    const validation = this.validateSnapshot(snapshot);
    if (!validation.valid) {
      throw new Error(
        `Recovery snapshot is invalid: ${validation.issues
          .map((issue) => issue.message)
          .join(" ")}`,
      );
    }
    const queue = new TimelineAudioProcessingQueueEngine();
    queue.restoreArchive(snapshot.processing);
    const artifacts = new TimelineAudioArtifactRepositoryEngine();
    artifacts.restoreArchive(snapshot.artifacts);
    const integrity = new TimelineAudioArtifactIntegrityEngine(artifacts);
    integrity.restoreArchive(snapshot.integrity);
    return { queue, artifacts, integrity };
  }

  getSnapshot(snapshotId: TimelineId): TimelineAudioRecoverySnapshot | null {
    const snapshot = this.snapshots.get(snapshotId);
    return snapshot ? clone(snapshot) : null;
  }

  listSnapshots(): TimelineAudioRecoverySnapshot[] {
    return Array.from(this.snapshots.values()).map(clone);
  }

  removeSnapshot(snapshotId: TimelineId): boolean {
    return this.snapshots.delete(snapshotId);
  }

  restoreCatalog(snapshots: TimelineAudioRecoverySnapshot[]): void {
    this.snapshots.clear();
    this.sequence = 0;
    for (const snapshot of snapshots) {
      if (this.snapshots.has(snapshot.id)) {
        throw new Error(`Duplicate recovery snapshot ID ${snapshot.id}.`);
      }
      this.snapshots.set(snapshot.id, clone(snapshot));
      this.sequence = Math.max(this.sequence, this.idSequence(snapshot.id));
    }
  }

  private manifest(
    processing: TimelineAudioProcessingArchive,
    artifacts: TimelineAudioArtifactArchive,
    integrity: TimelineArtifactIntegrityArchive,
  ): TimelineAudioRecoveryManifest {
    const tracks = processing.revisions.tracks.tracks.length;
    const revisions = processing.revisions.revisions.length;
    return {
      tracks,
      revisions,
      jobs: processing.jobs.length,
      artifacts: artifacts.artifacts.length,
      replicas: artifacts.artifacts.reduce(
        (total, artifact) => total + artifact.replicas.length,
        0,
      ),
      references: artifacts.artifacts.reduce(
        (total, artifact) => total + artifact.references.length,
        0,
      ),
      integrityIssues: integrity.issues.length,
      integrityScans: integrity.scans.length,
      repairs: integrity.repairs.length,
    };
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineAudioWorkspaceRecoveryEngine =
  new TimelineAudioWorkspaceRecoveryEngine();
