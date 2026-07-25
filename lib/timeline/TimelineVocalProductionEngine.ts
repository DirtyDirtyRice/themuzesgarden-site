import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineVocalTake = {
  id: TimelineId;
  name: string;
  audioAssetId: TimelineId;
  singerId: TimelineUserId;
  startSample: number;
  sampleLength: number;
  sampleRate: number;
  channels: 1 | 2;
  capturedAt: string;
};

export type TimelineVocalCompSegment = {
  id: TimelineId;
  takeId: TimelineId;
  sourceStartSample: number;
  sourceEndSample: number;
  destinationStartSample: number;
  fadeInSamples: number;
  fadeOutSamples: number;
  gainDb: number;
};

export type TimelineVocalProcessor = {
  id: TimelineId;
  kind:
    | "pitch-correction"
    | "timing"
    | "de-esser"
    | "equalizer"
    | "compressor"
    | "saturation"
    | "reverb"
    | "delay"
    | "custom";
  name: string;
  enabled: boolean;
  wet: number;
  parameters: Record<string, number | string | boolean>;
};

export type TimelineVocalProduction = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  takes: TimelineVocalTake[];
  comp: TimelineVocalCompSegment[];
  processors: TimelineVocalProcessor[];
  revision: number;
  parentProductionId: TimelineId | null;
  status: "draft" | "held" | "approved" | "active" | "rejected" | "archived";
  fingerprint: string;
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  activatedAt?: string;
  activatedBy?: TimelineUserId;
};

export type TimelineVocalRevision = {
  name?: string;
  comp?: Array<Omit<TimelineVocalCompSegment, "id">>;
  processors?: Array<Omit<TimelineVocalProcessor, "id">>;
};

export type TimelineVocalReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  productionId: TimelineId;
  action:
    | "created"
    | "revised"
    | "submitted"
    | "approved"
    | "activated"
    | "rejected"
    | "archived";
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineVocalProductionArchive = {
  productions: TimelineVocalProduction[];
  receipts: TimelineVocalReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function whole(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`);
  }
  return value;
}

function finite(value: number, minimum: number, maximum: number, label: string): number {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be from ${minimum} to ${maximum}.`);
  }
  return value;
}

