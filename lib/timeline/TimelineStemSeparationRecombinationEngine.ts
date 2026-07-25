import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineStemRole =
  | "vocals"
  | "drums"
  | "bass"
  | "guitar"
  | "keys"
  | "strings"
  | "effects"
  | "other";

export type TimelineStemSource = {
  id: TimelineId;
  projectId: TimelineId;
  artifactId: TimelineId;
  fingerprint: string;
  durationSeconds: number;
  sampleRateHz: number;
  channels: number;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineSeparatedStem = {
  id: TimelineId;
  separationId: TimelineId;
  sourceId: TimelineId;
  role: TimelineStemRole;
  label: string;
  artifactId: TimelineId;
  fingerprint: string;
  sourceFingerprint: string;
  durationSeconds: number;
  sampleRateHz: number;
  channels: number;
  bleedScore: number;
  confidence: number;
  createdAt: string;
  createdBy: string;
};

export type TimelineStemSeparation = {
  id: TimelineId;
  projectId: TimelineId;
  sourceId: TimelineId;
  requestedRoles: TimelineStemRole[];
  status:
    | "held"
    | "approved"
    | "processing"
    | "awaiting-review"
    | "accepted"
    | "rejected"
    | "failed";
  stemIds: TimelineId[];
  issues: string[];
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
  reviewNote?: string;
};

export type TimelineStemMixComponent = {
  stemId: TimelineId;
  percentage: number;
  gainDb: number;
  pan: number;
  muted: boolean;
};

export type TimelineStemRecombination = {
  id: TimelineId;
  projectId: TimelineId;
  sourceId: TimelineId;
  separationId: TimelineId;
  name: string;
  components: TimelineStemMixComponent[];
  status:
    | "held"
    | "approved"
    | "awaiting-review"
    | "delivered"
    | "rejected"
    | "failed";
  outputArtifactId?: TimelineId;
  outputFingerprint?: string;
  outputDurationSeconds?: number;
  issues: string[];
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
};

export type TimelineStemReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  separationId?: TimelineId;
  recombinationId?: TimelineId;
  action:
    | "source-registered"
    | "separation-created"
    | "separation-approved"
    | "separation-started"
    | "stems-submitted"
    | "separation-reviewed"
    | "recombination-created"
    | "recombination-approved"
    | "mixdown-submitted"
    | "recombination-reviewed";
  message: string;
  recordedAt: string;
  recordedBy: string;
};

