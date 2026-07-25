import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineCapturePerformer = {
  id: TimelineId;
  userId: TimelineUserId;
  displayName: string;
  role: string;
};

export type TimelineCaptureSource = {
  id: TimelineId;
  name: string;
  kind: "audio" | "video" | "midi" | "motion" | "control";
  sampleRate?: number;
  frameRate?: number;
  channelCount?: number;
  syncOffsetMs: number;
};

export type TimelineCapturedAsset = {
  id: TimelineId;
  sourceId: TimelineId;
  assetId: TimelineId;
  checksum: string;
  durationMs: number;
};

export type TimelinePerformanceTake = {
  id: TimelineId;
  name: string;
  performerIds: TimelineId[];
  startedAt: string;
  durationMs: number;
  assets: TimelineCapturedAsset[];
};

export type TimelinePerformanceMarker = {
  id: TimelineId;
  takeId: TimelineId;
  positionMs: number;
  kind: "cue" | "mistake" | "highlight" | "section" | "note";
  label: string;
};

export type TimelinePerformanceCapture = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  location: string;
  performers: TimelineCapturePerformer[];
  sources: TimelineCaptureSource[];
  takes: TimelinePerformanceTake[];
  selectedTakeId: TimelineId;
  markers: TimelinePerformanceMarker[];
  revision: number;
  parentCaptureId: TimelineId | null;
  status: "draft" | "held" | "approved" | "active" | "rejected" | "archived";
  fingerprint: string;
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  activatedAt?: string;
  activatedBy?: TimelineUserId;
};

export type TimelinePerformanceCaptureReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  captureId: TimelineId;
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

