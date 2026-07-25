import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineMidiTempoPoint = {
  tick: number;
  bpm: number;
};

export type TimelineMidiTimeSignature = {
  tick: number;
  numerator: number;
  denominator: 1 | 2 | 4 | 8 | 16 | 32;
};

export type TimelineMidiSection = {
  id: TimelineId;
  name: string;
  startTick: number;
  endTick: number;
};

export type TimelineMidiNote = {
  id: TimelineId;
  pitch: number;
  velocity: number;
  startTick: number;
  durationTicks: number;
  channel: number;
};

export type TimelineMidiTrack = {
  id: TimelineId;
  name: string;
  instrument: string;
  program: number;
  channel: number;
  muted: boolean;
  notes: TimelineMidiNote[];
};

export type TimelineMidiArrangement = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  ticksPerQuarter: number;
  lengthTicks: number;
  tempoMap: TimelineMidiTempoPoint[];
  timeSignatures: TimelineMidiTimeSignature[];
  sections: TimelineMidiSection[];
  tracks: TimelineMidiTrack[];
  revision: number;
  parentArrangementId: TimelineId | null;
  status: "draft" | "held" | "approved" | "active" | "rejected" | "archived";
  fingerprint: string;
  createdAt: string;
  createdBy: TimelineUserId;
  approvedAt?: string;
  approvedBy?: TimelineUserId;
  activatedAt?: string;
  activatedBy?: TimelineUserId;
};

export type TimelineMidiTransform =
  | {
      kind: "transpose";
      trackIds: TimelineId[];
      semitones: number;
    }
  | {
      kind: "quantize";
      trackIds: TimelineId[];
      gridTicks: number;
      strength: number;
    }
  | {
      kind: "velocity-scale";
      trackIds: TimelineId[];
      factor: number;
    };

export type TimelineMidiReceipt = {
  id: TimelineId;
  projectId: TimelineId;
  arrangementId: TimelineId;
  action:
    | "created"
    | "transformed"
    | "submitted"
    | "approved"
    | "activated"
    | "rejected"
    | "archived";
  message: string;
  recordedAt: string;
  recordedBy: string;
};

