import {
  TimelineAudioArtifactRepositoryEngine,
  type TimelineAudioArtifactRecord,
  type TimelineAudioArtifactReplica,
} from "./TimelineAudioArtifactRepositoryEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineArtifactIntegritySeverity =
  "healthy" | "degraded" | "critical";

export type TimelineArtifactIntegrityIssueCode =
  | "artifact-unavailable"
  | "replica-under-target"
  | "replica-missing"
  | "replica-corrupt"
  | "provider-under-target"
  | "verification-overdue";

export type TimelineArtifactIntegrityIssue = {
  id: TimelineId;
  artifactId: TimelineId;
  code: TimelineArtifactIntegrityIssueCode;
  severity: Exclude<TimelineArtifactIntegritySeverity, "healthy">;
  message: string;
  replicaId?: TimelineId;
  openedAt: string;
  lastObservedAt: string;
  resolvedAt?: string;
};

export type TimelineArtifactIntegrityPolicy = {
  minimumAvailableReplicas: number;
  minimumStorageProviders: number;
  verificationIntervalHours: number;
};

export type TimelineArtifactIntegrityFinding = {
  artifactId: TimelineId;
  fingerprint: string;
  severity: TimelineArtifactIntegritySeverity;
  availableReplicas: number;
  storageProviders: number;
  issues: TimelineArtifactIntegrityIssue[];
};

export type TimelineArtifactIntegrityScan = {
  id: TimelineId;
  startedAt: string;
  completedAt: string;
  scannedArtifacts: number;
  healthy: number;
  degraded: number;
  critical: number;
  openedIssues: number;
  resolvedIssues: number;
  findings: TimelineArtifactIntegrityFinding[];
};

export type TimelineArtifactIntegrityRepair = {
  id: TimelineId;
  artifactId: TimelineId;
  sourceReplicaId: TimelineId;
  targetReplicaId: TimelineId;
  repairedAt: string;
  repairedBy: TimelineUserId;
};

