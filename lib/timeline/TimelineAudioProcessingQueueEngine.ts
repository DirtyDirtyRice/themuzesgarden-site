import {
  TimelineTrackRevisionEngine,
  type TimelineTrackRevisionArchive,
} from "./TimelineTrackRevisionEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineAudioJobKind =
  | "render"
  | "ai-generate"
  | "analyze"
  | "transcode"
  | "stem-separate"
  | "mixdown";

export type TimelineAudioJobState =
  "held" | "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type TimelineAudioArtifact = {
  uri: string;
  fingerprint: string;
  role: string;
};

export type TimelineAudioOutputSpecification = {
  format: "wav" | "flac" | "mp3" | "midi" | "json";
  sampleRate?: number;
  bitDepth?: number;
  channels?: number;
};

export type TimelineAudioJobAttempt = {
  number: number;
  workerId: string;
  startedAt: string;
  finishedAt?: string;
  outcome?: "succeeded" | "failed" | "lease-expired";
  message?: string;
};

export type TimelineAudioProcessingJob = {
  id: TimelineId;
  revisionId: TimelineId;
  kind: TimelineAudioJobKind;
  state: TimelineAudioJobState;
  priority: number;
  dependencyJobIds: TimelineId[];
  inputs: TimelineAudioArtifact[];
  output: TimelineAudioArtifact | null;
  outputSpecification: TimelineAudioOutputSpecification;
  maxAttempts: number;
  attempts: TimelineAudioJobAttempt[];
  leaseOwner: string | null;
  leaseExpiresAt: string | null;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
  queuedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
};

export type TimelineAudioJobIssue = {
  code:
    | "revision-not-found"
    | "revision-not-draft"
    | "input-required"
    | "input-uri-required"
    | "input-fingerprint-required"
    | "ai-provenance-required"
    | "output-specification-invalid"
    | "dependency-not-found"
    | "dependency-cycle"
    | "job-not-found"
    | "job-not-held"
    | "job-not-running"
    | "lease-owner-mismatch"
    | "lease-expired"
    | "output-required"
    | "revision-update-failed"
    | "job-terminal";
  message: string;
  jobId?: TimelineId;
  revisionId?: TimelineId;
  dependencyJobId?: TimelineId;
};

export type TimelineAudioJobResult = {
  accepted: boolean;
  job: TimelineAudioProcessingJob | null;
  issues: TimelineAudioJobIssue[];
};

export type TimelineAudioQueueStatistics = {
  held: number;
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  cancelled: number;
};

