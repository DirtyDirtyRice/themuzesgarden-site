import {
  TimelineMixEvaluationEngine,
  type TimelineMixMetrics,
} from "./TimelineMixEvaluationEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineMasteringTarget =
  | "streaming"
  | "compact-disc"
  | "high-resolution";

export type TimelineMasteringProfile = {
  target: TimelineMasteringTarget;
  targetLufs: number;
  lufsTolerance: number;
  maximumTruePeakDbtp: number;
  sampleRateHz: number;
  bitDepth: 16 | 24 | 32;
  format: "wav" | "flac";
};

export type TimelineMasteringStep = {
  kind: "equalization" | "compression" | "limiting" | "dither";
  description: string;
  parameters: Record<string, number | string | boolean>;
};

export type TimelineMasteringJob = {
  id: TimelineId;
  comparisonId: TimelineId;
  candidateId: TimelineId;
  sessionId: TimelineId;
  sourceSnapshotId: TimelineId;
  sourceSnapshotChecksum: string;
  profile: TimelineMasteringProfile;
  steps: TimelineMasteringStep[];
  status:
    | "held"
    | "approved"
    | "awaiting-review"
    | "delivered"
    | "rejected"
    | "failed";
  outputUri?: string;
  outputFingerprint?: string;
  outputMetrics?: TimelineMixMetrics;
  issues: string[];
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
};

export type TimelineMasteringReceipt = {
  id: TimelineId;
  jobId: TimelineId;
  action: "created" | "approved" | "rendered" | "failed" | "delivered" | "rejected";
  message: string;
  recordedAt: string;
  recordedBy: string;
};

export type TimelineMasteringArchive = {
  jobs: TimelineMasteringJob[];
  receipts: TimelineMasteringReceipt[];
};

