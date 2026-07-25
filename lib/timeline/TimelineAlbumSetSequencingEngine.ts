import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineSequenceMode = "album" | "live-set";

export type TimelineSequenceTransition = {
  kind: "gap" | "crossfade" | "hard-cut" | "segue";
  durationMs: number;
  note?: string;
};

export type TimelineSequenceEntry = {
  id: TimelineId;
  trackId: TimelineId;
  title: string;
  durationMs: number;
  boundary: number;
  transitionAfter: TimelineSequenceTransition;
  required: boolean;
};

export type TimelineSequenceBreak = {
  id: TimelineId;
  afterEntryId: TimelineId;
  durationMs: number;
  kind: "side-change" | "intermission" | "encore-hold" | "technical";
  note?: string;
};

export type TimelineAlbumSetSequence = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  mode: TimelineSequenceMode;
  entries: TimelineSequenceEntry[];
  breaks: TimelineSequenceBreak[];
  allowDuplicateTracks: boolean;
  maximumDurationMs: number;
  calculatedDurationMs: number;
  revision: number;
  parentSequenceId: TimelineId | null;
  status: "draft" | "held" | "approved" | "active" | "rejected" | "archived";
  issues: string[];
  fingerprint: string;
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  activatedAt?: string;
  activatedBy?: TimelineUserId;
};

export type TimelineSequenceReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  sequenceId: TimelineId;
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