export type TimelineArtifactIntegrityArchive = {
  policy: TimelineArtifactIntegrityPolicy;
  issues: TimelineArtifactIntegrityIssue[];
  scans: TimelineArtifactIntegrityScan[];
  repairs: TimelineArtifactIntegrityRepair[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function normalizedPolicy(
  policy: Partial<TimelineArtifactIntegrityPolicy> = {},
): TimelineArtifactIntegrityPolicy {
  return {
    minimumAvailableReplicas: Math.max(
      1,
      Math.trunc(policy.minimumAvailableReplicas ?? 2),
    ),
    minimumStorageProviders: Math.max(
      1,
      Math.trunc(policy.minimumStorageProviders ?? 2),
    ),
    verificationIntervalHours: Math.max(
      1,
      Math.trunc(policy.verificationIntervalHours ?? 24 * 7),
    ),
  };
}

export class TimelineAudioArtifactIntegrityEngine {
  private policy: TimelineArtifactIntegrityPolicy;
  private readonly issues = new Map<
    TimelineId,
    TimelineArtifactIntegrityIssue
  >();
  private readonly issueKeys = new Map<string, TimelineId>();
  private readonly scans: TimelineArtifactIntegrityScan[] = [];
  private readonly repairs: TimelineArtifactIntegrityRepair[] = [];
  private issueSequence = 0;
  private scanSequence = 0;
  private repairSequence = 0;

  constructor(
    readonly repository = new TimelineAudioArtifactRepositoryEngine(),
    policy: Partial<TimelineArtifactIntegrityPolicy> = {},
    private readonly now: () => Date = () => new Date(),
  ) {
    this.policy = normalizedPolicy(policy);
  }

  setPolicy(
    policy: Partial<TimelineArtifactIntegrityPolicy>,
  ): TimelineArtifactIntegrityPolicy {
    this.policy = normalizedPolicy({ ...this.policy, ...policy });
    return clone(this.policy);
  }

  getPolicy(): TimelineArtifactIntegrityPolicy {
    return clone(this.policy);
  }

  scan(): TimelineArtifactIntegrityScan {
    const startedAt = this.now().toISOString();
    const observedKeys = new Set<string>();
    let openedIssues = 0;
    const findings = this.repository
      .listArtifacts()
      .filter((artifact) => artifact.state !== "trash")
      .map((artifact) => {
        const observations = this.observe(artifact);
        const findingIssues = observations.map((observation) => {
          const key = this.issueKey(
            artifact.id,
            observation.code,
            observation.replicaId,
          );
          observedKeys.add(key);
          const existingId = this.issueKeys.get(key);
          const existing = existingId ? this.issues.get(existingId) : undefined;
          if (existing && !existing.resolvedAt) {
            const updated = {
              ...existing,
              severity: observation.severity,
              message: observation.message,
              lastObservedAt: this.now().toISOString(),
            };
            this.issues.set(updated.id, updated);
            return clone(updated);
          }
          const issue: TimelineArtifactIntegrityIssue = {
            id: `timeline-artifact-integrity-issue-${++this.issueSequence}`,
            artifactId: artifact.id,
            code: observation.code,
            severity: observation.severity,
            message: observation.message,
            replicaId: observation.replicaId,
            openedAt: this.now().toISOString(),
            lastObservedAt: this.now().toISOString(),
          };
          this.issues.set(issue.id, issue);
          this.issueKeys.set(key, issue.id);
          openedIssues += 1;
          return clone(issue);
        });
        const available = artifact.replicas.filter(
          (replica) => replica.state === "available",
        );
        return {
          artifactId: artifact.id,
          fingerprint: artifact.fingerprint,
          severity: this.severity(findingIssues),
          availableReplicas: available.length,
          storageProviders: new Set(
            available.map((replica) => replica.storageProvider),
          ).size,
          issues: findingIssues,
        } satisfies TimelineArtifactIntegrityFinding;
      });

    let resolvedIssues = 0;
    for (const [key, issueId] of this.issueKeys) {
      const issue = this.issues.get(issueId);
      if (!issue || issue.resolvedAt || observedKeys.has(key)) continue;
      const resolved = { ...issue, resolvedAt: this.now().toISOString() };
      this.issues.set(issue.id, resolved);
      resolvedIssues += 1;
    }

    const scan: TimelineArtifactIntegrityScan = {
      id: `timeline-artifact-integrity-scan-${++this.scanSequence}`,
      startedAt,
      completedAt: this.now().toISOString(),
      scannedArtifacts: findings.length,
      healthy: findings.filter((finding) => finding.severity === "healthy")
        .length,
      degraded: findings.filter((finding) => finding.severity === "degraded")
        .length,
      critical: findings.filter((finding) => finding.severity === "critical")
        .length,
      openedIssues,
      resolvedIssues,
      findings,
    };
    this.scans.push(clone(scan));
    return clone(scan);
  }

  repairReplica(input: {
    artifactId: TimelineId;
    sourceReplicaId: TimelineId;
    targetReplicaId: TimelineId;
    repairedBy: TimelineUserId;
  }): TimelineArtifactIntegrityRepair {
    const artifact = this.requiredArtifact(input.artifactId);
    const source = this.requiredReplica(artifact, input.sourceReplicaId);
    const target = this.requiredReplica(artifact, input.targetReplicaId);
    if (source.state !== "available") {
      throw new Error("Replica repair requires an available source copy.");
    }
    if (target.state === "available") {
      throw new Error("Target replica is already available.");
    }
    const result = this.repository.verifyReplica({
      artifactId: artifact.id,
      replicaId: target.id,
      exists: true,
      observedFingerprint: artifact.fingerprint,
      observedSizeBytes: artifact.sizeBytes,
      verifiedBy: input.repairedBy,
    });
    if (!result.accepted) {
      throw new Error(result.issues[0]?.message ?? "Replica repair failed.");
    }
    const repair: TimelineArtifactIntegrityRepair = {
      id: `timeline-artifact-integrity-repair-${++this.repairSequence}`,
      artifactId: artifact.id,
      sourceReplicaId: source.id,
      targetReplicaId: target.id,
      repairedAt: this.now().toISOString(),
      repairedBy: input.repairedBy,
    };
    this.repairs.push(repair);
    return clone(repair);
  }

  addReplica(input: {
    artifactId: TimelineId;
    uri: string;
    storageProvider: string;
    region?: string;
    addedBy: TimelineUserId;
  }): TimelineAudioArtifactRecord {
    const artifact = this.requiredArtifact(input.artifactId);
    if (artifact.state === "trash") {
      throw new Error("Trash artifacts must be restored before replication.");
    }
    const result = this.repository.register({
      fingerprint: artifact.fingerprint,
      kind: artifact.kind,
      format: artifact.format,
      mediaType: artifact.mediaType,
      sizeBytes: artifact.sizeBytes,
      durationSeconds: artifact.durationSeconds,
      replica: {
        uri: input.uri,
        storageProvider: input.storageProvider,
        region: input.region,
      },
      createdBy: input.addedBy,
    });
    if (!result.accepted || !result.artifact) {
      throw new Error(
        result.issues[0]?.message ?? "Artifact replication failed.",
      );
    }
    return clone(result.artifact);
  }

  activeIssues(artifactId?: TimelineId): TimelineArtifactIntegrityIssue[] {
    return Array.from(this.issues.values())
      .filter(
        (issue) =>
          !issue.resolvedAt && (!artifactId || issue.artifactId === artifactId),
      )
      .map(clone);
  }

  issueHistory(artifactId?: TimelineId): TimelineArtifactIntegrityIssue[] {
    return Array.from(this.issues.values())
      .filter((issue) => !artifactId || issue.artifactId === artifactId)
      .map(clone);
  }

  scanHistory(): TimelineArtifactIntegrityScan[] {
    return clone(this.scans);
  }

  repairHistory(): TimelineArtifactIntegrityRepair[] {
    return clone(this.repairs);
  }

  exportArchive(): TimelineArtifactIntegrityArchive {
    return {
      policy: this.getPolicy(),
      issues: this.issueHistory(),
      scans: this.scanHistory(),
      repairs: this.repairHistory(),
    };
  }

  restoreArchive(archive: TimelineArtifactIntegrityArchive): void {
    this.policy = normalizedPolicy(archive.policy);
    this.issues.clear();
    this.issueKeys.clear();
    this.scans.splice(0);
    this.repairs.splice(0);
    this.issueSequence = 0;
    this.scanSequence = 0;
    this.repairSequence = 0;
    for (const issue of archive.issues) {
      if (this.issues.has(issue.id)) {
        throw new Error(`Duplicate integrity issue ID ${issue.id}.`);
      }
      const key = this.issueKey(issue.artifactId, issue.code, issue.replicaId);
      this.issues.set(issue.id, clone(issue));
      this.issueKeys.set(key, issue.id);
      this.issueSequence = Math.max(
        this.issueSequence,
        this.idSequence(issue.id),
      );
    }
    for (const scan of archive.scans) {
      this.scans.push(clone(scan));
      this.scanSequence = Math.max(this.scanSequence, this.idSequence(scan.id));
    }
    for (const repair of archive.repairs) {
      this.repairs.push(clone(repair));
      this.repairSequence = Math.max(
        this.repairSequence,
        this.idSequence(repair.id),
      );
    }
  }

  private observe(artifact: TimelineAudioArtifactRecord): Array<{
    code: TimelineArtifactIntegrityIssueCode;
    severity: Exclude<TimelineArtifactIntegritySeverity, "healthy">;
    message: string;
    replicaId?: TimelineId;
  }> {
    const observations: Array<{
      code: TimelineArtifactIntegrityIssueCode;
      severity: Exclude<TimelineArtifactIntegritySeverity, "healthy">;
      message: string;
      replicaId?: TimelineId;
    }> = [];
    const available = artifact.replicas.filter(
      (replica) => replica.state === "available",
    );
    if (available.length === 0) {
      observations.push({
        code: "artifact-unavailable",
        severity: "critical",
        message: "No verified artifact replica is available.",
      });
    } else if (available.length < this.policy.minimumAvailableReplicas) {
      observations.push({
        code: "replica-under-target",
        severity: "degraded",
        message: `Artifact has ${available.length} available replica; policy requires ${this.policy.minimumAvailableReplicas}.`,
      });
    }
    const providers = new Set(
      available.map((replica) => replica.storageProvider),
    );
    if (
      available.length > 0 &&
      providers.size < this.policy.minimumStorageProviders
    ) {
      observations.push({
        code: "provider-under-target",
        severity: "degraded",
        message: `Artifact spans ${providers.size} storage provider; policy requires ${this.policy.minimumStorageProviders}.`,
      });
    }
    for (const replica of artifact.replicas) {
      if (replica.state === "missing") {
        observations.push({
          code: "replica-missing",
          severity: available.length ? "degraded" : "critical",
          message: `Replica ${replica.id} is missing.`,
          replicaId: replica.id,
        });
      }
      if (replica.state === "corrupt") {
        observations.push({
          code: "replica-corrupt",
          severity: available.length ? "degraded" : "critical",
          message: `Replica ${replica.id} failed fingerprint verification.`,
          replicaId: replica.id,
        });
      }
      const age =
        this.now().getTime() - Date.parse(replica.verifiedAt || "invalid");
      if (
        !Number.isFinite(age) ||
        age > this.policy.verificationIntervalHours * 60 * 60 * 1_000
      ) {
        observations.push({
          code: "verification-overdue",
          severity: "degraded",
          message: `Replica ${replica.id} verification is overdue.`,
          replicaId: replica.id,
        });
      }
    }
    return observations;
  }

  private severity(
    issues: TimelineArtifactIntegrityIssue[],
  ): TimelineArtifactIntegritySeverity {
    if (issues.some((issue) => issue.severity === "critical"))
      return "critical";
    return issues.length ? "degraded" : "healthy";
  }

  private requiredArtifact(
    artifactId: TimelineId,
  ): TimelineAudioArtifactRecord {
    const artifact = this.repository.getArtifact(artifactId);
    if (!artifact)
      throw new Error(`Audio artifact ${artifactId} was not found.`);
    return artifact;
  }

  private requiredReplica(
    artifact: TimelineAudioArtifactRecord,
    replicaId: TimelineId,
  ): TimelineAudioArtifactReplica {
    const replica = artifact.replicas.find((item) => item.id === replicaId);
    if (!replica) throw new Error(`Audio replica ${replicaId} was not found.`);
    return replica;
  }

  private issueKey(
    artifactId: TimelineId,
    code: TimelineArtifactIntegrityIssueCode,
    replicaId?: TimelineId,
  ): string {
    return `${artifactId}:${code}:${replicaId ?? "*"}`;
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineAudioArtifactIntegrityEngine =
  new TimelineAudioArtifactIntegrityEngine();