const PROFILES: Record<TimelineMasteringTarget, TimelineMasteringProfile> = {
  streaming: {
    target: "streaming",
    targetLufs: -14,
    lufsTolerance: 1,
    maximumTruePeakDbtp: -1,
    sampleRateHz: 48_000,
    bitDepth: 24,
    format: "wav",
  },
  "compact-disc": {
    target: "compact-disc",
    targetLufs: -11,
    lufsTolerance: 1,
    maximumTruePeakDbtp: -0.3,
    sampleRateHz: 44_100,
    bitDepth: 16,
    format: "wav",
  },
  "high-resolution": {
    target: "high-resolution",
    targetLufs: -14,
    lufsTolerance: 1,
    maximumTruePeakDbtp: -1,
    sampleRateHz: 96_000,
    bitDepth: 24,
    format: "flac",
  },
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class TimelineMasteringEngine {
  private readonly jobs = new Map<TimelineId, TimelineMasteringJob>();
  private readonly receipts: TimelineMasteringReceipt[] = [];
  private jobSequence = 0;
  private receiptSequence = 0;

  constructor(
    readonly evaluations = new TimelineMixEvaluationEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createJob(input: {
    comparisonId: TimelineId;
    target: TimelineMasteringTarget;
    createdBy: TimelineUserId;
    profileOverrides?: Partial<
      Omit<TimelineMasteringProfile, "target">
    >;
    steps?: TimelineMasteringStep[];
  }): TimelineMasteringJob {
    const comparison = this.evaluations.getComparison(input.comparisonId);
    if (
      !comparison ||
      comparison.status !== "decided" ||
      !comparison.preferredCandidateId
    ) {
      throw new Error("Mastering requires a decided mix comparison.");
    }
    const candidate = this.evaluations
      .listCandidates(comparison.id)
      .find((item) => item.id === comparison.preferredCandidateId);
    if (!candidate || candidate.status !== "eligible" || !candidate.metrics) {
      throw new Error("Preferred mix candidate is not eligible for mastering.");
    }
    const profile: TimelineMasteringProfile = {
      ...PROFILES[input.target],
      ...clone(input.profileOverrides ?? {}),
      target: input.target,
    };
    this.validateProfile(profile);
    const steps = clone(input.steps ?? this.defaultSteps(profile));
    this.validateSteps(steps, profile);
    const job: TimelineMasteringJob = {
      id: `timeline-mastering-job-${++this.jobSequence}`,
      comparisonId: comparison.id,
      candidateId: candidate.id,
      sessionId: comparison.sessionId,
      sourceSnapshotId: candidate.snapshotId,
      sourceSnapshotChecksum: candidate.snapshotChecksum,
      profile,
      steps,
      status: "held",
      issues: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.jobs.set(job.id, clone(job));
    this.record(
      job.id,
      "created",
      "Mastering plan held for human approval.",
      input.createdBy,
    );
    return clone(job);
  }

  approve(input: {
    jobId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineMasteringJob {
    const job = this.required(input.jobId);
    if (job.status !== "held") {
      throw new Error("Only a held mastering plan can be approved.");
    }
    this.assertSourceDecision(job);
    const approved = this.save({
      ...job,
      status: "approved",
      approvedAt: this.now().toISOString(),
      approvedBy: input.approvedBy,
    });
    this.record(
      job.id,
      "approved",
      "Human approved the mastering plan.",
      input.approvedBy,
    );
    return approved;
  }

  submitRender(input: {
    jobId: TimelineId;
    outputUri: string;
    outputFingerprint: string;
    outputMetrics: TimelineMixMetrics;
    sampleRateHz: number;
    bitDepth: number;
    format: string;
    renderedBy: string;
  }): TimelineMasteringJob {
    const job = this.required(input.jobId);
    if (job.status !== "approved") {
      throw new Error("Only an approved mastering plan can accept a render.");
    }
    const issues = this.renderIssues(job, input);
    if (issues.length) {
      const failed = this.save({
        ...job,
        status: "failed",
        outputMetrics: clone(input.outputMetrics),
        issues,
      });
      this.record(job.id, "failed", issues.join(" "), input.renderedBy);
      return failed;
    }
    const rendered = this.save({
      ...job,
      status: "awaiting-review",
      outputUri: input.outputUri.trim(),
      outputFingerprint: input.outputFingerprint.trim(),
      outputMetrics: clone(input.outputMetrics),
      issues: [],
    });
    this.record(
      job.id,
      "rendered",
      "Master passed technical validation and awaits human review.",
      input.renderedBy,
    );
    return rendered;
  }

  review(input: {
    jobId: TimelineId;
    decision: "accept" | "reject";
    reviewedBy: TimelineUserId;
    reason: string;
  }): TimelineMasteringJob {
    const job = this.required(input.jobId);
    if (job.status !== "awaiting-review") {
      throw new Error("Only a validated master can be reviewed.");
    }
    if (!input.reason.trim()) {
      throw new Error("A mastering review reason is required.");
    }
    const status = input.decision === "accept" ? "delivered" : "rejected";
    const reviewed = this.save({
      ...job,
      status,
      reviewedAt: this.now().toISOString(),
      reviewedBy: input.reviewedBy,
    });
    this.record(
      job.id,
      status,
      input.reason.trim(),
      input.reviewedBy,
    );
    return reviewed;
  }

  getJob(jobId: TimelineId): TimelineMasteringJob | null {
    const job = this.jobs.get(jobId);
    return job ? clone(job) : null;
  }

  listJobs(sessionId?: TimelineId): TimelineMasteringJob[] {
    return [...this.jobs.values()]
      .filter((job) => !sessionId || job.sessionId === sessionId)
      .map(clone);
  }

  listReceipts(jobId?: TimelineId): TimelineMasteringReceipt[] {
    return this.receipts
      .filter((receipt) => !jobId || receipt.jobId === jobId)
      .map(clone);
  }

  exportArchive(): TimelineMasteringArchive {
    return {
      jobs: [...this.jobs.values()].map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineMasteringArchive): void {
    this.assertUnique(archive.jobs, "job");
    this.assertUnique(archive.receipts, "receipt");
    const jobIds = new Set(archive.jobs.map((job) => job.id));
    if (archive.receipts.some((receipt) => !jobIds.has(receipt.jobId))) {
      throw new Error("Mastering archive receipt references a missing job.");
    }
    this.jobs.clear();
    this.receipts.length = 0;
    archive.jobs.forEach((job) => this.jobs.set(job.id, clone(job)));
    this.receipts.push(...archive.receipts.map(clone));
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.jobSequence = Math.max(
      0,
      ...archive.jobs.map((job) => sequence(job.id)),
    );
    this.receiptSequence = Math.max(
      0,
      ...archive.receipts.map((receipt) => sequence(receipt.id)),
    );
  }

  private defaultSteps(
    profile: TimelineMasteringProfile,
  ): TimelineMasteringStep[] {
    const steps: TimelineMasteringStep[] = [
      {
        kind: "equalization",
        description: "Correct broad tonal balance without changing the mix.",
        parameters: { maximumGainDb: 2 },
      },
      {
        kind: "compression",
        description: "Control macro dynamics transparently.",
        parameters: { maximumGainReductionDb: 3, ratio: 1.5 },
      },
      {
        kind: "limiting",
        description: "Meet the delivery loudness and true-peak ceiling.",
        parameters: {
          targetLufs: profile.targetLufs,
          ceilingDbtp: profile.maximumTruePeakDbtp,
        },
      },
    ];
    if (profile.bitDepth === 16) {
      steps.push({
        kind: "dither",
        description: "Dither once at final 16-bit export.",
        parameters: { bitDepth: 16, noiseShaping: true },
      });
    }
    return steps;
  }

  private validateProfile(profile: TimelineMasteringProfile): void {
    const numeric = [
      profile.targetLufs,
      profile.lufsTolerance,
      profile.maximumTruePeakDbtp,
      profile.sampleRateHz,
      profile.bitDepth,
    ];
    if (!numeric.every(Number.isFinite)) {
      throw new Error("Mastering profile values must be finite.");
    }
    if (profile.lufsTolerance <= 0 || profile.lufsTolerance > 3) {
      throw new Error("Mastering LUFS tolerance must be above 0 and at most 3.");
    }
    if (![44_100, 48_000, 88_200, 96_000, 192_000].includes(profile.sampleRateHz)) {
      throw new Error("Mastering sample rate is unsupported.");
    }
    if (![16, 24, 32].includes(profile.bitDepth)) {
      throw new Error("Mastering bit depth is unsupported.");
    }
  }

  private validateSteps(
    steps: TimelineMasteringStep[],
    profile: TimelineMasteringProfile,
  ): void {
    if (!steps.length) throw new Error("Mastering plan has no processing steps.");
    if (!steps.some((step) => step.kind === "limiting")) {
      throw new Error("Mastering plan requires a true-peak limiting step.");
    }
    if (
      profile.bitDepth === 16 &&
      !steps.some((step) => step.kind === "dither")
    ) {
      throw new Error("A 16-bit master requires final dither.");
    }
    if (steps.some((step) => !step.description.trim())) {
      throw new Error("Every mastering step requires a description.");
    }
  }

  private renderIssues(
    job: TimelineMasteringJob,
    input: {
      outputUri: string;
      outputFingerprint: string;
      outputMetrics: TimelineMixMetrics;
      sampleRateHz: number;
      bitDepth: number;
      format: string;
    },
  ): string[] {
    const issues: string[] = [];
    const metrics = input.outputMetrics;
    if (!input.outputUri.trim()) issues.push("Master output URI is missing.");
    if (!input.outputFingerprint.trim()) {
      issues.push("Master output fingerprint is missing.");
    }
    if (
      !Object.values(metrics).every(
        (value) => typeof value === "number" && Number.isFinite(value),
      )
    ) {
      issues.push("Master analysis contains invalid metrics.");
      return issues;
    }
    if (
      Math.abs(metrics.integratedLufs - job.profile.targetLufs) >
      job.profile.lufsTolerance
    ) {
      issues.push("Master is outside the target loudness tolerance.");
    }
    if (metrics.truePeakDbtp > job.profile.maximumTruePeakDbtp) {
      issues.push("Master exceeds the true-peak ceiling.");
    }
    if (metrics.clippedSampleCount !== 0) {
      issues.push("Master contains clipped samples.");
    }
    if (metrics.stereoCorrelation < 0) {
      issues.push("Master has unsafe negative stereo correlation.");
    }
    if (input.sampleRateHz !== job.profile.sampleRateHz) {
      issues.push("Master sample rate does not match its profile.");
    }
    if (input.bitDepth !== job.profile.bitDepth) {
      issues.push("Master bit depth does not match its profile.");
    }
    if (input.format !== job.profile.format) {
      issues.push("Master format does not match its profile.");
    }
    return issues;
  }

  private assertSourceDecision(job: TimelineMasteringJob): void {
    const comparison = this.evaluations.getComparison(job.comparisonId);
    if (
      !comparison ||
      comparison.status !== "decided" ||
      comparison.preferredCandidateId !== job.candidateId
    ) {
      throw new Error("The approved mix decision changed before mastering.");
    }
    const candidate = this.evaluations
      .listCandidates(comparison.id)
      .find((item) => item.id === job.candidateId);
    if (
      !candidate ||
      candidate.snapshotId !== job.sourceSnapshotId ||
      candidate.snapshotChecksum !== job.sourceSnapshotChecksum
    ) {
      throw new Error("The mastering source identity no longer matches.");
    }
  }

  private required(jobId: TimelineId): TimelineMasteringJob {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error("Mastering job was not found.");
    return job;
  }

  private save(job: TimelineMasteringJob): TimelineMasteringJob {
    this.jobs.set(job.id, clone(job));
    return clone(job);
  }

  private record(
    jobId: TimelineId,
    action: TimelineMasteringReceipt["action"],
    message: string,
    recordedBy: string,
  ): void {
    this.receipts.push({
      id: `timeline-mastering-receipt-${++this.receiptSequence}`,
      jobId,
      action,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private assertUnique(
    values: Array<{ id: TimelineId }>,
    label: string,
  ): void {
    if (new Set(values.map((value) => value.id)).size !== values.length) {
      throw new Error(`Archive contains duplicate mastering ${label} IDs.`);
    }
  }
}