export type TimelineAlbumSetSequencingArchive = {
  sequences: TimelineAlbumSetSequence[];
  receipts: TimelineSequenceReceipt[];
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

function fingerprint(value: unknown): string {
  let hash = 2166136261;
  for (const character of JSON.stringify(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `sequence-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelineAlbumSetSequencingEngine {
  private readonly sequences = new Map<TimelineId, TimelineAlbumSetSequence>();
  private readonly receipts: TimelineSequenceReceipt[] = [];
  private sequenceSequence = 0;
  private entrySequence = 0;
  private breakSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createSequence(input: {
    projectId: TimelineId;
    name: string;
    mode: TimelineSequenceMode;
    entries: Array<Omit<TimelineSequenceEntry, "id">>;
    breaks?: Array<Omit<TimelineSequenceBreak, "id" | "afterEntryId"> & { afterEntryIndex: number }>;
    allowDuplicateTracks?: boolean;
    maximumDurationMs: number;
    createdBy: TimelineUserId;
  }): TimelineAlbumSetSequence {
    const entries = input.entries.map((entry) => ({
      ...clone(entry),
      id: `timeline-sequence-entry-${++this.entrySequence}`,
    }));
    const breaks = (input.breaks ?? []).map(({ afterEntryIndex, ...rest }) => {
      const entry = entries[afterEntryIndex];
      if (!entry) throw new Error(`Sequence break references unknown entry index ${afterEntryIndex}.`);
      return {
        ...clone(rest),
        id: `timeline-sequence-break-${++this.breakSequence}`,
        afterEntryId: entry.id,
      };
    });
    const sequence: TimelineAlbumSetSequence = {
      id: `timeline-album-set-sequence-${++this.sequenceSequence}`,
      projectId: text(input.projectId, "Project ID"),
      name: text(input.name, "Sequence name"),
      mode: input.mode,
      entries,
      breaks,
      allowDuplicateTracks: input.allowDuplicateTracks ?? false,
      maximumDurationMs: input.maximumDurationMs,
      calculatedDurationMs: 0,
      revision: 1,
      parentSequenceId: null,
      status: "draft",
      issues: [],
      fingerprint: "",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    sequence.calculatedDurationMs = this.duration(sequence);
    sequence.issues = this.inspect(sequence);
    sequence.fingerprint = this.sequenceFingerprint(sequence);
    this.sequences.set(sequence.id, clone(sequence));
    this.record(
      sequence,
      "created",
      sequence.issues.length
        ? `Sequence draft contains ${sequence.issues.length} blocking issue(s).`
        : "Sequence created as a valid non-active draft.",
      input.createdBy,
    );
    return clone(sequence);
  }

  revise(input: {
    sequenceId: TimelineId;
    entries?: Array<Omit<TimelineSequenceEntry, "id">>;
    breaks?: Array<Omit<TimelineSequenceBreak, "id">>;
    maximumDurationMs?: number;
    createdBy: TimelineUserId;
  }): TimelineAlbumSetSequence {
    const source = this.required(input.sequenceId);
    if (!["draft", "held", "approved", "active"].includes(source.status)) {
      throw new Error("This album/set sequence cannot be revised.");
    }
    const sequence: TimelineAlbumSetSequence = {
      ...source,
      id: `timeline-album-set-sequence-${++this.sequenceSequence}`,
      entries: input.entries
        ? input.entries.map((entry) => ({
            ...clone(entry),
            id: `timeline-sequence-entry-${++this.entrySequence}`,
          }))
        : clone(source.entries),
      breaks: input.breaks
        ? input.breaks.map((value) => ({
            ...clone(value),
            id: `timeline-sequence-break-${++this.breakSequence}`,
          }))
        : clone(source.breaks),
      maximumDurationMs: input.maximumDurationMs ?? source.maximumDurationMs,
      calculatedDurationMs: 0,
      revision: source.revision + 1,
      parentSequenceId: source.id,
      status: "draft",
      issues: [],
      fingerprint: "",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
      approvedAt: undefined,
      approvedBy: undefined,
      activatedAt: undefined,
      activatedBy: undefined,
    };
    sequence.calculatedDurationMs = this.duration(sequence);
    sequence.issues = this.inspect(sequence);
    sequence.fingerprint = this.sequenceFingerprint(sequence);
    this.sequences.set(sequence.id, clone(sequence));
    this.record(
      sequence,
      "revised",
      `Sequence revision ${sequence.revision} created without changing its parent.`,
      input.createdBy,
    );
    return clone(sequence);
  }

  submitForApproval(input: {
    sequenceId: TimelineId;
    submittedBy: TimelineUserId;
  }): TimelineAlbumSetSequence {
    const sequence = this.required(input.sequenceId);
    if (sequence.status !== "draft") {
      throw new Error("Only a draft album/set sequence can be submitted.");
    }
    const issues = this.inspect(sequence);
    if (issues.length) {
      const held = { ...sequence, status: "held" as const, issues };
      return this.update(
        held,
        "submitted",
        `Sequence held: ${issues.join(" ")}`,
        input.submittedBy,
      );
    }
    return this.update(
      { ...sequence, status: "held", issues: [] },
      "submitted",
      "Complete sequence held for independent approval.",
      input.submittedBy,
    );
  }

  approve(input: {
    sequenceId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineAlbumSetSequence {
    const sequence = this.required(input.sequenceId);
    if (sequence.status !== "held") {
      throw new Error("Only a held album/set sequence can be approved.");
    }
    const issues = this.inspect(sequence);
    if (issues.length) throw new Error(`Sequence has blocking issues: ${issues.join(" ")}`);
    if (sequence.createdBy === input.approvedBy) {
      throw new Error("Album/set sequence approval requires an independent reviewer.");
    }
    return this.update(
      {
        ...sequence,
        status: "approved",
        issues: [],
        approvedAt: this.now().toISOString(),
        approvedBy: input.approvedBy,
      },
      "approved",
      "Independent human approved the album/set sequence.",
      input.approvedBy,
    );
  }

  activate(input: {
    sequenceId: TimelineId;
    activatedBy: TimelineUserId;
  }): TimelineAlbumSetSequence {
    const sequence = this.required(input.sequenceId);
    if (sequence.status !== "approved") {
      throw new Error("Only an approved album/set sequence can become active.");
    }
    for (const current of this.sequences.values()) {
      if (
        current.projectId === sequence.projectId &&
        current.mode === sequence.mode &&
        current.status === "active"
      ) {
        this.sequences.set(current.id, clone({ ...current, status: "archived" as const }));
        this.record(current, "archived", "Superseded by a newer active sequence.", input.activatedBy);
      }
    }
    return this.update(
      {
        ...sequence,
        status: "active",
        activatedAt: this.now().toISOString(),
        activatedBy: input.activatedBy,
      },
      "activated",
      "Approved sequence activated; prior active sequence in this mode archived.",
      input.activatedBy,
    );
  }

  reject(input: {
    sequenceId: TimelineId;
    reason: string;
    rejectedBy: TimelineUserId;
  }): TimelineAlbumSetSequence {
    const sequence = this.required(input.sequenceId);
    if (sequence.status !== "held") {
      throw new Error("Only a held album/set sequence can be rejected.");
    }
    return this.update(
      { ...sequence, status: "rejected" },
      "rejected",
      text(input.reason, "Rejection reason"),
      input.rejectedBy,
    );
  }

  getSequence(id: TimelineId): TimelineAlbumSetSequence | null {
    const value = this.sequences.get(id);
    return value ? clone(value) : null;
  }

  listSequences(projectId?: TimelineId): TimelineAlbumSetSequence[] {
    return [...this.sequences.values()]
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  activeSequence(projectId: TimelineId, mode: TimelineSequenceMode): TimelineAlbumSetSequence | null {
    return (
      this.listSequences(projectId).find(
        (value) => value.mode === mode && value.status === "active",
      ) ?? null
    );
  }

  listReceipts(projectId?: TimelineId): TimelineSequenceReceipt[] {
    return this.receipts
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineAlbumSetSequencingArchive {
    return { sequences: this.listSequences(), receipts: this.receipts.map(clone) };
  }

  restoreArchive(archive: TimelineAlbumSetSequencingArchive): void {
    const ids = new Set<TimelineId>();
    const activeKeys = new Set<string>();
    this.sequences.clear();
    this.receipts.length = 0;
    for (const sequence of archive.sequences) {
      if (ids.has(sequence.id)) throw new Error("Duplicate album/set sequence ID.");
      ids.add(sequence.id);
      const issues = this.inspect(sequence);
      if (sequence.status === "active" && issues.length) {
        throw new Error(`Active sequence ${sequence.id} is invalid.`);
      }
      if (sequence.fingerprint !== this.sequenceFingerprint(sequence)) {
        throw new Error(`Album/set sequence ${sequence.id} fingerprint is invalid.`);
      }
      if (sequence.status === "active") {
        const key = `${sequence.projectId}|${sequence.mode}`;
        if (activeKeys.has(key)) throw new Error("A project cannot restore duplicate active modes.");
        activeKeys.add(key);
      }
      this.sequences.set(sequence.id, clone(sequence));
    }
    this.receipts.push(...archive.receipts.map(clone));
    this.sequenceSequence = this.highest(archive.sequences.map((value) => value.id));
    this.entrySequence = this.highest(
      archive.sequences.flatMap((value) => value.entries.map((entry) => entry.id)),
    );
    this.breakSequence = this.highest(
      archive.sequences.flatMap((value) => value.breaks.map((item) => item.id)),
    );
    this.receiptSequence = this.highest(archive.receipts.map((value) => value.id));
  }

  private inspect(sequence: TimelineAlbumSetSequence): string[] {
    const issues: string[] = [];
    if (!sequence.entries.length) issues.push("Sequence requires at least one track.");
    whole(sequence.maximumDurationMs, 1, 86_400_000, "Maximum sequence duration");
    const trackIds = new Set<TimelineId>();
    let priorBoundary = 1;
    for (const [index, entry] of sequence.entries.entries()) {
      text(entry.trackId, "Sequence track ID");
      text(entry.title, "Sequence track title");
      whole(entry.durationMs, 1, 86_400_000, "Track duration");
      whole(entry.boundary, 1, 100, "Sequence boundary");
      if (entry.boundary < priorBoundary || entry.boundary > priorBoundary + 1) {
        issues.push(`Entry ${index + 1} has a skipped or reversed boundary.`);
      }
      priorBoundary = entry.boundary;
      if (!sequence.allowDuplicateTracks && trackIds.has(entry.trackId)) {
        issues.push(`Track "${entry.title}" is duplicated.`);
      }
      trackIds.add(entry.trackId);
      whole(entry.transitionAfter.durationMs, 0, entry.durationMs, "Transition duration");
      if (entry.transitionAfter.kind === "hard-cut" && entry.transitionAfter.durationMs !== 0) {
        issues.push(`Hard cut after "${entry.title}" must have zero duration.`);
      }
      if (
        entry.transitionAfter.kind === "crossfade" &&
        entry.transitionAfter.durationMs === 0
      ) {
        issues.push(`Crossfade after "${entry.title}" requires a duration.`);
      }
    }
    const entryIds = new Set(sequence.entries.map((entry) => entry.id));
    const breakEntries = new Set<TimelineId>();
    for (const item of sequence.breaks) {
      if (!entryIds.has(item.afterEntryId)) issues.push("Break references an unknown entry.");
      if (breakEntries.has(item.afterEntryId)) issues.push("Only one break may follow an entry.");
      breakEntries.add(item.afterEntryId);
      whole(item.durationMs, 0, 21_600_000, "Break duration");
      if (sequence.mode === "album" && item.kind === "intermission") {
        issues.push("Album sequences cannot contain an intermission.");
      }
      if (sequence.mode === "live-set" && item.kind === "side-change") {
        issues.push("Live sets cannot contain an album side change.");
      }
    }
    for (let index = 0; index < sequence.entries.length - 1; index += 1) {
      const current = sequence.entries[index];
      const next = sequence.entries[index + 1];
      if (next.boundary > current.boundary && !breakEntries.has(current.id)) {
        issues.push(`Boundary ${current.boundary} requires a break after "${current.title}".`);
      }
    }
    const calculated = this.duration(sequence);
    if (calculated > sequence.maximumDurationMs) {
      issues.push(
        `Sequence duration ${calculated}ms exceeds maximum ${sequence.maximumDurationMs}ms.`,
      );
    }
    if (sequence.calculatedDurationMs !== calculated) {
      issues.push("Stored sequence duration does not match calculated timing.");
    }
    return [...new Set(issues)];
  }

  private duration(sequence: TimelineAlbumSetSequence): number {
    const tracks = sequence.entries.reduce((total, entry) => total + entry.durationMs, 0);
    const transitions = sequence.entries.reduce((total, entry) => {
      if (entry.transitionAfter.kind === "crossfade") {
        return total - entry.transitionAfter.durationMs;
      }
      if (entry.transitionAfter.kind === "gap") {
        return total + entry.transitionAfter.durationMs;
      }
      return total;
    }, 0);
    const breaks = sequence.breaks.reduce((total, item) => total + item.durationMs, 0);
    return tracks + transitions + breaks;
  }

  private sequenceFingerprint(sequence: TimelineAlbumSetSequence): string {
    return fingerprint({
      projectId: sequence.projectId,
      name: sequence.name,
      mode: sequence.mode,
      entries: sequence.entries,
      breaks: sequence.breaks,
      allowDuplicateTracks: sequence.allowDuplicateTracks,
      maximumDurationMs: sequence.maximumDurationMs,
      calculatedDurationMs: sequence.calculatedDurationMs,
      revision: sequence.revision,
      parentSequenceId: sequence.parentSequenceId,
    });
  }

  private required(id: TimelineId): TimelineAlbumSetSequence {
    const value = this.sequences.get(id);
    if (!value) throw new Error(`Unknown album/set sequence: ${id}`);
    return clone(value);
  }

  private update(
    value: TimelineAlbumSetSequence,
    action: TimelineSequenceReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): TimelineAlbumSetSequence {
    this.sequences.set(value.id, clone(value));
    this.record(value, action, message, recordedBy);
    return clone(value);
  }

  private record(
    value: TimelineAlbumSetSequence,
    action: TimelineSequenceReceipt["action"],
    message: string,
    recordedBy: TimelineUserId,
  ): void {
    this.receipts.push({
      id: `timeline-sequence-receipt-${++this.receiptSequence}`,
      projectId: value.projectId,
      sequenceId: value.id,
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
