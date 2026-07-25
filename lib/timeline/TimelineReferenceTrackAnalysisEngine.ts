import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineReferenceRightsBasis =
  | "owned"
  | "licensed"
  | "permission"
  | "public-domain";

export type TimelineReferenceSpectralBalance = {
  low: number;
  lowMid: number;
  highMid: number;
  high: number;
};

export type TimelineReferenceSection = {
  label: string;
  startSeconds: number;
  endSeconds: number;
  energy: number;
};

export type TimelineReferenceFeatureProfile = {
  durationSeconds: number;
  tempoBpm: number;
  keyClass: number;
  mode: "major" | "minor" | "unknown";
  integratedLufs: number;
  truePeakDbtp: number;
  loudnessRangeLu: number;
  stereoWidth: number;
  spectralBalance: TimelineReferenceSpectralBalance;
  sections: TimelineReferenceSection[];
};

export type TimelineReferenceTrack = {
  id: TimelineId;
  projectId: TimelineId;
  title: string;
  creatorName: string;
  namedArtistReference: boolean;
  sourceFingerprint: string;
  rightsBasis: TimelineReferenceRightsBasis;
  rightsReference: string;
  purpose: string;
  status: "held" | "approved" | "rejected";
  features: TimelineReferenceFeatureProfile;
  createdAt: string;
  createdBy: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
  reviewNote?: string;
};

export type TimelineReferenceTarget = {
  id: TimelineId;
  projectId: TimelineId;
  artifactId: TimelineId;
  artifactFingerprint: string;
  label: string;
  features: TimelineReferenceFeatureProfile;
  analyzedAt: string;
  analyzedBy: string;
};

export type TimelineReferenceMetricGap = {
  metric:
    | "tempo"
    | "loudness"
    | "true-peak"
    | "dynamics"
    | "stereo-width"
    | "low"
    | "low-mid"
    | "high-mid"
    | "high";
  targetValue: number;
  referenceValue: number;
  difference: number;
  normalizedDistance: number;
};

export type TimelineReferenceRecommendation = {
  metric: TimelineReferenceMetricGap["metric"];
  priority: "low" | "medium" | "high";
  message: string;
};

export type TimelineReferenceComparison = {
  id: TimelineId;
  projectId: TimelineId;
  targetId: TimelineId;
  referenceIds: TimelineId[];
  status: "analysis-only" | "reviewed";
  aggregate: TimelineReferenceFeatureProfile;
  gaps: TimelineReferenceMetricGap[];
  recommendations: TimelineReferenceRecommendation[];
  similarityScore: number;
  policyNotice: string;
  createdAt: string;
  createdBy: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
  reviewNote?: string;
};

export type TimelineReferenceReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  referenceId?: TimelineId;
  comparisonId?: TimelineId;
  action:
    | "reference-held"
    | "reference-approved"
    | "reference-rejected"
    | "target-analyzed"
    | "comparison-created"
    | "comparison-reviewed";
  message: string;
  recordedAt: string;
  recordedBy: string;
};

export type TimelineReferenceTrackAnalysisArchive = {
  references: TimelineReferenceTrack[];
  targets: TimelineReferenceTarget[];
  comparisons: TimelineReferenceComparison[];
  receipts: TimelineReferenceReceipt[];
};

const POLICY_NOTICE =
  "Analysis reports measurable characteristics only. It does not copy audio, stems, performances, or artist identity.";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
  return value;
}