function fingerprint(value: unknown): string {
  let hash = 2166136261;
  for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `vocal-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelineVocalProductionEngine {
  private readonly productions = new Map<TimelineId, TimelineVocalProduction>();
  private readonly receipts: TimelineVocalReceipt[] = [];
  private productionSequence = 0;
  private takeSequence = 0;
  private segmentSequence = 0;
  private processorSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createProduction(input: {
    projectId: TimelineId;
    name: string;
    takes: Array<Omit<TimelineVocalTake, "id" | "capturedAt"> & { capturedAt?: string }>;
    comp: Array<Omit<TimelineVocalCompSegment, "id"> & { takeIndex: number }>;
    processors?: Array<Omit<TimelineVocalProcessor, "id">>;
    createdBy: TimelineUserId;
  }): TimelineVocalProduction {
    const takes = input.takes.map((take) => ({
      ...clone(take),
      id: `timeline-vocal-take-${++this.takeSequence}`,
      capturedAt: take.capturedAt ?? this.now().toISOString(),
    }));
    const comp = input.comp.map(({ takeIndex, ...segment }) => {
      const take = takes[takeIndex];
      if (!take) throw new Error(`Vocal comp references unknown take index ${takeIndex}.`);
      return {
        ...clone(segment),
        id: `timeline-vocal-segment-${++this.segmentSequence}`,
        takeId: take.id,
      };
    });
    const production: TimelineVocalProduction = {
      id: `timeline-vocal-production-${++this.productionSequence}`,
      projectId: requiredText(input.projectId, "Project ID"),
      name: requiredText(input.name, "Vocal production name"),
      takes,
      comp,
      processors: (input.processors ?? []).map((processor) => ({
        ...clone(processor),
        id: `timeline-vocal-processor-${++this.processorSequence}`,
      })),
      revision: 1,
      parentProductionId: null,
      status: "draft",
      fingerprint: "",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.validate(production);
    production.fingerprint = this.productionFingerprint(production);
    this.productions.set(production.id, clone(production));
    this.record(production, "created", "Vocal takes and comp created as a non-active draft.", input.createdBy);
    return clone(production);
  }

  revise(input: {
    productionId: TimelineId;
    changes: TimelineVocalRevision;
    createdBy: TimelineUserId;
  }): TimelineVocalProduction {
    const source = this.required(input.productionId);
    if (!["draft", "held", "approved", "active"].includes(source.status)) {
      throw new Error("This vocal production cannot be revised.");
    }
    const production: TimelineVocalProduction = {
      ...source,
      id: `timeline-vocal-production-${++this.productionSequence}`,
      name: input.changes.name
        ? requiredText(input.changes.name, "Vocal production name")
        : source.name,
      takes: clone(source.takes),
      comp: input.changes.comp
        ? input.changes.comp.map((segment) => ({
            ...clone(segment),
            id: `timeline-vocal-segment-${++this.segmentSequence}`,
          }))
        : clone(source.comp),
      processors: input.changes.processors
        ? input.changes.processors.map((processor) => ({
            ...clone(processor),
            id: `timeline-vocal-processor-${++this.processorSequence}`,
          }))
        : clone(source.processors),
      revision: source.revision + 1,
      parentProductionId: source.id,
      status: "draft",
      fingerprint: "",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
      approvedAt: undefined,
      approvedBy: undefined,
      activatedAt: undefined,
      activatedBy: undefined,
    };
    this.validate(production);
    production.fingerprint = this.productionFingerprint(production);
    this.productions.set(production.id, clone(production));
    this.record(
      production,
      "revised",
      `Vocal revision ${production.revision} created without changing its parent or raw takes.`,
      input.createdBy,
    );
    return clone(production);
  }

  submitForApproval(input: {
    productionId: TimelineId;
    submittedBy: TimelineUserId;
  }): TimelineVocalProduction {
    const production = this.required(input.productionId);
    if (production.status !== "draft") {
      throw new Error("Only a draft vocal production can be submitted.");
    }
    this.validate(production);
    return this.update(
      { ...production, status: "held" },
      "submitted",
      "Complete vocal production held for independent approval.",
      input.submittedBy,
    );
  }

  approve(input: {
    productionId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineVocalProduction {
    const production = this.required(input.productionId);
    if (production.status !== "held") {
      throw new Error("Only a held vocal production can be approved.");
    }
    if (production.createdBy === input.approvedBy) {
      throw new Error("Vocal production approval requires an independent reviewer.");
    }
    return this.update(
      {
        ...production,
        status: "approved",
        approvedAt: this.now().toISOString(),
        approvedBy: input.approvedBy,
      },
      "approved",
      "Independent human approved the vocal production.",
      input.approvedBy,
    );
  }

  activate(input: {
    productionId: TimelineId;
    activatedBy: TimelineUserId;
  }): TimelineVocalProduction {
    const production = this.required(input.productionId);
    if (production.status !== "approved") {
      throw new Error("Only an approved vocal production can become active.");
    }
    for (const current of this.productions.values()) {
      if (current.projectId === production.projectId && current.status === "active") {
        this.productions.set(current.id, clone({ ...current, status: "archived" as const }));
        this.record(current, "archived", "Superseded by a newly activated vocal production.", input.activatedBy);
      }
    }
    return this.update(
      {
        ...production,
        status: "active",
        activatedAt: this.now().toISOString(),
        activatedBy: input.activatedBy,
      },
      "activated",
      "Approved vocal production activated; prior active revision archived.",
      input.activatedBy,
    );
  }

  reject(input: {
    productionId: TimelineId;
    reason: string;
    rejectedBy: TimelineUserId;
  }): TimelineVocalProduction {
    const production = this.required(input.productionId);
    if (production.status !== "held") {
      throw new Error("Only a held vocal production can be rejected.");
    }
    return this.update(
      { ...production, status: "rejected" },
      "rejected",
      requiredText(input.reason, "Rejection reason"),
      input.rejectedBy,
    );
  }

  getProduction(id: TimelineId): TimelineVocalProduction | null {
    const production = this.productions.get(id);
    return production ? clone(production) : null;
  }

  listProductions(projectId?: TimelineId): TimelineVocalProduction[] {
    return [...this.productions.values()]
      .filter((production) => !projectId || production.projectId === projectId)
      .map(clone);
  }

  activeProduction(projectId: TimelineId): TimelineVocalProduction | null {
    return this.listProductions(projectId).find((production) => production.status === "active") ?? null;
  }

  listReceipts(projectId?: TimelineId): TimelineVocalReceipt[] {
    return this.receipts
      .filter((receipt) => !projectId || receipt.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineVocalProductionArchive {
    return {
      productions: this.listProductions(),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineVocalProductionArchive): void {
    const ids = new Set<TimelineId>();
    const activeProjects = new Set<TimelineId>();
    this.productions.clear();
    this.receipts.length = 0;
    for (const production of archive.productions) {
      if (ids.has(production.id)) throw new Error("Duplicate vocal production ID.");
      ids.add(production.id);
      this.validate(production);
      if (production.fingerprint !== this.productionFingerprint(production)) {
        throw new Error(`Vocal production ${production.id} fingerprint is invalid.`);
      }
      if (production.status === "active") {
        if (activeProjects.has(production.projectId)) {
          throw new Error("A project cannot restore multiple active vocal productions.");
        }
        activeProjects.add(production.projectId);
      }
      this.productions.set(production.id, clone(production));
    }
    this.receipts.push(...archive.receipts.map(clone));
    this.productionSequence = this.highest(archive.productions.map((value) => value.id));
    this.takeSequence = this.highest(
      archive.productions.flatMap((value) => value.takes.map((take) => take.id)),
    );
    this.segmentSequence = this.highest(
      archive.productions.flatMap((value) => value.comp.map((segment) => segment.id)),
    );
    this.processorSequence = this.highest(
      archive.productions.flatMap((value) => value.processors.map((processor) => processor.id)),
    );
    this.receiptSequence = this.highest(archive.receipts.map((value) => value.id));
  }

  private validate(production: TimelineVocalProduction): void {
    requiredText(production.projectId, "Project ID");
    requiredText(production.name, "Vocal production name");
    if (!production.takes.length) throw new Error("Vocal production requires at least one take.");
    if (!production.comp.length) throw new Error("Vocal production requires a comp selection.");
    const takeIds = new Set<TimelineId>();
    for (const take of production.takes) {
      if (takeIds.has(take.id)) throw new Error("Vocal take IDs must be unique.");
      takeIds.add(take.id);
      requiredText(take.name, "Vocal take name");
      requiredText(take.audioAssetId, "Vocal audio asset ID");
      requiredText(take.singerId, "Singer ID");
      whole(take.startSample, 0, Number.MAX_SAFE_INTEGER, "Take start sample");
      whole(take.sampleLength, 1, Number.MAX_SAFE_INTEGER, "Take sample length");
      whole(take.sampleRate, 8_000, 384_000, "Take sample rate");
      if (Number.isNaN(Date.parse(take.capturedAt))) {
        throw new Error("Vocal take capture date must be valid.");
      }
    }
    const segmentIds = new Set<TimelineId>();
    let priorDestinationEnd = 0;
    for (const segment of production.comp) {
      if (segmentIds.has(segment.id)) throw new Error("Vocal comp segment IDs must be unique.");
      segmentIds.add(segment.id);
      const take = production.takes.find((candidate) => candidate.id === segment.takeId);
      if (!take) throw new Error("Vocal comp segment references an unknown take.");
      whole(segment.sourceStartSample, take.startSample, take.startSample + take.sampleLength - 1, "Comp source start");
      whole(segment.sourceEndSample, segment.sourceStartSample + 1, take.startSample + take.sampleLength, "Comp source end");
      whole(segment.destinationStartSample, 0, Number.MAX_SAFE_INTEGER, "Comp destination start");
      const length = segment.sourceEndSample - segment.sourceStartSample;
      if (segment.destinationStartSample < priorDestinationEnd) {
        throw new Error("Vocal comp segments must be ordered and non-overlapping.");
      }
      whole(segment.fadeInSamples, 0, length, "Comp fade-in");
      whole(segment.fadeOutSamples, 0, length, "Comp fade-out");
      if (segment.fadeInSamples + segment.fadeOutSamples > length) {
        throw new Error("Vocal comp fades cannot exceed the segment length.");
      }
      finite(segment.gainDb, -96, 24, "Comp gain");
      priorDestinationEnd = segment.destinationStartSample + length;
    }
    const processorIds = new Set<TimelineId>();
    for (const processor of production.processors) {
      if (processorIds.has(processor.id)) throw new Error("Vocal processor IDs must be unique.");
      processorIds.add(processor.id);
      requiredText(processor.name, "Vocal processor name");
      finite(processor.wet, 0, 1, "Processor wet value");
      for (const [name, value] of Object.entries(processor.parameters)) {
        requiredText(name, "Processor parameter name");
        if (typeof value === "number" && !Number.isFinite(value)) {
          throw new Error(`Processor parameter ${name} must be finite.`);
        }
      }
    }
  }

  private productionFingerprint(production: TimelineVocalProduction): string {
    return fingerprint({
      projectId: production.projectId,
      name: production.name,
      takes: production.takes,
      comp: production.comp,
      processors: production.processors,
      revision: production.revision,
      parentProductionId: production.parentProductionId,
    });
  }

  private required(id: TimelineId): TimelineVocalProduction {
    const production = this.productions.get(id);
    if (!production) throw new Error(`Unknown vocal production: ${id}`);
    return clone(production);
  }

  private update(
    production: TimelineVocalProduction,
    action: TimelineVocalReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): TimelineVocalProduction {
    this.productions.set(production.id, clone(production));
    this.record(production, action, message, recordedBy);
    return clone(production);
  }

  private record(
    production: TimelineVocalProduction,
    action: TimelineVocalReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): void {
    this.receipts.push({
      id: `timeline-vocal-receipt-${++this.receiptSequence}`,
      projectId: production.projectId,
      productionId: production.id,
      action,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private highest(ids: string[]): number {
    return ids.reduce(
      (highest, id) => Math.max(highest, Number(id.match(/(\d+)$/)?.[1] ?? 0)),
      0,
    );
  }
}