export type TimelineAudioProcessingArchive = {
  revisions: TimelineTrackRevisionArchive;
  jobs: TimelineAudioProcessingJob[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function validOutputSpecification(
  specification: TimelineAudioOutputSpecification,
): boolean {
  if (
    specification.sampleRate !== undefined &&
    (!Number.isInteger(specification.sampleRate) ||
      specification.sampleRate < 8_000 ||
      specification.sampleRate > 384_000)
  ) {
    return false;
  }
  if (
    specification.bitDepth !== undefined &&
    ![8, 16, 24, 32, 64].includes(specification.bitDepth)
  ) {
    return false;
  }
  return !(
    specification.channels !== undefined &&
    (!Number.isInteger(specification.channels) ||
      specification.channels < 1 ||
      specification.channels > 64)
  );
}

export class TimelineAudioProcessingQueueEngine {
  private readonly jobs = new Map<TimelineId, TimelineAudioProcessingJob>();
  private sequence = 0;

  constructor(
    readonly revisions = new TimelineTrackRevisionEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createJob(input: {
    revisionId: TimelineId;
    kind: TimelineAudioJobKind;
    inputs?: TimelineAudioArtifact[];
    outputSpecification: TimelineAudioOutputSpecification;
    dependencyJobIds?: TimelineId[];
    priority?: number;
    maxAttempts?: number;
    createdBy: TimelineUserId;
  }): TimelineAudioJobResult {
    const id = `timeline-audio-job-${++this.sequence}`;
    const issues: TimelineAudioJobIssue[] = [];
    const revision = this.revisions.getRevision(input.revisionId);
    const issue = (
      code: TimelineAudioJobIssue["code"],
      message: string,
      detail: Partial<TimelineAudioJobIssue> = {},
    ) =>
      issues.push({
        code,
        message,
        jobId: id,
        revisionId: input.revisionId,
        ...detail,
      });
    if (!revision) issue("revision-not-found", "Track revision was not found.");
    else if (revision.state !== "draft") {
      issue(
        "revision-not-draft",
        "Audio jobs can write output only to draft revisions.",
      );
    }
    const inputs = clone(input.inputs ?? []);
    if (input.kind !== "ai-generate" && inputs.length === 0) {
      issue(
        "input-required",
        `${input.kind} requires at least one input artifact.`,
      );
    }
    inputs.forEach((artifact) => {
      if (!artifact.uri.trim()) {
        issue("input-uri-required", "Every input artifact requires a URI.");
      }
      if (!artifact.fingerprint.trim()) {
        issue(
          "input-fingerprint-required",
          "Every input artifact requires a fingerprint.",
        );
      }
    });
    if (
      input.kind === "ai-generate" &&
      (!revision?.aiPrompt?.prompt.trim() ||
        !revision.aiPrompt.provider.trim() ||
        !revision.aiPrompt.model.trim() ||
        !revision.aiPrompt.requestId.trim())
    ) {
      issue(
        "ai-provenance-required",
        "AI generation requires complete prompt, provider, model, and request provenance.",
      );
    }
    if (!validOutputSpecification(input.outputSpecification)) {
      issue(
        "output-specification-invalid",
        "Audio output specification is outside supported bounds.",
      );
    }
    const dependencies = Array.from(new Set(input.dependencyJobIds ?? []));
    dependencies.forEach((dependencyJobId) => {
      if (!this.jobs.has(dependencyJobId)) {
        issue(
          "dependency-not-found",
          `Dependency job ${dependencyJobId} was not found.`,
          { dependencyJobId },
        );
      }
    });
    if (issues.length) return { accepted: false, job: null, issues };
    const now = this.now().toISOString();
    const job: TimelineAudioProcessingJob = {
      id,
      revisionId: input.revisionId,
      kind: input.kind,
      state: "held",
      priority: Math.trunc(input.priority ?? 0),
      dependencyJobIds: dependencies,
      inputs,
      output: null,
      outputSpecification: clone(input.outputSpecification),
      maxAttempts: Math.max(1, Math.trunc(input.maxAttempts ?? 3)),
      attempts: [],
      leaseOwner: null,
      leaseExpiresAt: null,
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.jobs.set(job.id, clone(job));
    return { accepted: true, job: clone(job), issues: [] };
  }

  enqueue(input: {
    jobId: TimelineId;
    queuedBy: TimelineUserId;
  }): TimelineAudioJobResult {
    const job = this.jobs.get(input.jobId);
    if (!job) return this.notFound(input.jobId);
    if (job.state !== "held") {
      return this.refused(
        job,
        "job-not-held",
        "Only a held job can enter the queue.",
      );
    }
    if (this.hasDependencyCycle(job.id)) {
      return this.refused(
        job,
        "dependency-cycle",
        "Job dependencies contain a cycle.",
      );
    }
    const now = this.now().toISOString();
    const next: TimelineAudioProcessingJob = {
      ...clone(job),
      state: "queued",
      queuedAt: now,
      updatedAt: now,
      updatedBy: input.queuedBy,
    };
    this.jobs.set(next.id, clone(next));
    return { accepted: true, job: clone(next), issues: [] };
  }

  claimNext(input: {
    workerId: string;
    leaseMilliseconds: number;
  }): TimelineAudioProcessingJob | null {
    if (!input.workerId.trim() || input.leaseMilliseconds < 1) return null;
    this.failJobsWithFailedDependencies();
    const candidates = Array.from(this.jobs.values())
      .filter(
        (job) =>
          job.state === "queued" &&
          job.dependencyJobIds.every(
            (dependencyId) =>
              this.jobs.get(dependencyId)?.state === "succeeded",
          ),
      )
      .sort(
        (first, second) =>
          second.priority - first.priority ||
          (first.queuedAt ?? first.createdAt).localeCompare(
            second.queuedAt ?? second.createdAt,
          ) ||
          first.id.localeCompare(second.id),
      );
    const job = candidates[0];
    if (!job) return null;
    const nowDate = this.now();
    const now = nowDate.toISOString();
    const attempt: TimelineAudioJobAttempt = {
      number: job.attempts.length + 1,
      workerId: input.workerId.trim(),
      startedAt: now,
    };
    const next: TimelineAudioProcessingJob = {
      ...clone(job),
      state: "running",
      attempts: [...job.attempts, attempt],
      leaseOwner: input.workerId.trim(),
      leaseExpiresAt: new Date(
        nowDate.getTime() + input.leaseMilliseconds,
      ).toISOString(),
      updatedAt: now,
      updatedBy: input.workerId.trim(),
    };
    this.jobs.set(next.id, clone(next));
    return clone(next);
  }

  heartbeat(input: {
    jobId: TimelineId;
    workerId: string;
    leaseMilliseconds: number;
  }): TimelineAudioJobResult {
    const running = this.requireRunningOwner(input.jobId, input.workerId);
    if (!running.accepted || !running.job) return running;
    if (this.isLeaseExpired(running.job)) {
      return this.refused(
        running.job,
        "lease-expired",
        "The worker lease has already expired.",
      );
    }
    const nowDate = this.now();
    const next: TimelineAudioProcessingJob = {
      ...clone(running.job),
      leaseExpiresAt: new Date(
        nowDate.getTime() + input.leaseMilliseconds,
      ).toISOString(),
      updatedAt: nowDate.toISOString(),
      updatedBy: input.workerId,
    };
    this.jobs.set(next.id, clone(next));
    return { accepted: true, job: clone(next), issues: [] };
  }

  complete(input: {
    jobId: TimelineId;
    workerId: string;
    output: TimelineAudioArtifact;
  }): TimelineAudioJobResult {
    const running = this.requireRunningOwner(input.jobId, input.workerId);
    if (!running.accepted || !running.job) return running;
    if (this.isLeaseExpired(running.job)) {
      return this.refused(
        running.job,
        "lease-expired",
        "The worker lease expired before completion.",
      );
    }
    if (!input.output.uri.trim() || !input.output.fingerprint.trim()) {
      return this.refused(
        running.job,
        "output-required",
        "Completed audio jobs require an output URI and fingerprint.",
      );
    }
    const revisionUpdate = this.revisions.updateDraft({
      revisionId: running.job.revisionId,
      patch: {
        outputArtifactUri: input.output.uri,
        outputFingerprint: input.output.fingerprint,
      },
      updatedBy: input.workerId,
    });
    if (!revisionUpdate.accepted) {
      return this.refused(
        running.job,
        "revision-update-failed",
        "The output could not be attached to its draft revision.",
      );
    }
    const now = this.now().toISOString();
    const attempts = clone(running.job.attempts);
    attempts[attempts.length - 1] = {
      ...attempts.at(-1)!,
      finishedAt: now,
      outcome: "succeeded",
      message: "Output artifact verified and attached to revision.",
    };
    const next: TimelineAudioProcessingJob = {
      ...clone(running.job),
      state: "succeeded",
      attempts,
      output: clone(input.output),
      leaseOwner: null,
      leaseExpiresAt: null,
      completedAt: now,
      updatedAt: now,
      updatedBy: input.workerId,
    };
    this.jobs.set(next.id, clone(next));
    return { accepted: true, job: clone(next), issues: [] };
  }

  fail(input: {
    jobId: TimelineId;
    workerId: string;
    message: string;
  }): TimelineAudioJobResult {
    const running = this.requireRunningOwner(input.jobId, input.workerId);
    if (!running.accepted || !running.job) return running;
    const now = this.now().toISOString();
    const attempts = clone(running.job.attempts);
    attempts[attempts.length - 1] = {
      ...attempts.at(-1)!,
      finishedAt: now,
      outcome: "failed",
      message: input.message.trim() || "Audio processing failed.",
    };
    const canRetry = attempts.length < running.job.maxAttempts;
    const next: TimelineAudioProcessingJob = {
      ...clone(running.job),
      state: canRetry ? "queued" : "failed",
      attempts,
      leaseOwner: null,
      leaseExpiresAt: null,
      completedAt: canRetry ? undefined : now,
      updatedAt: now,
      updatedBy: input.workerId,
    };
    this.jobs.set(next.id, clone(next));
    return { accepted: true, job: clone(next), issues: [] };
  }

  recoverExpiredLeases(
    recoveredBy: TimelineUserId,
  ): TimelineAudioProcessingJob[] {
    const recovered: TimelineAudioProcessingJob[] = [];
    Array.from(this.jobs.values())
      .filter((job) => job.state === "running" && this.isLeaseExpired(job))
      .forEach((job) => {
        const now = this.now().toISOString();
        const attempts = clone(job.attempts);
        attempts[attempts.length - 1] = {
          ...attempts.at(-1)!,
          finishedAt: now,
          outcome: "lease-expired",
          message: "Worker lease expired; job recovered by queue.",
        };
        const canRetry = attempts.length < job.maxAttempts;
        const next: TimelineAudioProcessingJob = {
          ...clone(job),
          state: canRetry ? "queued" : "failed",
          attempts,
          leaseOwner: null,
          leaseExpiresAt: null,
          completedAt: canRetry ? undefined : now,
          updatedAt: now,
          updatedBy: recoveredBy,
        };
        this.jobs.set(next.id, clone(next));
        recovered.push(clone(next));
      });
    this.failJobsWithFailedDependencies();
    return recovered;
  }

  cancel(input: {
    jobId: TimelineId;
    cancelledBy: TimelineUserId;
    reason: string;
  }): TimelineAudioJobResult {
    const job = this.jobs.get(input.jobId);
    if (!job) return this.notFound(input.jobId);
    if (["succeeded", "failed", "cancelled"].includes(job.state)) {
      return this.refused(
        job,
        "job-terminal",
        "A terminal audio job cannot be cancelled.",
      );
    }
    const now = this.now().toISOString();
    const next: TimelineAudioProcessingJob = {
      ...clone(job),
      state: "cancelled",
      leaseOwner: null,
      leaseExpiresAt: null,
      cancelledAt: now,
      cancellationReason: input.reason.trim() || "Cancelled by user.",
      updatedAt: now,
      updatedBy: input.cancelledBy,
    };
    this.jobs.set(next.id, clone(next));
    this.failJobsWithFailedDependencies();
    return { accepted: true, job: clone(next), issues: [] };
  }

  getJob(jobId: TimelineId): TimelineAudioProcessingJob | null {
    const job = this.jobs.get(jobId);
    return job ? clone(job) : null;
  }

  listJobs(state?: TimelineAudioJobState): TimelineAudioProcessingJob[] {
    return Array.from(this.jobs.values())
      .filter((job) => !state || job.state === state)
      .sort(
        (first, second) =>
          first.createdAt.localeCompare(second.createdAt) ||
          first.id.localeCompare(second.id),
      )
      .map(clone);
  }

  statistics(): TimelineAudioQueueStatistics {
    const jobs = Array.from(this.jobs.values());
    return {
      held: jobs.filter((job) => job.state === "held").length,
      queued: jobs.filter((job) => job.state === "queued").length,
      running: jobs.filter((job) => job.state === "running").length,
      succeeded: jobs.filter((job) => job.state === "succeeded").length,
      failed: jobs.filter((job) => job.state === "failed").length,
      cancelled: jobs.filter((job) => job.state === "cancelled").length,
    };
  }

  exportArchive(): TimelineAudioProcessingArchive {
    return {
      revisions: this.revisions.exportArchive(),
      jobs: this.listJobs(),
    };
  }

  restoreArchive(archive: TimelineAudioProcessingArchive): void {
    this.revisions.restoreArchive(archive.revisions);
    this.jobs.clear();
    this.sequence = 0;
    archive.jobs.forEach((job) => {
      if (!this.revisions.getRevision(job.revisionId)) {
        throw new Error(`Audio job ${job.id} references a missing revision.`);
      }
      this.jobs.set(job.id, clone(job));
      this.sequence = Math.max(this.sequence, this.idSequence(job.id));
    });
    archive.jobs.forEach((job) => {
      job.dependencyJobIds.forEach((dependencyId) => {
        if (!this.jobs.has(dependencyId)) {
          throw new Error(
            `Audio job ${job.id} references missing dependency ${dependencyId}.`,
          );
        }
      });
      if (this.hasDependencyCycle(job.id)) {
        throw new Error(`Audio job ${job.id} has a dependency cycle.`);
      }
    });
  }

  private failJobsWithFailedDependencies(): void {
    let changed = true;
    while (changed) {
      changed = false;
      Array.from(this.jobs.values())
        .filter((job) => job.state === "queued")
        .forEach((job) => {
          const blocked = job.dependencyJobIds.find((dependencyId) =>
            ["failed", "cancelled"].includes(
              this.jobs.get(dependencyId)?.state ?? "failed",
            ),
          );
          if (!blocked) return;
          const now = this.now().toISOString();
          this.jobs.set(job.id, {
            ...clone(job),
            state: "failed",
            completedAt: now,
            updatedAt: now,
            updatedBy: "timeline-audio-queue",
          });
          changed = true;
        });
    }
  }

  private hasDependencyCycle(startId: TimelineId): boolean {
    const visiting = new Set<TimelineId>();
    const visited = new Set<TimelineId>();
    const visit = (jobId: TimelineId): boolean => {
      if (visiting.has(jobId)) return true;
      if (visited.has(jobId)) return false;
      visiting.add(jobId);
      const job = this.jobs.get(jobId);
      if (job?.dependencyJobIds.some(visit)) return true;
      visiting.delete(jobId);
      visited.add(jobId);
      return false;
    };
    return visit(startId);
  }

  private requireRunningOwner(
    jobId: TimelineId,
    workerId: string,
  ): TimelineAudioJobResult {
    const job = this.jobs.get(jobId);
    if (!job) return this.notFound(jobId);
    if (job.state !== "running") {
      return this.refused(job, "job-not-running", "Job is not running.");
    }
    if (job.leaseOwner !== workerId) {
      return this.refused(
        job,
        "lease-owner-mismatch",
        "Only the worker holding the lease may change this job.",
      );
    }
    return { accepted: true, job: clone(job), issues: [] };
  }

  private isLeaseExpired(job: TimelineAudioProcessingJob): boolean {
    return (
      !job.leaseExpiresAt ||
      Date.parse(job.leaseExpiresAt) <= this.now().getTime()
    );
  }

  private notFound(jobId: TimelineId): TimelineAudioJobResult {
    return {
      accepted: false,
      job: null,
      issues: [
        {
          code: "job-not-found",
          jobId,
          message: `Audio job ${jobId} was not found.`,
        },
      ],
    };
  }

  private refused(
    job: TimelineAudioProcessingJob,
    code: TimelineAudioJobIssue["code"],
    message: string,
  ): TimelineAudioJobResult {
    return {
      accepted: false,
      job: clone(job),
      issues: [{ code, message, jobId: job.id, revisionId: job.revisionId }],
    };
  }

  private idSequence(id: TimelineId): number {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineAudioProcessingQueueEngine =
  new TimelineAudioProcessingQueueEngine();