function bounded(value: number, minimum: number, maximum: number, label: string) {
  finite(value, label);
  if (value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function mean(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function rounded(value: number, precision = 4): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export class TimelineReferenceTrackAnalysisEngine {
  private readonly references = new Map<TimelineId, TimelineReferenceTrack>();
  private readonly targets = new Map<TimelineId, TimelineReferenceTarget>();
  private readonly comparisons = new Map<
    TimelineId,
    TimelineReferenceComparison
  >();
  private readonly receipts: TimelineReferenceReceipt[] = [];
  private referenceSequence = 0;
  private targetSequence = 0;
  private comparisonSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  registerReference(input: {
    projectId: TimelineId;
    title: string;
    creatorName: string;
    namedArtistReference?: boolean;
    sourceFingerprint: string;
    rightsBasis: TimelineReferenceRightsBasis;
    rightsReference: string;
    purpose: string;
    features: TimelineReferenceFeatureProfile;
    createdBy: TimelineUserId;
  }): TimelineReferenceTrack {
    const purpose = requiredText(input.purpose, "Reference purpose");
    if (
      input.namedArtistReference &&
      /\b(imitate|clone|copy|sound exactly like|replicate)\b/i.test(purpose)
    ) {
      throw new Error(
        "Named artists may be analyzed for objective characteristics, not imitation.",
      );
    }
    const reference: TimelineReferenceTrack = {
      id: `timeline-reference-track-${++this.referenceSequence}`,
      projectId: requiredText(input.projectId, "Project ID"),
      title: requiredText(input.title, "Reference title"),
      creatorName: requiredText(input.creatorName, "Reference creator"),
      namedArtistReference: input.namedArtistReference ?? false,
      sourceFingerprint: requiredText(
        input.sourceFingerprint,
        "Reference fingerprint",
      ),
      rightsBasis: input.rightsBasis,
      rightsReference: requiredText(
        input.rightsReference,
        "Reference rights evidence",
      ),
      purpose,
      status: "held",
      features: this.validateProfile(input.features),
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.references.set(reference.id, clone(reference));
    this.record({
      projectId: reference.projectId,
      referenceId: reference.id,
      action: "reference-held",
      message: "Reference profile held for rights and purpose review.",
      recordedBy: input.createdBy,
    });
    return clone(reference);
  }

  reviewReference(input: {
    referenceId: TimelineId;
    accepted: boolean;
    note: string;
    reviewedBy: TimelineUserId;
  }): TimelineReferenceTrack {
    const reference = this.requiredReference(input.referenceId);
    if (reference.status !== "held") {
      throw new Error("Reference review has already been completed.");
    }
    const updated: TimelineReferenceTrack = {
      ...reference,
      status: input.accepted ? "approved" : "rejected",
      reviewedAt: this.now().toISOString(),
      reviewedBy: input.reviewedBy,
      reviewNote: input.note.trim(),
    };
    this.references.set(updated.id, clone(updated));
    this.record({
      projectId: updated.projectId,
      referenceId: updated.id,
      action: input.accepted ? "reference-approved" : "reference-rejected",
      message: input.accepted
        ? "Human approved analysis-only reference use."
        : "Human rejected reference use.",
      recordedBy: input.reviewedBy,
    });
    return clone(updated);
  }

  recordTargetAnalysis(input: {
    projectId: TimelineId;
    artifactId: TimelineId;
    artifactFingerprint: string;
    label: string;
    features: TimelineReferenceFeatureProfile;
    analyzedBy: string;
  }): TimelineReferenceTarget {
    const target: TimelineReferenceTarget = {
      id: `timeline-reference-target-${++this.targetSequence}`,
      projectId: requiredText(input.projectId, "Project ID"),
      artifactId: requiredText(input.artifactId, "Target artifact ID"),
      artifactFingerprint: requiredText(
        input.artifactFingerprint,
        "Target fingerprint",
      ),
      label: input.label.trim() || "Target mix",
      features: this.validateProfile(input.features),
      analyzedAt: this.now().toISOString(),
      analyzedBy: requiredText(input.analyzedBy, "Analyzer ID"),
    };
    this.targets.set(target.id, clone(target));
    this.record({
      projectId: target.projectId,
      action: "target-analyzed",
      message: `Feature analysis recorded for ${target.label}.`,
      recordedBy: target.analyzedBy,
    });
    return clone(target);
  }

  compare(input: {
    targetId: TimelineId;
    referenceIds: TimelineId[];
    createdBy: TimelineUserId;
  }): TimelineReferenceComparison {
    const target = this.requiredTarget(input.targetId);
    const referenceIds = [...new Set(input.referenceIds)];
    if (!referenceIds.length) {
      throw new Error("Comparison requires at least one reference.");
    }
    const references = referenceIds.map((id) => {
      const reference = this.requiredReference(id);
      if (reference.projectId !== target.projectId) {
        throw new Error("References and target must belong to the same project.");
      }
      if (reference.status !== "approved") {
        throw new Error("Only approved references can enter a comparison.");
      }
      return reference;
    });
    const aggregate = this.aggregate(references.map((item) => item.features));
    const gaps = this.metricGaps(target.features, aggregate);
    const recommendations = gaps
      .filter((gap) => gap.normalizedDistance >= 0.1)
      .sort((left, right) => right.normalizedDistance - left.normalizedDistance)
      .map((gap) => this.recommendation(gap));
    const averageDistance = mean(
      gaps.map((gap) => Math.min(1, gap.normalizedDistance)),
    );
    const comparison: TimelineReferenceComparison = {
      id: `timeline-reference-comparison-${++this.comparisonSequence}`,
      projectId: target.projectId,
      targetId: target.id,
      referenceIds,
      status: "analysis-only",
      aggregate,
      gaps,
      recommendations,
      similarityScore: rounded(Math.max(0, (1 - averageDistance) * 100), 2),
      policyNotice: POLICY_NOTICE,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.comparisons.set(comparison.id, clone(comparison));
    this.record({
      projectId: target.projectId,
      comparisonId: comparison.id,
      action: "comparison-created",
      message: `Analysis-only comparison created from ${references.length} approved reference(s).`,
      recordedBy: input.createdBy,
    });
    return clone(comparison);
  }

  reviewComparison(input: {
    comparisonId: TimelineId;
    note: string;
    reviewedBy: TimelineUserId;
  }): TimelineReferenceComparison {
    const comparison = this.requiredComparison(input.comparisonId);
    if (comparison.status !== "analysis-only") {
      throw new Error("Reference comparison has already been reviewed.");
    }
    const updated: TimelineReferenceComparison = {
      ...comparison,
      status: "reviewed",
      reviewedAt: this.now().toISOString(),
      reviewedBy: input.reviewedBy,
      reviewNote: requiredText(input.note, "Comparison review note"),
    };
    this.comparisons.set(updated.id, clone(updated));
    this.record({
      projectId: updated.projectId,
      comparisonId: updated.id,
      action: "comparison-reviewed",
      message: "Human reviewed objective reference recommendations.",
      recordedBy: input.reviewedBy,
    });
    return clone(updated);
  }

  getReference(id: TimelineId): TimelineReferenceTrack | null {
    const value = this.references.get(id);
    return value ? clone(value) : null;
  }

  getTarget(id: TimelineId): TimelineReferenceTarget | null {
    const value = this.targets.get(id);
    return value ? clone(value) : null;
  }

  getComparison(id: TimelineId): TimelineReferenceComparison | null {
    const value = this.comparisons.get(id);
    return value ? clone(value) : null;
  }

  listReferences(projectId?: TimelineId): TimelineReferenceTrack[] {
    return [...this.references.values()]
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  listComparisons(projectId?: TimelineId): TimelineReferenceComparison[] {
    return [...this.comparisons.values()]
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  listReceipts(projectId?: TimelineId): TimelineReferenceReceipt[] {
    return this.receipts
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineReferenceTrackAnalysisArchive {
    return {
      references: [...this.references.values()].map(clone),
      targets: [...this.targets.values()].map(clone),
      comparisons: [...this.comparisons.values()].map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineReferenceTrackAnalysisArchive): void {
    this.references.clear();
    this.targets.clear();
    this.comparisons.clear();
    this.receipts.length = 0;
    archive.references.forEach((value) =>
      this.references.set(value.id, clone(value)),
    );
    archive.targets.forEach((value) =>
      this.targets.set(value.id, clone(value)),
    );
    archive.comparisons.forEach((value) =>
      this.comparisons.set(value.id, clone(value)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    this.referenceSequence = this.highest(
      archive.references.map((value) => value.id),
    );
    this.targetSequence = this.highest(
      archive.targets.map((value) => value.id),
    );
    this.comparisonSequence = this.highest(
      archive.comparisons.map((value) => value.id),
    );
    this.receiptSequence = this.highest(
      archive.receipts.map((value) => value.id),
    );
  }

  private validateProfile(
    value: TimelineReferenceFeatureProfile,
  ): TimelineReferenceFeatureProfile {
    bounded(value.durationSeconds, 0.01, 86_400, "Duration");
    bounded(value.tempoBpm, 20, 400, "Tempo");
    if (!Number.isInteger(value.keyClass)) {
      throw new Error("Key class must be a whole chromatic pitch.");
    }
    bounded(value.keyClass, 0, 11, "Key class");
    bounded(value.integratedLufs, -70, 5, "Integrated loudness");
    bounded(value.truePeakDbtp, -70, 10, "True peak");
    bounded(value.loudnessRangeLu, 0, 70, "Loudness range");
    bounded(value.stereoWidth, 0, 1, "Stereo width");
    const bands = Object.values(value.spectralBalance);
    bands.forEach((band) => bounded(band, 0, 1, "Spectral band"));
    if (Math.abs(bands.reduce((sum, band) => sum + band, 0) - 1) > 0.001) {
      throw new Error("Spectral balance bands must total 1.");
    }
    let priorEnd = 0;
    value.sections.forEach((section) => {
      requiredText(section.label, "Section label");
      bounded(section.energy, 0, 1, "Section energy");
      if (
        section.startSeconds < priorEnd ||
        section.endSeconds <= section.startSeconds ||
        section.endSeconds > value.durationSeconds
      ) {
        throw new Error("Reference sections must be ordered and within duration.");
      }
      priorEnd = section.endSeconds;
    });
    return clone(value);
  }

  private aggregate(
    profiles: TimelineReferenceFeatureProfile[],
  ): TimelineReferenceFeatureProfile {
    const numeric = (select: (value: TimelineReferenceFeatureProfile) => number) =>
      rounded(mean(profiles.map(select)));
    return {
      durationSeconds: numeric((value) => value.durationSeconds),
      tempoBpm: numeric((value) => value.tempoBpm),
      keyClass: Math.round(numeric((value) => value.keyClass)) % 12,
      mode:
        profiles.every((value) => value.mode === profiles[0].mode)
          ? profiles[0].mode
          : "unknown",
      integratedLufs: numeric((value) => value.integratedLufs),
      truePeakDbtp: numeric((value) => value.truePeakDbtp),
      loudnessRangeLu: numeric((value) => value.loudnessRangeLu),
      stereoWidth: numeric((value) => value.stereoWidth),
      spectralBalance: {
        low: numeric((value) => value.spectralBalance.low),
        lowMid: numeric((value) => value.spectralBalance.lowMid),
        highMid: numeric((value) => value.spectralBalance.highMid),
        high: numeric((value) => value.spectralBalance.high),
      },
      sections: [],
    };
  }

  private metricGaps(
    target: TimelineReferenceFeatureProfile,
    reference: TimelineReferenceFeatureProfile,
  ): TimelineReferenceMetricGap[] {
    const gap = (
      metric: TimelineReferenceMetricGap["metric"],
      targetValue: number,
      referenceValue: number,
      scale: number,
    ): TimelineReferenceMetricGap => ({
      metric,
      targetValue,
      referenceValue,
      difference: rounded(targetValue - referenceValue),
      normalizedDistance: rounded(
        Math.min(1, Math.abs(targetValue - referenceValue) / scale),
      ),
    });
    return [
      gap("tempo", target.tempoBpm, reference.tempoBpm, 40),
      gap("loudness", target.integratedLufs, reference.integratedLufs, 12),
      gap("true-peak", target.truePeakDbtp, reference.truePeakDbtp, 6),
      gap("dynamics", target.loudnessRangeLu, reference.loudnessRangeLu, 12),
      gap("stereo-width", target.stereoWidth, reference.stereoWidth, 1),
      gap("low", target.spectralBalance.low, reference.spectralBalance.low, 0.5),
      gap(
        "low-mid",
        target.spectralBalance.lowMid,
        reference.spectralBalance.lowMid,
        0.5,
      ),
      gap(
        "high-mid",
        target.spectralBalance.highMid,
        reference.spectralBalance.highMid,
        0.5,
      ),
      gap("high", target.spectralBalance.high, reference.spectralBalance.high, 0.5),
    ];
  }

  private recommendation(
    gap: TimelineReferenceMetricGap,
  ): TimelineReferenceRecommendation {
    const direction = gap.difference > 0 ? "above" : "below";
    return {
      metric: gap.metric,
      priority:
        gap.normalizedDistance >= 0.6
          ? "high"
          : gap.normalizedDistance >= 0.3
            ? "medium"
            : "low",
      message: `${gap.metric} is ${rounded(Math.abs(gap.difference), 2)} ${direction} the approved reference average; review before changing it.`,
    };
  }

  private requiredReference(id: TimelineId): TimelineReferenceTrack {
    const value = this.references.get(id);
    if (!value) throw new Error(`Unknown reference track: ${id}`);
    return clone(value);
  }

  private requiredTarget(id: TimelineId): TimelineReferenceTarget {
    const value = this.targets.get(id);
    if (!value) throw new Error(`Unknown reference target: ${id}`);
    return clone(value);
  }

  private requiredComparison(id: TimelineId): TimelineReferenceComparison {
    const value = this.comparisons.get(id);
    if (!value) throw new Error(`Unknown reference comparison: ${id}`);
    return clone(value);
  }

  private record(
    input: Omit<TimelineReferenceReceipt, "id" | "recordedAt">,
  ): void {
    this.receipts.push({
      ...input,
      id: `timeline-reference-receipt-${++this.receiptSequence}`,
      recordedAt: this.now().toISOString(),
    });
  }

  private highest(ids: string[]): number {
    return ids.reduce(
      (highest, id) =>
        Math.max(highest, Number(id.match(/(\d+)$/)?.[1] ?? 0)),
      0,
    );
  }
}