export type TimelineStemSeparationRecombinationArchive = {
  sources: TimelineStemSource[];
  separations: TimelineStemSeparation[];
  stems: TimelineSeparatedStem[];
  recombinations: TimelineStemRecombination[];
  receipts: TimelineStemReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function positiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number.`);
  }
  return value;
}

function bounded(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  }
  return value;
}

export class TimelineStemSeparationRecombinationEngine {
  private readonly sources = new Map<TimelineId, TimelineStemSource>();
  private readonly separations = new Map<TimelineId, TimelineStemSeparation>();
  private readonly stems = new Map<TimelineId, TimelineSeparatedStem>();
  private readonly recombinations = new Map<
    TimelineId,
    TimelineStemRecombination
  >();
  private readonly receipts: TimelineStemReceipt[] = [];
  private sourceSequence = 0;
  private separationSequence = 0;
  private stemSequence = 0;
  private recombinationSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  registerSource(input: {
    projectId: TimelineId;
    artifactId: TimelineId;
    fingerprint: string;
    durationSeconds: number;
    sampleRateHz: number;
    channels: number;
    createdBy: TimelineUserId;
  }): TimelineStemSource {
    this.validateFormat(input);
    const fingerprint = requiredText(input.fingerprint, "Source fingerprint");
    const existing = [...this.sources.values()].find(
      (source) => source.fingerprint === fingerprint,
    );
    if (existing) {
      if (
        existing.durationSeconds !== input.durationSeconds ||
        existing.sampleRateHz !== input.sampleRateHz ||
        existing.channels !== input.channels
      ) {
        throw new Error(
          "The same source fingerprint has conflicting audio metadata.",
        );
      }
      return clone(existing);
    }
    const source: TimelineStemSource = {
      id: `timeline-stem-source-${++this.sourceSequence}`,
      projectId: requiredText(input.projectId, "Project ID"),
      artifactId: requiredText(input.artifactId, "Source artifact ID"),
      fingerprint,
      durationSeconds: input.durationSeconds,
      sampleRateHz: input.sampleRateHz,
      channels: input.channels,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.sources.set(source.id, clone(source));
    this.record({
      projectId: source.projectId,
      action: "source-registered",
      message: "Fingerprint-backed stem source registered.",
      recordedBy: input.createdBy,
    });
    return clone(source);
  }

  createSeparation(input: {
    sourceId: TimelineId;
    requestedRoles: TimelineStemRole[];
    createdBy: TimelineUserId;
  }): TimelineStemSeparation {
    const source = this.requiredSource(input.sourceId);
    const requestedRoles = [...new Set(input.requestedRoles)];
    if (requestedRoles.length < 2) {
      throw new Error("Stem separation requires at least two unique roles.");
    }
    const separation: TimelineStemSeparation = {
      id: `timeline-stem-separation-${++this.separationSequence}`,
      projectId: source.projectId,
      sourceId: source.id,
      requestedRoles,
      status: "held",
      stemIds: [],
      issues: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.separations.set(separation.id, clone(separation));
    this.record({
      projectId: source.projectId,
      separationId: separation.id,
      action: "separation-created",
      message: "Stem-separation plan held for human approval.",
      recordedBy: input.createdBy,
    });
    return clone(separation);
  }

  approveSeparation(input: {
    separationId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineStemSeparation {
    const separation = this.requiredSeparation(input.separationId);
    if (separation.status !== "held") {
      throw new Error("Only a held separation can be approved.");
    }
    const updated = this.saveSeparation({
      ...separation,
      status: "approved",
      approvedAt: this.now().toISOString(),
      approvedBy: input.approvedBy,
    });
    this.record({
      projectId: separation.projectId,
      separationId: separation.id,
      action: "separation-approved",
      message: "Human approved the stem-separation plan.",
      recordedBy: input.approvedBy,
    });
    return updated;
  }

  startSeparation(input: {
    separationId: TimelineId;
    workerId: string;
  }): TimelineStemSeparation {
    const separation = this.requiredSeparation(input.separationId);
    if (separation.status !== "approved") {
      throw new Error("Only an approved separation can start processing.");
    }
    const updated = this.saveSeparation({
      ...separation,
      status: "processing",
    });
    this.record({
      projectId: separation.projectId,
      separationId: separation.id,
      action: "separation-started",
      message: "Approved stem separation started.",
      recordedBy: requiredText(input.workerId, "Worker ID"),
    });
    return updated;
  }

  submitStems(input: {
    separationId: TimelineId;
    stems: Array<
      Omit<
        TimelineSeparatedStem,
        "id" | "separationId" | "sourceId" | "createdAt" | "createdBy"
      >
    >;
    workerId: string;
  }): TimelineStemSeparation {
    const separation = this.requiredSeparation(input.separationId);
    const source = this.requiredSource(separation.sourceId);
    if (separation.status !== "processing") {
      throw new Error("Stem output requires a processing separation.");
    }
    const issues: string[] = [];
    const roles = input.stems.map((stem) => stem.role);
    for (const requested of separation.requestedRoles) {
      if (roles.filter((role) => role === requested).length !== 1) {
        issues.push(`Expected exactly one ${requested} stem.`);
      }
    }
    if (roles.some((role) => !separation.requestedRoles.includes(role))) {
      issues.push("Output contains an unrequested stem role.");
    }
    const fingerprints = new Set<string>();
    input.stems.forEach((stem) => {
      if (stem.sourceFingerprint !== source.fingerprint) {
        issues.push(`${stem.role} stem has mismatched source lineage.`);
      }
      if (Math.abs(stem.durationSeconds - source.durationSeconds) > 0.05) {
        issues.push(`${stem.role} stem duration does not match its source.`);
      }
      if (stem.sampleRateHz !== source.sampleRateHz) {
        issues.push(`${stem.role} stem sample rate does not match its source.`);
      }
      if (stem.channels < 1 || stem.channels > source.channels) {
        issues.push(`${stem.role} stem channel count is invalid.`);
      }
      if (!stem.artifactId.trim() || !stem.fingerprint.trim()) {
        issues.push(`${stem.role} stem requires artifact identity.`);
      }
      if (fingerprints.has(stem.fingerprint)) {
        issues.push("Separated stems require unique fingerprints.");
      }
      fingerprints.add(stem.fingerprint);
      if (stem.bleedScore < 0 || stem.bleedScore > 1) {
        issues.push(`${stem.role} bleed score is invalid.`);
      }
      if (stem.confidence < 0 || stem.confidence > 1) {
        issues.push(`${stem.role} confidence is invalid.`);
      }
    });
    if (issues.length) {
      const failed = this.saveSeparation({
        ...separation,
        status: "failed",
        issues,
      });
      this.record({
        projectId: separation.projectId,
        separationId: separation.id,
        action: "stems-submitted",
        message: `Stem validation failed: ${issues.join(" ")}`,
        recordedBy: input.workerId,
      });
      return failed;
    }
    const stemIds = input.stems.map((value) => {
      const stem: TimelineSeparatedStem = {
        ...clone(value),
        id: `timeline-separated-stem-${++this.stemSequence}`,
        separationId: separation.id,
        sourceId: source.id,
        label: value.label.trim() || value.role,
        createdAt: this.now().toISOString(),
        createdBy: input.workerId,
      };
      this.stems.set(stem.id, clone(stem));
      return stem.id;
    });
    const updated = this.saveSeparation({
      ...separation,
      status: "awaiting-review",
      stemIds,
      issues: [],
    });
    this.record({
      projectId: separation.projectId,
      separationId: separation.id,
      action: "stems-submitted",
      message: `${stemIds.length} lineage-verified stems await human review.`,
      recordedBy: input.workerId,
    });
    return updated;
  }

  reviewSeparation(input: {
    separationId: TimelineId;
    accepted: boolean;
    note: string;
    reviewedBy: TimelineUserId;
  }): TimelineStemSeparation {
    const separation = this.requiredSeparation(input.separationId);
    if (separation.status !== "awaiting-review") {
      throw new Error("Only submitted stems can be reviewed.");
    }
    const updated = this.saveSeparation({
      ...separation,
      status: input.accepted ? "accepted" : "rejected",
      reviewedAt: this.now().toISOString(),
      reviewedBy: input.reviewedBy,
      reviewNote: input.note.trim(),
    });
    this.record({
      projectId: separation.projectId,
      separationId: separation.id,
      action: "separation-reviewed",
      message: input.accepted
        ? "Human accepted the separated stem family."
        : "Human rejected the separated stem family.",
      recordedBy: input.reviewedBy,
    });
    return updated;
  }

  createRecombination(input: {
    separationId: TimelineId;
    name: string;
    components: TimelineStemMixComponent[];
    createdBy: TimelineUserId;
  }): TimelineStemRecombination {
    const separation = this.requiredSeparation(input.separationId);
    if (separation.status !== "accepted") {
      throw new Error("Recombination requires accepted separated stems.");
    }
    if (!input.components.length) {
      throw new Error("Recombination requires stem components.");
    }
    const componentIds = new Set<TimelineId>();
    input.components.forEach((component) => {
      const stem = this.requiredStem(component.stemId);
      if (stem.separationId !== separation.id) {
        throw new Error("Cannot combine stems from different separation families.");
      }
      if (componentIds.has(component.stemId)) {
        throw new Error("A stem can appear only once in a recombination.");
      }
      componentIds.add(component.stemId);
      bounded(component.percentage, 0, 100, "Stem percentage");
      bounded(component.gainDb, -120, 24, "Stem gain");
      bounded(component.pan, -1, 1, "Stem pan");
    });
    const percentage = input.components
      .filter((component) => !component.muted)
      .reduce((total, component) => total + component.percentage, 0);
    if (Math.abs(percentage - 100) > 0.0001) {
      throw new Error("Active stem percentages must total exactly 100%.");
    }
    const recombination: TimelineStemRecombination = {
      id: `timeline-stem-recombination-${++this.recombinationSequence}`,
      projectId: separation.projectId,
      sourceId: separation.sourceId,
      separationId: separation.id,
      name: input.name.trim() || "Stem recombination",
      components: clone(input.components),
      status: "held",
      issues: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.recombinations.set(recombination.id, clone(recombination));
    this.record({
      projectId: recombination.projectId,
      recombinationId: recombination.id,
      action: "recombination-created",
      message: "100% stem recombination held for human approval.",
      recordedBy: input.createdBy,
    });
    return clone(recombination);
  }

  approveRecombination(input: {
    recombinationId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineStemRecombination {
    const recombination = this.requiredRecombination(input.recombinationId);
    if (recombination.status !== "held") {
      throw new Error("Only a held recombination can be approved.");
    }
    const updated = this.saveRecombination({
      ...recombination,
      status: "approved",
      approvedAt: this.now().toISOString(),
      approvedBy: input.approvedBy,
    });
    this.record({
      projectId: recombination.projectId,
      recombinationId: recombination.id,
      action: "recombination-approved",
      message: "Human approved the 100% recombination plan.",
      recordedBy: input.approvedBy,
    });
    return updated;
  }

  submitMixdown(input: {
    recombinationId: TimelineId;
    outputArtifactId: TimelineId;
    outputFingerprint: string;
    outputDurationSeconds: number;
    renderedBy: string;
  }): TimelineStemRecombination {
    const recombination = this.requiredRecombination(input.recombinationId);
    const source = this.requiredSource(recombination.sourceId);
    if (recombination.status !== "approved") {
      throw new Error("Only an approved recombination can accept a mixdown.");
    }
    const issues: string[] = [];
    if (!input.outputArtifactId.trim() || !input.outputFingerprint.trim()) {
      issues.push("Mixdown requires artifact identity and fingerprint.");
    }
    if (Math.abs(input.outputDurationSeconds - source.durationSeconds) > 0.05) {
      issues.push("Mixdown duration does not match the source timeline.");
    }
    const updated = this.saveRecombination({
      ...recombination,
      status: issues.length ? "failed" : "awaiting-review",
      outputArtifactId: input.outputArtifactId.trim(),
      outputFingerprint: input.outputFingerprint.trim(),
      outputDurationSeconds: input.outputDurationSeconds,
      issues,
    });
    this.record({
      projectId: recombination.projectId,
      recombinationId: recombination.id,
      action: "mixdown-submitted",
      message: issues.length
        ? `Mixdown validation failed: ${issues.join(" ")}`
        : "Verified recombination mixdown awaits human review.",
      recordedBy: input.renderedBy,
    });
    return updated;
  }

  reviewRecombination(input: {
    recombinationId: TimelineId;
    accepted: boolean;
    reviewedBy: TimelineUserId;
  }): TimelineStemRecombination {
    const recombination = this.requiredRecombination(input.recombinationId);
    if (recombination.status !== "awaiting-review") {
      throw new Error("Only a verified mixdown can be reviewed.");
    }
    const updated = this.saveRecombination({
      ...recombination,
      status: input.accepted ? "delivered" : "rejected",
      reviewedAt: this.now().toISOString(),
      reviewedBy: input.reviewedBy,
    });
    this.record({
      projectId: recombination.projectId,
      recombinationId: recombination.id,
      action: "recombination-reviewed",
      message: input.accepted
        ? "Human accepted the recombined stem mix."
        : "Human rejected the recombined stem mix.",
      recordedBy: input.reviewedBy,
    });
    return updated;
  }

  getSeparation(id: TimelineId): TimelineStemSeparation | null {
    const value = this.separations.get(id);
    return value ? clone(value) : null;
  }

  getRecombination(id: TimelineId): TimelineStemRecombination | null {
    const value = this.recombinations.get(id);
    return value ? clone(value) : null;
  }

  listStems(separationId: TimelineId): TimelineSeparatedStem[] {
    return [...this.stems.values()]
      .filter((value) => value.separationId === separationId)
      .map(clone);
  }

  listReceipts(projectId?: TimelineId): TimelineStemReceipt[] {
    return this.receipts
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineStemSeparationRecombinationArchive {
    return {
      sources: [...this.sources.values()].map(clone),
      separations: [...this.separations.values()].map(clone),
      stems: [...this.stems.values()].map(clone),
      recombinations: [...this.recombinations.values()].map(clone),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineStemSeparationRecombinationArchive): void {
    this.sources.clear();
    this.separations.clear();
    this.stems.clear();
    this.recombinations.clear();
    this.receipts.length = 0;
    archive.sources.forEach((value) => this.sources.set(value.id, clone(value)));
    archive.separations.forEach((value) =>
      this.separations.set(value.id, clone(value)),
    );
    archive.stems.forEach((value) => this.stems.set(value.id, clone(value)));
    archive.recombinations.forEach((value) =>
      this.recombinations.set(value.id, clone(value)),
    );
    this.receipts.push(...archive.receipts.map(clone));
    this.sourceSequence = this.highest(archive.sources.map((value) => value.id));
    this.separationSequence = this.highest(
      archive.separations.map((value) => value.id),
    );
    this.stemSequence = this.highest(archive.stems.map((value) => value.id));
    this.recombinationSequence = this.highest(
      archive.recombinations.map((value) => value.id),
    );
    this.receiptSequence = this.highest(
      archive.receipts.map((value) => value.id),
    );
  }

  private validateFormat(input: {
    durationSeconds: number;
    sampleRateHz: number;
    channels: number;
  }): void {
    positiveFinite(input.durationSeconds, "Source duration");
    if (
      !Number.isInteger(input.sampleRateHz) ||
      input.sampleRateHz < 8_000 ||
      input.sampleRateHz > 384_000
    ) {
      throw new Error("Source sample rate is invalid.");
    }
    if (
      !Number.isInteger(input.channels) ||
      input.channels < 1 ||
      input.channels > 64
    ) {
      throw new Error("Source channel count is invalid.");
    }
  }

  private requiredSource(id: TimelineId): TimelineStemSource {
    const value = this.sources.get(id);
    if (!value) throw new Error(`Unknown stem source: ${id}`);
    return clone(value);
  }

  private requiredSeparation(id: TimelineId): TimelineStemSeparation {
    const value = this.separations.get(id);
    if (!value) throw new Error(`Unknown stem separation: ${id}`);
    return clone(value);
  }

  private requiredStem(id: TimelineId): TimelineSeparatedStem {
    const value = this.stems.get(id);
    if (!value) throw new Error(`Unknown separated stem: ${id}`);
    return clone(value);
  }

  private requiredRecombination(id: TimelineId): TimelineStemRecombination {
    const value = this.recombinations.get(id);
    if (!value) throw new Error(`Unknown stem recombination: ${id}`);
    return clone(value);
  }

  private saveSeparation(value: TimelineStemSeparation): TimelineStemSeparation {
    this.separations.set(value.id, clone(value));
    return clone(value);
  }

  private saveRecombination(
    value: TimelineStemRecombination,
  ): TimelineStemRecombination {
    this.recombinations.set(value.id, clone(value));
    return clone(value);
  }

  private record(input: Omit<TimelineStemReceipt, "id" | "recordedAt">): void {
    this.receipts.push({
      ...input,
      id: `timeline-stem-receipt-${++this.receiptSequence}`,
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
