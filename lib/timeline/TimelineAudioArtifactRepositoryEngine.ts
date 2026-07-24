import type { TimelineAudioProcessingJob } from "./TimelineAudioProcessingQueueEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineAudioArtifactKind =
  "audio" | "midi" | "analysis" | "metadata";

export type TimelineAudioArtifactState =
  "available" | "quarantined" | "missing" | "trash";

export type TimelineAudioReplicaState = "available" | "missing" | "corrupt";

export type TimelineAudioArtifactReplica = {
  id: TimelineId;
  uri: string;
  storageProvider: string;
  region: string;
  state: TimelineAudioReplicaState;
  observedFingerprint: string;
  sizeBytes: number;
  verifiedAt: string;
  verifiedBy: TimelineUserId;
};

export type TimelineAudioArtifactReferenceKind =
  "revision" | "processing-job" | "sound-recipe" | "import" | "release";

export type TimelineAudioArtifactReference = {
  id: TimelineId;
  kind: TimelineAudioArtifactReferenceKind;
  ownerId: TimelineId;
  role: string;
  linkedAt: string;
  linkedBy: TimelineUserId;
};

export type TimelineAudioArtifactRecord = {
  id: TimelineId;
  fingerprint: string;
  kind: TimelineAudioArtifactKind;
  format: string;
  mediaType: string;
  sizeBytes: number;
  durationSeconds?: number;
  state: TimelineAudioArtifactState;
  replicas: TimelineAudioArtifactReplica[];
  references: TimelineAudioArtifactReference[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  trashAt?: string;
  retentionUntil?: string;
};

export type TimelineAudioArtifactIssue = {
  code:
    | "artifact-not-found"
    | "fingerprint-required"
    | "uri-required"
    | "metadata-conflict"
    | "reference-required"
    | "artifact-referenced"
    | "replica-not-found"
    | "replica-missing"
    | "replica-fingerprint-mismatch"
    | "available-replica-required"
    | "job-not-succeeded"
    | "job-output-required";
  message: string;
  artifactId?: TimelineId;
  replicaId?: TimelineId;
  referenceId?: TimelineId;
};

export type TimelineAudioArtifactResult = {
  accepted: boolean;
  artifact: TimelineAudioArtifactRecord | null;
  issues: TimelineAudioArtifactIssue[];
  deduplicated: boolean;
};

export type TimelineAudioArtifactStatistics = {
  artifacts: number;
  available: number;
  quarantined: number;
  missing: number;
  trash: number;
  replicas: number;
  references: number;
  logicalBytes: number;
  physicalBytes: number;
  deduplicatedBytes: number;
};

export type TimelineAudioArtifactArchive = {
  artifacts: TimelineAudioArtifactRecord[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function retentionDate(now: Date, retentionDays: number): string {
  return new Date(
    now.getTime() + Math.max(1, retentionDays) * 24 * 60 * 60 * 1_000,
  ).toISOString();
}

export class TimelineAudioArtifactRepositoryEngine {
  private readonly artifacts = new Map<
    TimelineId,
    TimelineAudioArtifactRecord
  >();
  private readonly fingerprintIds = new Map<string, TimelineId>();
  private artifactSequence = 0;
  private replicaSequence = 0;
  private referenceSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  register(input: {
    fingerprint: string;
    kind: TimelineAudioArtifactKind;
    format: string;
    mediaType: string;
    sizeBytes: number;
    durationSeconds?: number;
    replica: {
      uri: string;
      storageProvider: string;
      region?: string;
    };
    createdBy: TimelineUserId;
  }): TimelineAudioArtifactResult {
    const fingerprint = input.fingerprint.trim();
    if (!fingerprint) {
      return this.failure(
        "fingerprint-required",
        "Artifact fingerprint is required.",
      );
    }
    if (!input.replica.uri.trim()) {
      return this.failure("uri-required", "Artifact replica URI is required.");
    }
    const sizeBytes = Math.max(0, Math.trunc(input.sizeBytes));
    const existingId = this.fingerprintIds.get(fingerprint);
    const existing = existingId ? this.artifacts.get(existingId) : null;
    if (existing) {
      if (
        existing.kind !== input.kind ||
        existing.format !== input.format.trim().toLowerCase() ||
        existing.mediaType !== input.mediaType.trim().toLowerCase() ||
        existing.sizeBytes !== sizeBytes
      ) {
        return {
          accepted: false,
          artifact: clone(existing),
          deduplicated: true,
          issues: [
            {
              code: "metadata-conflict",
              artifactId: existing.id,
              message:
                "The same fingerprint was registered with conflicting metadata.",
            },
          ],
        };
      }
      const duplicateReplica = existing.replicas.some(
        (replica) => replica.uri === input.replica.uri.trim(),
      );
      if (duplicateReplica) {
        return {
          accepted: true,
          artifact: clone(existing),
          issues: [],
          deduplicated: true,
        };
      }
      const now = this.now().toISOString();
      const next: TimelineAudioArtifactRecord = {
        ...clone(existing),
        state: "available",
        replicas: [
          ...existing.replicas,
          this.replica(
            input.replica,
            fingerprint,
            input.sizeBytes,
            input.createdBy,
          ),
        ],
        updatedAt: now,
        updatedBy: input.createdBy,
        trashAt: undefined,
        retentionUntil: undefined,
      };
      this.artifacts.set(next.id, clone(next));
      return {
        accepted: true,
        artifact: clone(next),
        issues: [],
        deduplicated: true,
      };
    }
    const now = this.now().toISOString();
    const artifact: TimelineAudioArtifactRecord = {
      id: `timeline-audio-artifact-${++this.artifactSequence}`,
      fingerprint,
      kind: input.kind,
      format: input.format.trim().toLowerCase(),
      mediaType: input.mediaType.trim().toLowerCase(),
      sizeBytes,
      durationSeconds: input.durationSeconds,
      state: "available",
      replicas: [
        this.replica(
          input.replica,
          fingerprint,
          input.sizeBytes,
          input.createdBy,
        ),
      ],
      references: [],
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.artifacts.set(artifact.id, clone(artifact));
    this.fingerprintIds.set(fingerprint, artifact.id);
    return {
      accepted: true,
      artifact: clone(artifact),
      issues: [],
      deduplicated: false,
    };
  }

  registerCompletedJob(input: {
    job: TimelineAudioProcessingJob;
    kind: TimelineAudioArtifactKind;
    format: string;
    mediaType: string;
    sizeBytes: number;
    durationSeconds?: number;
    storageProvider: string;
    region?: string;
    registeredBy: TimelineUserId;
  }): TimelineAudioArtifactResult {
    if (input.job.state !== "succeeded") {
      return this.failure(
        "job-not-succeeded",
        "Only a succeeded processing job can register an output artifact.",
      );
    }
    if (!input.job.output) {
      return this.failure(
        "job-output-required",
        "Succeeded processing job has no output artifact.",
      );
    }
    const registered = this.register({
      fingerprint: input.job.output.fingerprint,
      kind: input.kind,
      format: input.format,
      mediaType: input.mediaType,
      sizeBytes: input.sizeBytes,
      durationSeconds: input.durationSeconds,
      replica: {
        uri: input.job.output.uri,
        storageProvider: input.storageProvider,
        region: input.region,
      },
      createdBy: input.registeredBy,
    });
    if (!registered.accepted || !registered.artifact) return registered;
    this.linkReference({
      artifactId: registered.artifact.id,
      kind: "processing-job",
      ownerId: input.job.id,
      role: input.job.output.role,
      linkedBy: input.registeredBy,
    });
    return this.linkReference({
      artifactId: registered.artifact.id,
      kind: "revision",
      ownerId: input.job.revisionId,
      role: "rendered-output",
      linkedBy: input.registeredBy,
    });
  }

  linkReference(input: {
    artifactId: TimelineId;
    kind: TimelineAudioArtifactReferenceKind;
    ownerId: TimelineId;
    role: string;
    linkedBy: TimelineUserId;
  }): TimelineAudioArtifactResult {
    const artifact = this.artifacts.get(input.artifactId);
    if (!artifact) return this.notFound(input.artifactId);
    if (!input.ownerId.trim() || !input.role.trim()) {
      return {
        accepted: false,
        artifact: clone(artifact),
        deduplicated: false,
        issues: [
          {
            code: "reference-required",
            artifactId: artifact.id,
            message: "Artifact reference requires an owner ID and role.",
          },
        ],
      };
    }
    const existing = artifact.references.find(
      (reference) =>
        reference.kind === input.kind &&
        reference.ownerId === input.ownerId &&
        reference.role === input.role.trim(),
    );
    if (existing) {
      return {
        accepted: true,
        artifact: clone(artifact),
        issues: [],
        deduplicated: true,
      };
    }
    const now = this.now().toISOString();
    const reference: TimelineAudioArtifactReference = {
      id: `timeline-audio-reference-${++this.referenceSequence}`,
      kind: input.kind,
      ownerId: input.ownerId,
      role: input.role.trim(),
      linkedAt: now,
      linkedBy: input.linkedBy,
    };
    const next: TimelineAudioArtifactRecord = {
      ...clone(artifact),
      references: [...artifact.references, reference],
      state: this.replicaState(artifact.replicas),
      trashAt: undefined,
      retentionUntil: undefined,
      updatedAt: now,
      updatedBy: input.linkedBy,
    };
    this.artifacts.set(next.id, clone(next));
    return {
      accepted: true,
      artifact: clone(next),
      issues: [],
      deduplicated: false,
    };
  }

  unlinkReference(input: {
    artifactId: TimelineId;
    referenceId: TimelineId;
    unlinkedBy: TimelineUserId;
    retentionDays?: number;
  }): TimelineAudioArtifactResult {
    const artifact = this.artifacts.get(input.artifactId);
    if (!artifact) return this.notFound(input.artifactId);
    if (
      !artifact.references.some(
        (reference) => reference.id === input.referenceId,
      )
    ) {
      return {
        accepted: false,
        artifact: clone(artifact),
        deduplicated: false,
        issues: [
          {
            code: "reference-required",
            artifactId: artifact.id,
            referenceId: input.referenceId,
            message: "Artifact reference was not found.",
          },
        ],
      };
    }
    const nowDate = this.now();
    const references = artifact.references.filter(
      (reference) => reference.id !== input.referenceId,
    );
    const next: TimelineAudioArtifactRecord = {
      ...clone(artifact),
      references,
      state: references.length ? artifact.state : "trash",
      trashAt: references.length ? undefined : nowDate.toISOString(),
      retentionUntil: references.length
        ? undefined
        : retentionDate(nowDate, input.retentionDays ?? 30),
      updatedAt: nowDate.toISOString(),
      updatedBy: input.unlinkedBy,
    };
    this.artifacts.set(next.id, clone(next));
    return {
      accepted: true,
      artifact: clone(next),
      issues: [],
      deduplicated: false,
    };
  }

  verifyReplica(input: {
    artifactId: TimelineId;
    replicaId: TimelineId;
    exists: boolean;
    observedFingerprint?: string;
    observedSizeBytes?: number;
    verifiedBy: TimelineUserId;
  }): TimelineAudioArtifactResult {
    const artifact = this.artifacts.get(input.artifactId);
    if (!artifact) return this.notFound(input.artifactId);
    const index = artifact.replicas.findIndex(
      (replica) => replica.id === input.replicaId,
    );
    if (index < 0) {
      return {
        accepted: false,
        artifact: clone(artifact),
        deduplicated: false,
        issues: [
          {
            code: "replica-not-found",
            artifactId: artifact.id,
            replicaId: input.replicaId,
            message: "Artifact replica was not found.",
          },
        ],
      };
    }
    const now = this.now().toISOString();
    const fingerprint = input.observedFingerprint?.trim() ?? "";
    const matches =
      input.exists &&
      fingerprint === artifact.fingerprint &&
      (input.observedSizeBytes === undefined ||
        input.observedSizeBytes === artifact.sizeBytes);
    const state: TimelineAudioReplicaState = !input.exists
      ? "missing"
      : matches
        ? "available"
        : "corrupt";
    const replicas = clone(artifact.replicas);
    replicas[index] = {
      ...replicas[index],
      state,
      observedFingerprint: fingerprint,
      sizeBytes: input.observedSizeBytes ?? replicas[index].sizeBytes,
      verifiedAt: now,
      verifiedBy: input.verifiedBy,
    };
    const next: TimelineAudioArtifactRecord = {
      ...clone(artifact),
      state: artifact.state === "trash" ? "trash" : this.replicaState(replicas),
      replicas,
      updatedAt: now,
      updatedBy: input.verifiedBy,
    };
    this.artifacts.set(next.id, clone(next));
    return {
      accepted: matches,
      artifact: clone(next),
      deduplicated: false,
      issues: matches
        ? []
        : [
            {
              code: input.exists
                ? "replica-fingerprint-mismatch"
                : "replica-missing",
              artifactId: artifact.id,
              replicaId: replicas[index].id,
              message: input.exists
                ? "Replica fingerprint or size does not match the artifact."
                : "Artifact replica is missing.",
            },
          ],
    };
  }

  moveToTrash(input: {
    artifactId: TimelineId;
    movedBy: TimelineUserId;
    retentionDays?: number;
  }): TimelineAudioArtifactResult {
    const artifact = this.artifacts.get(input.artifactId);
    if (!artifact) return this.notFound(input.artifactId);
    if (artifact.references.length) {
      return {
        accepted: false,
        artifact: clone(artifact),
        deduplicated: false,
        issues: [
          {
            code: "artifact-referenced",
            artifactId: artifact.id,
            message:
              "Referenced artifacts cannot enter trash until links are removed.",
          },
        ],
      };
    }
    const now = this.now();
    const next: TimelineAudioArtifactRecord = {
      ...clone(artifact),
      state: "trash",
      trashAt: now.toISOString(),
      retentionUntil: retentionDate(now, input.retentionDays ?? 30),
      updatedAt: now.toISOString(),
      updatedBy: input.movedBy,
    };
    this.artifacts.set(next.id, clone(next));
    return {
      accepted: true,
      artifact: clone(next),
      issues: [],
      deduplicated: false,
    };
  }

  restoreFromTrash(input: {
    artifactId: TimelineId;
    restoredBy: TimelineUserId;
  }): TimelineAudioArtifactResult {
    const artifact = this.artifacts.get(input.artifactId);
    if (!artifact) return this.notFound(input.artifactId);
    const state = this.replicaState(artifact.replicas);
    if (state !== "available") {
      return {
        accepted: false,
        artifact: clone(artifact),
        deduplicated: false,
        issues: [
          {
            code: "available-replica-required",
            artifactId: artifact.id,
            message:
              "Trash restoration requires at least one verified replica.",
          },
        ],
      };
    }
    const now = this.now().toISOString();
    const next: TimelineAudioArtifactRecord = {
      ...clone(artifact),
      state,
      trashAt: undefined,
      retentionUntil: undefined,
      updatedAt: now,
      updatedBy: input.restoredBy,
    };
    this.artifacts.set(next.id, clone(next));
    return {
      accepted: true,
      artifact: clone(next),
      issues: [],
      deduplicated: false,
    };
  }

  purgeExpired(): TimelineId[] {
    const now = this.now().getTime();
    const purged: TimelineId[] = [];
    Array.from(this.artifacts.values())
      .filter(
        (artifact) =>
          artifact.state === "trash" &&
          artifact.references.length === 0 &&
          Boolean(artifact.retentionUntil) &&
          Date.parse(artifact.retentionUntil!) <= now,
      )
      .forEach((artifact) => {
        this.artifacts.delete(artifact.id);
        this.fingerprintIds.delete(artifact.fingerprint);
        purged.push(artifact.id);
      });
    return purged;
  }

  getArtifact(artifactId: TimelineId): TimelineAudioArtifactRecord | null {
    const artifact = this.artifacts.get(artifactId);
    return artifact ? clone(artifact) : null;
  }

  findByFingerprint(fingerprint: string): TimelineAudioArtifactRecord | null {
    const id = this.fingerprintIds.get(fingerprint.trim());
    return id ? this.getArtifact(id) : null;
  }

  listArtifacts(
    state?: TimelineAudioArtifactState,
  ): TimelineAudioArtifactRecord[] {
    return Array.from(this.artifacts.values())
      .filter((artifact) => !state || artifact.state === state)
      .map(clone);
  }

  statistics(): TimelineAudioArtifactStatistics {
    const artifacts = Array.from(this.artifacts.values());
    const replicas = artifacts.flatMap((artifact) => artifact.replicas);
    const logicalBytes = artifacts.reduce(
      (total, artifact) =>
        total + artifact.sizeBytes * Math.max(1, artifact.references.length),
      0,
    );
    const physicalBytes = replicas.reduce(
      (total, replica) => total + replica.sizeBytes,
      0,
    );
    return {
      artifacts: artifacts.length,
      available: artifacts.filter((artifact) => artifact.state === "available")
        .length,
      quarantined: artifacts.filter(
        (artifact) => artifact.state === "quarantined",
      ).length,
      missing: artifacts.filter((artifact) => artifact.state === "missing")
        .length,
      trash: artifacts.filter((artifact) => artifact.state === "trash").length,
      replicas: replicas.length,
      references: artifacts.reduce(
        (total, artifact) => total + artifact.references.length,
        0,
      ),
      logicalBytes,
      physicalBytes,
      deduplicatedBytes: Math.max(0, logicalBytes - physicalBytes),
    };
  }

  exportArchive(): TimelineAudioArtifactArchive {
    return { artifacts: this.listArtifacts() };
  }

  restoreArchive(archive: TimelineAudioArtifactArchive): void {
    this.artifacts.clear();
    this.fingerprintIds.clear();
    this.artifactSequence = 0;
    this.replicaSequence = 0;
    this.referenceSequence = 0;
    archive.artifacts.forEach((artifact) => {
      if (this.artifacts.has(artifact.id)) {
        throw new Error(`Duplicate artifact ID ${artifact.id}.`);
      }
      if (this.fingerprintIds.has(artifact.fingerprint)) {
        throw new Error(
          `Duplicate artifact fingerprint ${artifact.fingerprint}.`,
        );
      }
      this.artifacts.set(artifact.id, clone(artifact));
      this.fingerprintIds.set(artifact.fingerprint, artifact.id);
      this.artifactSequence = Math.max(
        this.artifactSequence,
        this.idSequence(artifact.id),
      );
      artifact.replicas.forEach((replica) => {
        this.replicaSequence = Math.max(
          this.replicaSequence,
          this.idSequence(replica.id),
        );
      });
      artifact.references.forEach((reference) => {
        this.referenceSequence = Math.max(
          this.referenceSequence,
          this.idSequence(reference.id),
        );
      });
    });
  }

  private replica(
    input: { uri: string; storageProvider: string; region?: string },
    fingerprint: string,
    sizeBytes: number,
    createdBy: TimelineUserId,
  ): TimelineAudioArtifactReplica {
    return {
      id: `timeline-audio-replica-${++this.replicaSequence}`,
      uri: input.uri.trim(),
      storageProvider: input.storageProvider.trim(),
      region: input.region?.trim() ?? "",
      state: "available",
      observedFingerprint: fingerprint,
      sizeBytes: Math.max(0, Math.trunc(sizeBytes)),
      verifiedAt: this.now().toISOString(),
      verifiedBy: createdBy,
    };
  }

  private replicaState(
    replicas: TimelineAudioArtifactReplica[],
  ): TimelineAudioArtifactState {
    if (replicas.some((replica) => replica.state === "available")) {
      return "available";
    }
    if (replicas.some((replica) => replica.state === "corrupt")) {
      return "quarantined";
    }
    return "missing";
  }

  private failure(
    code: TimelineAudioArtifactIssue["code"],
    message: string,
  ): TimelineAudioArtifactResult {
    return {
      accepted: false,
      artifact: null,
      deduplicated: false,
      issues: [{ code, message }],
    };
  }

  private notFound(artifactId: TimelineId): TimelineAudioArtifactResult {
    return {
      accepted: false,
      artifact: null,
      deduplicated: false,
      issues: [
        {
          code: "artifact-not-found",
          artifactId,
          message: `Audio artifact ${artifactId} was not found.`,
        },
      ],
    };
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineAudioArtifactRepositoryEngine =
  new TimelineAudioArtifactRepositoryEngine();
