import { TimelineMixSessionEngine } from "./TimelineMixSessionEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineMixMetrics = {
  integratedLufs: number;
  truePeakDbtp: number;
  loudnessRangeLu: number;
  stereoCorrelation: number;
  clippedSampleCount: number;
};

export type TimelineMixEvaluationObjective = {
  targetLufs: number;
  maximumTruePeakDbtp: number;
  minimumLoudnessRangeLu: number;
  maximumLoudnessRangeLu: number;
  minimumStereoCorrelation: number;
  weights: {
    loudness: number;
    peakSafety: number;
    dynamics: number;
    stereoSafety: number;
  };
};

export type TimelineMixCandidate = {
  id: TimelineId;
  comparisonId: TimelineId;
  snapshotId: TimelineId;
  snapshotChecksum: string;
  label: string;
  status: "awaiting-analysis" | "eligible" | "disqualified";
  metrics?: TimelineMixMetrics;
  score?: number;
  issues: string[];
  analyzedAt?: string;
  analyzedBy?: string;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineMixComparison = {
  id: TimelineId;
  sessionId: TimelineId;
  name: string;
  status: "collecting" | "ready" | "decided" | "archived";
  objective: TimelineMixEvaluationObjective;
  candidateIds: TimelineId[];
  preferredCandidateId: TimelineId | null;
  decisionReason?: string;
  decidedAt?: string;
  decidedBy?: TimelineUserId;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineMixEvaluationReceipt = {
  id: TimelineId;
  comparisonId: TimelineId;
  candidateId: TimelineId;
  action: "analyzed" | "disqualified" | "preferred";
  message: string;
  recordedAt: string;
  recordedBy: string;
};

export type TimelineMixEvaluationArchive = {
  comparisons: TimelineMixComparison[];
  candidates: TimelineMixCandidate[];
  receipts: TimelineMixEvaluationReceipt[];
};

const DEFAULT_OBJECTIVE: TimelineMixEvaluationObjective = {
  targetLufs: -14,
  maximumTruePeakDbtp: -1,
  minimumLoudnessRangeLu: 4,
  maximumLoudnessRangeLu: 14,
  minimumStereoCorrelation: 0,
  weights: {
    loudness: 0.35,
    peakSafety: 0.3,
    dynamics: 0.2,
    stereoSafety: 0.15,
  },
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function bounded(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export class TimelineMixEvaluationEngine {
  private readonly comparisons = new Map<TimelineId, TimelineMixComparison>();
  private readonly candidates = new Map<TimelineId, TimelineMixCandidate>();
  private readonly receipts: TimelineMixEvaluationReceipt[] = [];
  private comparisonSequence = 0;
  private candidateSequence = 0;
  private receiptSequence = 0;

  constructor(
    readonly mixes = new TimelineMixSessionEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  createComparison(input: {
    sessionId: TimelineId;
    name: string;
    objective?: Partial<TimelineMixEvaluationObjective>;
    createdBy: TimelineUserId;
  }): TimelineMixComparison {
    if (!this.mixes.getSession(input.sessionId)) {
      throw new Error("Mix session was not found.");
    }
    const objective = this.objective(input.objective);
    const comparison: TimelineMixComparison = {
      id: `timeline-mix-comparison-${++this.comparisonSequence}`,
      sessionId: input.sessionId,
      name: input.name.trim() || "Mix comparison",
      status: "collecting",
      objective,
      candidateIds: [],
      preferredCandidateId: null,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.comparisons.set(comparison.id, clone(comparison));
    return clone(comparison);
  }

  addCandidate(input: {
    comparisonId: TimelineId;
    snapshotId: TimelineId;
    label: string;
    createdBy: TimelineUserId;
  }): TimelineMixCandidate {
    const comparison = this.editableComparison(input.comparisonId);
    const snapshot = this.mixes
      .listSnapshots(comparison.sessionId)
      .find((item) => item.id === input.snapshotId);
    if (!snapshot) {
      throw new Error("Candidate snapshot was not found in this mix session.");
    }
    const duplicate = comparison.candidateIds
      .map((id) => this.candidates.get(id)!)
      .some((candidate) => candidate.snapshotChecksum === snapshot.checksum);
    if (duplicate) {
      throw new Error("That exact mix state is already a candidate.");
    }
    const candidate: TimelineMixCandidate = {
      id: `timeline-mix-candidate-${++this.candidateSequence}`,
      comparisonId: comparison.id,
      snapshotId: snapshot.id,
      snapshotChecksum: snapshot.checksum,
      label: input.label.trim() || `Candidate ${comparison.candidateIds.length + 1}`,
      status: "awaiting-analysis",
      issues: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.candidates.set(candidate.id, clone(candidate));
    this.saveComparison({
      ...comparison,
      candidateIds: [...comparison.candidateIds, candidate.id],
    });
    return clone(candidate);
  }

  recordAnalysis(input: {
    candidateId: TimelineId;
    metrics: TimelineMixMetrics;
    analyzerId: string;
  }): TimelineMixCandidate {
    const current = this.requiredCandidate(input.candidateId);
    const comparison = this.editableComparison(current.comparisonId);
    if (current.status !== "awaiting-analysis") {
      throw new Error("Candidate analysis has already been recorded.");
    }
    const issues = this.metricIssues(input.metrics, comparison.objective);
    const status = issues.length ? "disqualified" : "eligible";
    const candidate: TimelineMixCandidate = {
      ...current,
      status,
      metrics: clone(input.metrics),
      score:
        status === "eligible"
          ? this.score(input.metrics, comparison.objective)
          : undefined,
      issues,
      analyzedAt: this.now().toISOString(),
      analyzedBy: input.analyzerId,
    };
    this.candidates.set(candidate.id, clone(candidate));
    const candidates = comparison.candidateIds.map((id) =>
      id === candidate.id ? candidate : this.candidates.get(id)!,
    );
    this.saveComparison({
      ...comparison,
      status: candidates.every((item) => item.status !== "awaiting-analysis")
        ? "ready"
        : "collecting",
    });
    this.record(
      comparison.id,
      candidate.id,
      status === "eligible" ? "analyzed" : "disqualified",
      status === "eligible"
        ? `Candidate scored ${candidate.score}.`
        : issues.join(" "),
      input.analyzerId,
    );
    return clone(candidate);
  }

  choosePreferred(input: {
    comparisonId: TimelineId;
    candidateId: TimelineId;
    decidedBy: TimelineUserId;
    reason: string;
  }): TimelineMixComparison {
    const comparison = this.requiredComparison(input.comparisonId);
    if (comparison.status !== "ready") {
      throw new Error("Every candidate must finish analysis before review.");
    }
    if (comparison.candidateIds.length < 2) {
      throw new Error("A comparison requires at least two candidates.");
    }
    const candidate = this.requiredCandidate(input.candidateId);
    if (
      candidate.comparisonId !== comparison.id ||
      candidate.status !== "eligible"
    ) {
      throw new Error("Only an eligible candidate in this comparison can win.");
    }
    if (!input.reason.trim()) {
      throw new Error("A human decision reason is required.");
    }
    const decided: TimelineMixComparison = {
      ...comparison,
      status: "decided",
      preferredCandidateId: candidate.id,
      decisionReason: input.reason.trim(),
      decidedAt: this.now().toISOString(),
      decidedBy: input.decidedBy,
    };
    this.saveComparison(decided);
    this.record(
      comparison.id,
      candidate.id,
      "preferred",
      input.reason.trim(),
      input.decidedBy,
    );
    return clone(decided);
  }

  rankCandidates(comparisonId: TimelineId): TimelineMixCandidate[] {
    const comparison = this.requiredComparison(comparisonId);
    return comparison.candidateIds
      .map((id) => this.candidates.get(id)!)
      .filter((candidate) => candidate.status === "eligible")
      .sort(
        (a, b) =>
          (b.score ?? 0) - (a.score ?? 0) ||
          a.createdAt.localeCompare(b.createdAt) ||
          a.id.localeCompare(b.id),
      )
      .map(clone);
  }

  getComparison(id: TimelineId): TimelineMixComparison | null {
    const value = this.comparisons.get(id);
    return value ? clone(value) : null;
  }

  listCandidates(comparisonId: TimelineId): TimelineMixCandidate[] {
    const comparison = this.requiredComparison(comparisonId);
    return comparison.candidateIds.map((id) => clone(this.candidates.get(id)!));
  }

  listReceipts(comparisonId?: TimelineId): TimelineMixEvaluationReceipt[] {
    return this.receipts
      .filter((receipt) => !comparisonId || receipt.comparisonId === comparisonId)
      .map(clone);
  }

  exportArchive(): TimelineMixEvaluationArchive {
    return {
      comparisons: [...this.comparisons.values()].map(clone),
      candidates: [...this.candidates.values()].map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineMixEvaluationArchive): void {
    this.assertUnique(archive.comparisons, "comparison");
    this.assertUnique(archive.candidates, "candidate");
    this.assertUnique(archive.receipts, "receipt");
    const candidateIds = new Set(archive.candidates.map((item) => item.id));
    archive.comparisons.forEach((comparison) => {
      if (comparison.candidateIds.some((id) => !candidateIds.has(id))) {
        throw new Error("Comparison archive references a missing candidate.");
      }
    });
    this.comparisons.clear();
    this.candidates.clear();
    this.receipts.length = 0;
    archive.comparisons.forEach((item) =>
      this.comparisons.set(item.id, clone(item)),
    );
    archive.candidates.forEach((item) =>
      this.candidates.set(item.id, clone(item)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.comparisonSequence = Math.max(
      0,
      ...archive.comparisons.map((item) => sequence(item.id)),
    );
    this.candidateSequence = Math.max(
      0,
      ...archive.candidates.map((item) => sequence(item.id)),
    );
    this.receiptSequence = Math.max(
      0,
      ...archive.receipts.map((item) => sequence(item.id)),
    );
  }

  private objective(
    patch?: Partial<TimelineMixEvaluationObjective>,
  ): TimelineMixEvaluationObjective {
    const objective = {
      ...DEFAULT_OBJECTIVE,
      ...clone(patch ?? {}),
      weights: {
        ...DEFAULT_OBJECTIVE.weights,
        ...(patch?.weights ?? {}),
      },
    };
    const weightTotal = Object.values(objective.weights).reduce(
      (sum, value) => sum + value,
      0,
    );
    if (
      !Object.values(objective.weights).every(
        (value) => Number.isFinite(value) && value >= 0,
      ) ||
      Math.abs(weightTotal - 1) > 0.000001
    ) {
      throw new Error("Evaluation weights must be nonnegative and total 1.");
    }
    if (
      objective.minimumLoudnessRangeLu > objective.maximumLoudnessRangeLu
    ) {
      throw new Error("Loudness-range limits are reversed.");
    }
    return objective;
  }

  private metricIssues(
    metrics: TimelineMixMetrics,
    objective: TimelineMixEvaluationObjective,
  ): string[] {
    const issues: string[] = [];
    if (
      !Object.values(metrics).every(
        (value) => typeof value === "number" && Number.isFinite(value),
      )
    ) {
      issues.push("Every analysis metric must be a finite number.");
      return issues;
    }
    if (metrics.clippedSampleCount < 0 || !Number.isInteger(metrics.clippedSampleCount)) {
      issues.push("Clipped sample count must be a nonnegative integer.");
    }
    if (metrics.stereoCorrelation < -1 || metrics.stereoCorrelation > 1) {
      issues.push("Stereo correlation must be between -1 and 1.");
    }
    if (metrics.loudnessRangeLu < 0) {
      issues.push("Loudness range cannot be negative.");
    }
    if (metrics.clippedSampleCount > 0) {
      issues.push("Candidate contains clipped samples.");
    }
    if (metrics.truePeakDbtp > objective.maximumTruePeakDbtp) {
      issues.push("Candidate exceeds the true-peak safety ceiling.");
    }
    if (metrics.stereoCorrelation < objective.minimumStereoCorrelation) {
      issues.push("Candidate exceeds the permitted phase-risk threshold.");
    }
    return issues;
  }

  private score(
    metrics: TimelineMixMetrics,
    objective: TimelineMixEvaluationObjective,
  ): number {
    const loudness = bounded(
      100 - Math.abs(metrics.integratedLufs - objective.targetLufs) * 12.5,
    );
    const peakSafety = bounded(
      100 - Math.max(0, objective.maximumTruePeakDbtp - metrics.truePeakDbtp) * 4,
    );
    const dynamicsDistance =
      metrics.loudnessRangeLu < objective.minimumLoudnessRangeLu
        ? objective.minimumLoudnessRangeLu - metrics.loudnessRangeLu
        : Math.max(
            0,
            metrics.loudnessRangeLu - objective.maximumLoudnessRangeLu,
          );
    const dynamics = bounded(100 - dynamicsDistance * 10);
    const stereoSafety = bounded((metrics.stereoCorrelation + 1) * 50);
    const score =
      loudness * objective.weights.loudness +
      peakSafety * objective.weights.peakSafety +
      dynamics * objective.weights.dynamics +
      stereoSafety * objective.weights.stereoSafety;
    return Math.round(score * 100) / 100;
  }

  private editableComparison(id: TimelineId): TimelineMixComparison {
    const comparison = this.requiredComparison(id);
    if (comparison.status === "decided" || comparison.status === "archived") {
      throw new Error("Mix comparison is no longer editable.");
    }
    return comparison;
  }

  private requiredComparison(id: TimelineId): TimelineMixComparison {
    const comparison = this.comparisons.get(id);
    if (!comparison) throw new Error("Mix comparison was not found.");
    return comparison;
  }

  private requiredCandidate(id: TimelineId): TimelineMixCandidate {
    const candidate = this.candidates.get(id);
    if (!candidate) throw new Error("Mix candidate was not found.");
    return candidate;
  }

  private saveComparison(value: TimelineMixComparison): void {
    this.comparisons.set(value.id, clone(value));
  }

  private record(
    comparisonId: TimelineId,
    candidateId: TimelineId,
    action: TimelineMixEvaluationReceipt["action"],
    message: string,
    recordedBy: string,
  ): void {
    this.receipts.push({
      id: `timeline-mix-evaluation-receipt-${++this.receiptSequence}`,
      comparisonId,
      candidateId,
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
      throw new Error(`Archive contains duplicate ${label} IDs.`);
    }
  }
}