export type TimelinePerformanceCaptureArchive = {
  captures: TimelinePerformanceCapture[];
  receipts: TimelinePerformanceCaptureReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function text(value: string, label: string): string {
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
  return `capture-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelinePerformanceCaptureEngine {
  private readonly captures = new Map<TimelineId, TimelinePerformanceCapture>();
  private readonly receipts: TimelinePerformanceCaptureReceipt[] = [];
  private captureSequence = 0;
  private performerSequence = 0;
  private sourceSequence = 0;
  private takeSequence = 0;
  private assetSequence = 0;
  private markerSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createCapture(input: {
    projectId: TimelineId;
    name: string;
    location: string;
    performers: Array<Omit<TimelineCapturePerformer, "id">>;
    sources: Array<Omit<TimelineCaptureSource, "id">>;
    takes: Array<{
      name: string;
      performerIndexes: number[];
      startedAt?: string;
      durationMs: number;
      assets: Array<Omit<TimelineCapturedAsset, "id" | "sourceId"> & { sourceIndex: number }>;
    }>;
    selectedTakeIndex: number;
    markers?: Array<Omit<TimelinePerformanceMarker, "id" | "takeId"> & { takeIndex: number }>;
    createdBy: TimelineUserId;
  }): TimelinePerformanceCapture {
    const performers = input.performers.map((performer) => ({
      ...clone(performer),
      id: `timeline-capture-performer-${++this.performerSequence}`,
    }));
    const sources = input.sources.map((source) => ({
      ...clone(source),
      id: `timeline-capture-source-${++this.sourceSequence}`,
    }));
    const takes = input.takes.map((take) => ({
      id: `timeline-performance-take-${++this.takeSequence}`,
      name: take.name,
      performerIds: take.performerIndexes.map((index) => {
        const performer = performers[index];
        if (!performer) throw new Error(`Performance take references unknown performer index ${index}.`);
        return performer.id;
      }),
      startedAt: take.startedAt ?? this.now().toISOString(),
      durationMs: take.durationMs,
      assets: take.assets.map(({ sourceIndex, ...asset }) => {
        const source = sources[sourceIndex];
        if (!source) throw new Error(`Captured asset references unknown source index ${sourceIndex}.`);
        return {
          ...clone(asset),
          id: `timeline-captured-asset-${++this.assetSequence}`,
          sourceId: source.id,
        };
      }),
    }));
    const selectedTake = takes[input.selectedTakeIndex];
    if (!selectedTake) throw new Error("Selected performance take index is invalid.");
    const markers = (input.markers ?? []).map(({ takeIndex, ...marker }) => {
      const take = takes[takeIndex];
      if (!take) throw new Error(`Performance marker references unknown take index ${takeIndex}.`);
      return {
        ...clone(marker),
        id: `timeline-performance-marker-${++this.markerSequence}`,
        takeId: take.id,
      };
    });
    const capture: TimelinePerformanceCapture = {
      id: `timeline-performance-capture-${++this.captureSequence}`,
      projectId: text(input.projectId, "Project ID"),
      name: text(input.name, "Performance capture name"),
      location: text(input.location, "Capture location"),
      performers,
      sources,
      takes,
      selectedTakeId: selectedTake.id,
      markers,
      revision: 1,
      parentCaptureId: null,
      status: "draft",
      fingerprint: "",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.validate(capture);
    capture.fingerprint = this.captureFingerprint(capture);
    this.captures.set(capture.id, clone(capture));
    this.record(capture, "created", "Synchronized performance capture created as a draft.", input.createdBy);
    return clone(capture);
  }

  revise(input: {
    captureId: TimelineId;
    selectedTakeId?: TimelineId;
    markers?: Array<Omit<TimelinePerformanceMarker, "id">>;
    createdBy: TimelineUserId;
  }): TimelinePerformanceCapture {
    const source = this.required(input.captureId);
    if (!["draft", "held", "approved", "active"].includes(source.status)) {
      throw new Error("This performance capture cannot be revised.");
    }
    const capture: TimelinePerformanceCapture = {
      ...source,
      id: `timeline-performance-capture-${++this.captureSequence}`,
      performers: clone(source.performers),
      sources: clone(source.sources),
      takes: clone(source.takes),
      selectedTakeId: input.selectedTakeId ?? source.selectedTakeId,
      markers: input.markers
        ? input.markers.map((marker) => ({
            ...clone(marker),
            id: `timeline-performance-marker-${++this.markerSequence}`,
          }))
        : clone(source.markers),
      revision: source.revision + 1,
      parentCaptureId: source.id,
      status: "draft",
      fingerprint: "",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
      approvedAt: undefined,
      approvedBy: undefined,
      activatedAt: undefined,
      activatedBy: undefined,
    };
    this.validate(capture);
    capture.fingerprint = this.captureFingerprint(capture);
    this.captures.set(capture.id, clone(capture));
    this.record(
      capture,
      "revised",
      `Capture review revision ${capture.revision} created without changing raw assets.`,
      input.createdBy,
    );
    return clone(capture);
  }

  submitForApproval(input: {
    captureId: TimelineId;
    submittedBy: TimelineUserId;
  }): TimelinePerformanceCapture {
    const capture = this.required(input.captureId);
    if (capture.status !== "draft") {
      throw new Error("Only a draft performance capture can be submitted.");
    }
    this.validate(capture);
    return this.update(
      { ...capture, status: "held" },
      "submitted",
      "Complete synchronized capture held for independent approval.",
      input.submittedBy,
    );
  }

  approve(input: {
    captureId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelinePerformanceCapture {
    const capture = this.required(input.captureId);
    if (capture.status !== "held") {
      throw new Error("Only a held performance capture can be approved.");
    }
    if (capture.createdBy === input.approvedBy) {
      throw new Error("Performance capture approval requires an independent reviewer.");
    }
    return this.update(
      {
        ...capture,
        status: "approved",
        approvedAt: this.now().toISOString(),
        approvedBy: input.approvedBy,
      },
      "approved",
      "Independent human approved the performance capture.",
      input.approvedBy,
    );
  }

  activate(input: {
    captureId: TimelineId;
    activatedBy: TimelineUserId;
  }): TimelinePerformanceCapture {
    const capture = this.required(input.captureId);
    if (capture.status !== "approved") {
      throw new Error("Only an approved performance capture can become active.");
    }
    for (const current of this.captures.values()) {
      if (current.projectId === capture.projectId && current.status === "active") {
        this.captures.set(current.id, clone({ ...current, status: "archived" as const }));
        this.record(current, "archived", "Superseded by a newer active performance capture.", input.activatedBy);
      }
    }
    return this.update(
      {
        ...capture,
        status: "active",
        activatedAt: this.now().toISOString(),
        activatedBy: input.activatedBy,
      },
      "activated",
      "Approved performance capture activated; prior active revision archived.",
      input.activatedBy,
    );
  }

  reject(input: {
    captureId: TimelineId;
    reason: string;
    rejectedBy: TimelineUserId;
  }): TimelinePerformanceCapture {
    const capture = this.required(input.captureId);
    if (capture.status !== "held") {
      throw new Error("Only a held performance capture can be rejected.");
    }
    return this.update(
      { ...capture, status: "rejected" },
      "rejected",
      text(input.reason, "Rejection reason"),
      input.rejectedBy,
    );
  }

  getCapture(id: TimelineId): TimelinePerformanceCapture | null {
    const capture = this.captures.get(id);
    return capture ? clone(capture) : null;
  }

  listCaptures(projectId?: TimelineId): TimelinePerformanceCapture[] {
    return [...this.captures.values()]
      .filter((capture) => !projectId || capture.projectId === projectId)
      .map(clone);
  }

  activeCapture(projectId: TimelineId): TimelinePerformanceCapture | null {
    return this.listCaptures(projectId).find((capture) => capture.status === "active") ?? null;
  }

  listReceipts(projectId?: TimelineId): TimelinePerformanceCaptureReceipt[] {
    return this.receipts
      .filter((receipt) => !projectId || receipt.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelinePerformanceCaptureArchive {
    return { captures: this.listCaptures(), receipts: this.receipts.map(clone) };
  }

  restoreArchive(archive: TimelinePerformanceCaptureArchive): void {
    const ids = new Set<TimelineId>();
    const activeProjects = new Set<TimelineId>();
    this.captures.clear();
    this.receipts.length = 0;
    for (const capture of archive.captures) {
      if (ids.has(capture.id)) throw new Error("Duplicate performance capture ID.");
      ids.add(capture.id);
      this.validate(capture);
      if (capture.fingerprint !== this.captureFingerprint(capture)) {
        throw new Error(`Performance capture ${capture.id} fingerprint is invalid.`);
      }
      if (capture.status === "active") {
        if (activeProjects.has(capture.projectId)) {
          throw new Error("A project cannot restore multiple active performance captures.");
        }
        activeProjects.add(capture.projectId);
      }
      this.captures.set(capture.id, clone(capture));
    }
    this.receipts.push(...archive.receipts.map(clone));
    this.captureSequence = this.highest(archive.captures.map((value) => value.id));
    this.performerSequence = this.highest(
      archive.captures.flatMap((value) => value.performers.map((performer) => performer.id)),
    );
    this.sourceSequence = this.highest(
      archive.captures.flatMap((value) => value.sources.map((source) => source.id)),
    );
    this.takeSequence = this.highest(
      archive.captures.flatMap((value) => value.takes.map((take) => take.id)),
    );
    this.assetSequence = this.highest(
      archive.captures.flatMap((value) =>
        value.takes.flatMap((take) => take.assets.map((asset) => asset.id)),
      ),
    );
    this.markerSequence = this.highest(
      archive.captures.flatMap((value) => value.markers.map((marker) => marker.id)),
    );
    this.receiptSequence = this.highest(archive.receipts.map((value) => value.id));
  }

  private validate(capture: TimelinePerformanceCapture): void {
    text(capture.projectId, "Project ID");
    text(capture.name, "Performance capture name");
    text(capture.location, "Capture location");
    if (!capture.performers.length) throw new Error("Performance capture requires a performer.");
    if (!capture.sources.length) throw new Error("Performance capture requires a capture source.");
    if (!capture.takes.length) throw new Error("Performance capture requires a take.");
    const performerIds = new Set<TimelineId>();
    for (const performer of capture.performers) {
      if (performerIds.has(performer.id)) throw new Error("Capture performer IDs must be unique.");
      performerIds.add(performer.id);
      text(performer.userId, "Performer user ID");
      text(performer.displayName, "Performer name");
      text(performer.role, "Performer role");
    }
    const sourceIds = new Set<TimelineId>();
    for (const source of capture.sources) {
      if (sourceIds.has(source.id)) throw new Error("Capture source IDs must be unique.");
      sourceIds.add(source.id);
      text(source.name, "Capture source name");
      finite(source.syncOffsetMs, -60_000, 60_000, "Source sync offset");
      if (source.kind === "audio") {
        whole(source.sampleRate ?? 0, 8_000, 384_000, "Audio sample rate");
        whole(source.channelCount ?? 0, 1, 128, "Audio channel count");
      }
      if (source.kind === "video") {
        finite(source.frameRate ?? 0, 1, 240, "Video frame rate");
      }
    }
    const takeIds = new Set<TimelineId>();
    for (const take of capture.takes) {
      if (takeIds.has(take.id)) throw new Error("Performance take IDs must be unique.");
      takeIds.add(take.id);
      text(take.name, "Performance take name");
      if (Number.isNaN(Date.parse(take.startedAt))) throw new Error("Take start time must be valid.");
      whole(take.durationMs, 1, 86_400_000, "Take duration");
      if (!take.performerIds.length || take.performerIds.some((id) => !performerIds.has(id))) {
        throw new Error("Performance take references an unknown performer.");
      }
      const capturedSources = new Set<TimelineId>();
      for (const asset of take.assets) {
        if (!sourceIds.has(asset.sourceId)) throw new Error("Captured asset references an unknown source.");
        if (capturedSources.has(asset.sourceId)) throw new Error("A take cannot contain duplicate source assets.");
        capturedSources.add(asset.sourceId);
        text(asset.assetId, "Captured asset ID");
        text(asset.checksum, "Captured asset checksum");
        whole(asset.durationMs, 1, 86_400_000, "Captured asset duration");
        if (Math.abs(asset.durationMs - take.durationMs) > 1_000) {
          throw new Error("Captured asset duration is outside synchronization tolerance.");
        }
      }
      if (capturedSources.size !== sourceIds.size) {
        throw new Error("Every performance take must contain all declared capture sources.");
      }
    }
    if (!takeIds.has(capture.selectedTakeId)) {
      throw new Error("Selected performance take is unknown.");
    }
    const markerIds = new Set<TimelineId>();
    for (const marker of capture.markers) {
      if (markerIds.has(marker.id)) throw new Error("Performance marker IDs must be unique.");
      markerIds.add(marker.id);
      const take = capture.takes.find((candidate) => candidate.id === marker.takeId);
      if (!take) throw new Error("Performance marker references an unknown take.");
      whole(marker.positionMs, 0, take.durationMs, "Performance marker position");
      text(marker.label, "Performance marker label");
    }
  }

  private captureFingerprint(capture: TimelinePerformanceCapture): string {
    return fingerprint({
      projectId: capture.projectId,
      name: capture.name,
      location: capture.location,
      performers: capture.performers,
      sources: capture.sources,
      takes: capture.takes,
      selectedTakeId: capture.selectedTakeId,
      markers: capture.markers,
      revision: capture.revision,
      parentCaptureId: capture.parentCaptureId,
    });
  }

  private required(id: TimelineId): TimelinePerformanceCapture {
    const capture = this.captures.get(id);
    if (!capture) throw new Error(`Unknown performance capture: ${id}`);
    return clone(capture);
  }

  private update(
    capture: TimelinePerformanceCapture,
    action: TimelinePerformanceCaptureReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): TimelinePerformanceCapture {
    this.captures.set(capture.id, clone(capture));
    this.record(capture, action, message, recordedBy);
    return clone(capture);
  }

  private record(
    capture: TimelinePerformanceCapture,
    action: TimelinePerformanceCaptureReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): void {
    this.receipts.push({
      id: `timeline-capture-receipt-${++this.receiptSequence}`,
      projectId: capture.projectId,
      captureId: capture.id,
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