export type TimelineMidiArrangementArchive = {
  arrangements: TimelineMidiArrangement[];
  receipts: TimelineMidiReceipt[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function text(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function integer(
  value: number,
  minimum: number,
  maximum: number,
  label: string,
): number {
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
  return `midi-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export class TimelineMidiArrangementEngine {
  private readonly arrangements = new Map<TimelineId, TimelineMidiArrangement>();
  private readonly receipts: TimelineMidiReceipt[] = [];
  private arrangementSequence = 0;
  private sectionSequence = 0;
  private trackSequence = 0;
  private noteSequence = 0;
  private receiptSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createArrangement(input: {
    projectId: TimelineId;
    name: string;
    ticksPerQuarter?: number;
    lengthTicks: number;
    tempoMap: TimelineMidiTempoPoint[];
    timeSignatures: TimelineMidiTimeSignature[];
    sections: Array<Omit<TimelineMidiSection, "id">>;
    tracks: Array<
      Omit<TimelineMidiTrack, "id" | "notes"> & {
        notes: Array<Omit<TimelineMidiNote, "id">>;
      }
    >;
    createdBy: TimelineUserId;
  }): TimelineMidiArrangement {
    const arrangementId = `timeline-midi-arrangement-${++this.arrangementSequence}`;
    const arrangement = this.build({
      ...input,
      id: arrangementId,
      revision: 1,
      parentArrangementId: null,
    });
    this.arrangements.set(arrangement.id, clone(arrangement));
    this.record(
      arrangement,
      "created",
      "MIDI arrangement created as a non-active draft.",
      input.createdBy,
    );
    return clone(arrangement);
  }

  transform(input: {
    arrangementId: TimelineId;
    transform: TimelineMidiTransform;
    createdBy: TimelineUserId;
  }): TimelineMidiArrangement {
    const source = this.required(input.arrangementId);
    if (!["draft", "held", "approved", "active"].includes(source.status)) {
      throw new Error("This MIDI arrangement cannot be revised.");
    }
    const selected = new Set(input.transform.trackIds);
    if (!selected.size) throw new Error("MIDI transform requires tracks.");
    if ([...selected].some((id) => !source.tracks.some((track) => track.id === id))) {
      throw new Error("MIDI transform references an unknown track.");
    }
    const tracks = clone(source.tracks).map((track) => {
      if (!selected.has(track.id)) return track;
      const notes = track.notes.map((note) => {
        if (input.transform.kind === "transpose") {
          integer(input.transform.semitones, -127, 127, "Transpose semitones");
          const pitch = note.pitch + input.transform.semitones;
          integer(pitch, 0, 127, "Transposed pitch");
          return { ...note, pitch };
        }
        if (input.transform.kind === "velocity-scale") {
          if (
            !Number.isFinite(input.transform.factor) ||
            input.transform.factor <= 0 ||
            input.transform.factor > 4
          ) {
            throw new Error("Velocity scale factor must be greater than 0 and at most 4.");
          }
          return {
            ...note,
            velocity: Math.max(
              1,
              Math.min(127, Math.round(note.velocity * input.transform.factor)),
            ),
          };
        }
        integer(input.transform.gridTicks, 1, source.lengthTicks, "Quantize grid");
        if (
          !Number.isFinite(input.transform.strength) ||
          input.transform.strength < 0 ||
          input.transform.strength > 1
        ) {
          throw new Error("Quantize strength must be between 0 and 1.");
        }
        const nearest =
          Math.round(note.startTick / input.transform.gridTicks) *
          input.transform.gridTicks;
        return {
          ...note,
          startTick: Math.round(
            note.startTick +
              (nearest - note.startTick) * input.transform.strength,
          ),
        };
      });
      return { ...track, notes };
    });
    const next: TimelineMidiArrangement = {
      ...source,
      id: `timeline-midi-arrangement-${++this.arrangementSequence}`,
      tracks,
      revision: source.revision + 1,
      parentArrangementId: source.id,
      status: "draft",
      approvedAt: undefined,
      approvedBy: undefined,
      activatedAt: undefined,
      activatedBy: undefined,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
      fingerprint: "",
    };
    this.validate(next);
    next.fingerprint = this.arrangementFingerprint(next);
    this.arrangements.set(next.id, clone(next));
    this.record(
      next,
      "transformed",
      `${input.transform.kind} created revision ${next.revision} without changing its parent.`,
      input.createdBy,
    );
    return clone(next);
  }

  submitForApproval(input: {
    arrangementId: TimelineId;
    submittedBy: TimelineUserId;
  }): TimelineMidiArrangement {
    const arrangement = this.required(input.arrangementId);
    if (arrangement.status !== "draft") {
      throw new Error("Only a draft MIDI arrangement can be submitted.");
    }
    this.validate(arrangement);
    return this.update(
      { ...arrangement, status: "held" },
      "submitted",
      "Valid MIDI arrangement held for human approval.",
      input.submittedBy,
    );
  }

  approve(input: {
    arrangementId: TimelineId;
    approvedBy: TimelineUserId;
  }): TimelineMidiArrangement {
    const arrangement = this.required(input.arrangementId);
    if (arrangement.status !== "held") {
      throw new Error("Only a held MIDI arrangement can be approved.");
    }
    if (arrangement.createdBy === input.approvedBy) {
      throw new Error("MIDI arrangement approval requires an independent reviewer.");
    }
    return this.update(
      {
        ...arrangement,
        status: "approved",
        approvedAt: this.now().toISOString(),
        approvedBy: input.approvedBy,
      },
      "approved",
      "Independent human approved the MIDI arrangement.",
      input.approvedBy,
    );
  }

  activate(input: {
    arrangementId: TimelineId;
    activatedBy: TimelineUserId;
  }): TimelineMidiArrangement {
    const arrangement = this.required(input.arrangementId);
    if (arrangement.status !== "approved") {
      throw new Error("Only an approved MIDI arrangement can become active.");
    }
    for (const current of this.arrangements.values()) {
      if (
        current.projectId === arrangement.projectId &&
        current.status === "active"
      ) {
        this.arrangements.set(
          current.id,
          clone({ ...current, status: "archived" as const }),
        );
      }
    }
    return this.update(
      {
        ...arrangement,
        status: "active",
        activatedAt: this.now().toISOString(),
        activatedBy: input.activatedBy,
      },
      "activated",
      "Approved MIDI arrangement activated; prior active version archived.",
      input.activatedBy,
    );
  }

  reject(input: {
    arrangementId: TimelineId;
    reason: string;
    rejectedBy: TimelineUserId;
  }): TimelineMidiArrangement {
    const arrangement = this.required(input.arrangementId);
    if (arrangement.status !== "held") {
      throw new Error("Only a held MIDI arrangement can be rejected.");
    }
    return this.update(
      { ...arrangement, status: "rejected" },
      "rejected",
      text(input.reason, "Rejection reason"),
      input.rejectedBy,
    );
  }

  getArrangement(id: TimelineId): TimelineMidiArrangement | null {
    const value = this.arrangements.get(id);
    return value ? clone(value) : null;
  }

  listArrangements(projectId?: TimelineId): TimelineMidiArrangement[] {
    return [...this.arrangements.values()]
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  activeArrangement(projectId: TimelineId): TimelineMidiArrangement | null {
    return (
      this.listArrangements(projectId).find((value) => value.status === "active") ??
      null
    );
  }

  listReceipts(projectId?: TimelineId): TimelineMidiReceipt[] {
    return this.receipts
      .filter((value) => !projectId || value.projectId === projectId)
      .map(clone);
  }

  exportArchive(): TimelineMidiArrangementArchive {
    return {
      arrangements: this.listArrangements(),
      receipts: this.receipts.map(clone),
    };
  }

  restoreArchive(archive: TimelineMidiArrangementArchive): void {
    const ids = new Set<TimelineId>();
    this.arrangements.clear();
    this.receipts.length = 0;
    for (const value of archive.arrangements) {
      if (ids.has(value.id)) throw new Error("Duplicate MIDI arrangement ID.");
      ids.add(value.id);
      this.validate(value);
      if (value.fingerprint !== this.arrangementFingerprint(value)) {
        throw new Error(`MIDI arrangement ${value.id} fingerprint is invalid.`);
      }
      this.arrangements.set(value.id, clone(value));
    }
    const activeProjects = new Set<TimelineId>();
    for (const value of archive.arrangements.filter(
      (item) => item.status === "active",
    )) {
      if (activeProjects.has(value.projectId)) {
        throw new Error("A project cannot restore multiple active arrangements.");
      }
      activeProjects.add(value.projectId);
    }
    this.receipts.push(...archive.receipts.map(clone));
    this.arrangementSequence = this.highest(
      archive.arrangements.map((value) => value.id),
    );
    this.sectionSequence = this.highest(
      archive.arrangements.flatMap((value) =>
        value.sections.map((section) => section.id),
      ),
    );
    this.trackSequence = this.highest(
      archive.arrangements.flatMap((value) =>
        value.tracks.map((track) => track.id),
      ),
    );
    this.noteSequence = this.highest(
      archive.arrangements.flatMap((value) =>
        value.tracks.flatMap((track) => track.notes.map((note) => note.id)),
      ),
    );
    this.receiptSequence = this.highest(
      archive.receipts.map((value) => value.id),
    );
  }

  private build(input: {
    id: TimelineId;
    projectId: TimelineId;
    name: string;
    ticksPerQuarter?: number;
    lengthTicks: number;
    tempoMap: TimelineMidiTempoPoint[];
    timeSignatures: TimelineMidiTimeSignature[];
    sections: Array<Omit<TimelineMidiSection, "id">>;
    tracks: Array<
      Omit<TimelineMidiTrack, "id" | "notes"> & {
        notes: Array<Omit<TimelineMidiNote, "id">>;
      }
    >;
    revision: number;
    parentArrangementId: TimelineId | null;
    createdBy: TimelineUserId;
  }): TimelineMidiArrangement {
    const arrangement: TimelineMidiArrangement = {
      id: input.id,
      projectId: text(input.projectId, "Project ID"),
      name: input.name.trim() || "MIDI arrangement",
      ticksPerQuarter: input.ticksPerQuarter ?? 480,
      lengthTicks: input.lengthTicks,
      tempoMap: clone(input.tempoMap),
      timeSignatures: clone(input.timeSignatures),
      sections: input.sections.map((section) => ({
        ...clone(section),
        id: `timeline-midi-section-${++this.sectionSequence}`,
      })),
      tracks: input.tracks.map((track) => ({
        ...clone(track),
        id: `timeline-midi-track-${++this.trackSequence}`,
        notes: track.notes.map((note) => ({
          ...clone(note),
          id: `timeline-midi-note-${++this.noteSequence}`,
        })),
      })),
      revision: input.revision,
      parentArrangementId: input.parentArrangementId,
      status: "draft",
      fingerprint: "",
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.validate(arrangement);
    arrangement.fingerprint = this.arrangementFingerprint(arrangement);
    return arrangement;
  }

  private validate(value: TimelineMidiArrangement): void {
    integer(value.ticksPerQuarter, 24, 9_600, "Ticks per quarter");
    integer(value.lengthTicks, 1, Number.MAX_SAFE_INTEGER, "Arrangement length");
    if (!value.tempoMap.length || value.tempoMap[0].tick !== 0) {
      throw new Error("Tempo map must begin at tick 0.");
    }
    this.orderedTicks(value.tempoMap.map((point) => point.tick), "Tempo map");
    value.tempoMap.forEach((point) => {
      integer(point.tick, 0, value.lengthTicks - 1, "Tempo tick");
      if (!Number.isFinite(point.bpm) || point.bpm < 20 || point.bpm > 400) {
        throw new Error("Tempo must be between 20 and 400 BPM.");
      }
    });
    if (!value.timeSignatures.length || value.timeSignatures[0].tick !== 0) {
      throw new Error("Time-signature map must begin at tick 0.");
    }
    this.orderedTicks(
      value.timeSignatures.map((point) => point.tick),
      "Time-signature map",
    );
    value.timeSignatures.forEach((point) => {
      integer(point.tick, 0, value.lengthTicks - 1, "Time-signature tick");
      integer(point.numerator, 1, 32, "Time-signature numerator");
    });
    this.orderedTicks(
      value.sections.map((section) => section.startTick),
      "Sections",
    );
    let priorEnd = 0;
    value.sections.forEach((section) => {
      text(section.name, "Section name");
      if (
        section.startTick < priorEnd ||
        section.endTick <= section.startTick ||
        section.endTick > value.lengthTicks
      ) {
        throw new Error("MIDI sections must be ordered, non-overlapping, and in range.");
      }
      priorEnd = section.endTick;
    });
    const trackIds = new Set<TimelineId>();
    value.tracks.forEach((track) => {
      if (trackIds.has(track.id)) throw new Error("MIDI track IDs must be unique.");
      trackIds.add(track.id);
      text(track.name, "MIDI track name");
      text(track.instrument, "MIDI instrument");
      integer(track.program, 0, 127, "MIDI program");
      integer(track.channel, 1, 16, "MIDI channel");
      const noteIds = new Set<TimelineId>();
      track.notes.forEach((note) => {
        if (noteIds.has(note.id)) throw new Error("MIDI note IDs must be unique.");
        noteIds.add(note.id);
        integer(note.pitch, 0, 127, "MIDI pitch");
        integer(note.velocity, 1, 127, "MIDI velocity");
        integer(note.channel, 1, 16, "MIDI note channel");
        integer(note.startTick, 0, value.lengthTicks - 1, "MIDI note start");
        integer(note.durationTicks, 1, value.lengthTicks, "MIDI note duration");
        if (note.startTick + note.durationTicks > value.lengthTicks) {
          throw new Error("MIDI note extends beyond arrangement length.");
        }
      });
    });
  }

  private orderedTicks(ticks: number[], label: string): void {
    if (ticks.some((tick, index) => index > 0 && tick <= ticks[index - 1])) {
      throw new Error(`${label} ticks must be strictly increasing.`);
    }
  }

  private arrangementFingerprint(value: TimelineMidiArrangement): string {
    return fingerprint({
      projectId: value.projectId,
      ticksPerQuarter: value.ticksPerQuarter,
      lengthTicks: value.lengthTicks,
      tempoMap: value.tempoMap,
      timeSignatures: value.timeSignatures,
      sections: value.sections,
      tracks: value.tracks,
      revision: value.revision,
      parentArrangementId: value.parentArrangementId,
    });
  }

  private required(id: TimelineId): TimelineMidiArrangement {
    const value = this.arrangements.get(id);
    if (!value) throw new Error(`Unknown MIDI arrangement: ${id}`);
    return clone(value);
  }

  private update(
    value: TimelineMidiArrangement,
    action: TimelineMidiReceipt["action"],
    message: string,
    recordedBy: string,
  ): TimelineMidiArrangement {
    this.arrangements.set(value.id, clone(value));
    this.record(value, action, message, recordedBy);
    return clone(value);
  }

  private record(
    value: TimelineMidiArrangement,
    action: TimelineMidiReceipt["action"],
    message: string,
    recordedBy: string,
  ): void {
    this.receipts.push({
      id: `timeline-midi-receipt-${++this.receiptSequence}`,
      projectId: value.projectId,
      arrangementId: value.id,
      action,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
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
