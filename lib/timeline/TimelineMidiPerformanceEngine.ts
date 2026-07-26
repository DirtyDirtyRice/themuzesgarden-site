import type { TimelineId, TimelineTrackId, TimelineUserId } from "./TimelineTypes";

export type TimelineMidiPerformanceStatus =
  | "draft"
  | "recording"
  | "stopped"
  | "held"
  | "validated"
  | "active"
  | "archived";

export type TimelineMidiNoteEvent = {
  id: TimelineId;
  pitch: number;
  velocity: number;
  releaseVelocity: number;
  channel: number;
  startTick: number;
  durationTicks: number;
};

export type TimelineMidiControllerEvent = {
  id: TimelineId;
  controller: number;
  value: number;
  channel: number;
  tick: number;
};

export type TimelineMidiPerformanceTake = {
  id: TimelineId;
  pass: number;
  trackId: TimelineTrackId;
  inputDeviceId: TimelineId;
  startTick: number;
  endTick: number;
  notes: TimelineMidiNoteEvent[];
  controllers: TimelineMidiControllerEvent[];
  rawTakeId: TimelineId | null;
  transform: { kind: "quantize"; gridTicks: number; strength: number } | null;
  selected: boolean;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineMidiPerformanceIssue = {
  code:
    | "take-required"
    | "selected-take-required"
    | "note-range-invalid"
    | "note-overlap"
    | "controller-range-invalid"
    | "stuck-note";
  message: string;
  subjectId: TimelineId | null;
};

export type TimelineMidiPerformance = {
  id: TimelineId;
  projectId: TimelineId;
  songId: TimelineId;
  multiTrackSessionId: TimelineId;
  transportId: TimelineId;
  name: string;
  ticksPerQuarter: number;
  status: TimelineMidiPerformanceStatus;
  head: number;
  armedTrackId: TimelineTrackId | null;
  inputDeviceId: TimelineId | null;
  channelFilter: number | "omni";
  overdub: boolean;
  currentPass: number;
  takes: TimelineMidiPerformanceTake[];
  issues: TimelineMidiPerformanceIssue[];
  recordingStartedAt: string | null;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineMidiPerformanceEvent = {
  id: TimelineId;
  performanceId: TimelineId;
  action:
    | "created"
    | "armed"
    | "recording-started"
    | "take-committed"
    | "take-derived"
    | "take-selected"
    | "validated"
    | "held"
    | "activated"
    | "archived";
  subjectId: TimelineId;
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineMidiPerformanceArchive = {
  performances: TimelineMidiPerformance[];
  events: TimelineMidiPerformanceEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);

function text(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function whole(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`);
  }
  return value;
}

function ratio(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be between 0 and 1.`);
  }
  return value;
}

export class TimelineMidiPerformanceEngine {
  private readonly performances = new Map<TimelineId, TimelineMidiPerformance>();
  private readonly events: TimelineMidiPerformanceEvent[] = [];
  private performanceSequence = 0;
  private takeSequence = 0;
  private noteSequence = 0;
  private controllerSequence = 0;
  private eventSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createPerformance(input: {
    projectId: TimelineId;
    songId: TimelineId;
    multiTrackSessionId: TimelineId;
    transportId: TimelineId;
    name: string;
    ticksPerQuarter?: number;
    createdBy: TimelineUserId;
  }): TimelineMidiPerformance {
    const timestamp = this.now().toISOString();
    const performance: TimelineMidiPerformance = {
      id: `timeline-midi-performance-${++this.performanceSequence}`,
      projectId: text(input.projectId, "Project identity"),
      songId: text(input.songId, "Song identity"),
      multiTrackSessionId: text(input.multiTrackSessionId, "Multi-track session identity"),
      transportId: text(input.transportId, "Transport identity"),
      name: text(input.name, "MIDI performance name"),
      ticksPerQuarter: whole(input.ticksPerQuarter ?? 480, 24, 9_600, "Ticks per quarter"),
      status: "draft",
      head: 0,
      armedTrackId: null,
      inputDeviceId: null,
      channelFilter: "omni",
      overdub: false,
      currentPass: 0,
      takes: [],
      issues: [],
      recordingStartedAt: null,
      createdAt: timestamp,
      createdBy: text(input.createdBy, "Creator identity"),
      updatedAt: timestamp,
      updatedBy: input.createdBy,
    };
    this.performances.set(performance.id, clone(performance));
    this.record(performance, "created", performance.id, "MIDI performance session created.", input.createdBy);
    return clone(performance);
  }

  arm(input: {
    performanceId: TimelineId;
    expectedHead: number;
    trackId: TimelineTrackId;
    inputDeviceId: TimelineId;
    channelFilter?: number | "omni";
    overdub?: boolean;
    armedBy: TimelineUserId;
  }) {
    const performance = this.editable(input.performanceId, input.expectedHead);
    performance.armedTrackId = text(input.trackId, "Track identity");
    performance.inputDeviceId = text(input.inputDeviceId, "MIDI input identity");
    performance.channelFilter =
      input.channelFilter === undefined || input.channelFilter === "omni"
        ? "omni"
        : whole(input.channelFilter, 1, 16, "MIDI channel");
    performance.overdub = input.overdub ?? false;
    const next = this.save(performance, input.armedBy);
    this.record(next, "armed", input.trackId, "Track armed for MIDI performance capture.", input.armedBy);
    return next;
  }

  startRecording(input: {
    performanceId: TimelineId;
    expectedHead: number;
    transportPlaying: boolean;
    startedBy: TimelineUserId;
  }) {
    const performance = this.editable(input.performanceId, input.expectedHead);
    if (!performance.armedTrackId || !performance.inputDeviceId) {
      throw new Error("A track and MIDI input must be armed.");
    }
    if (!input.transportPlaying) throw new Error("Transport must be playing before MIDI recording starts.");
    performance.status = "recording";
    performance.currentPass += 1;
    performance.recordingStartedAt = this.now().toISOString();
    const next = this.save(performance, input.startedBy);
    this.record(next, "recording-started", next.id, `MIDI pass ${next.currentPass} started.`, input.startedBy);
    return next;
  }

  commitTake(input: {
    performanceId: TimelineId;
    expectedHead: number;
    startTick: number;
    endTick: number;
    notes: Array<Omit<TimelineMidiNoteEvent, "id">>;
    controllers?: Array<Omit<TimelineMidiControllerEvent, "id">>;
    recordedBy: TimelineUserId;
  }) {
    const performance = this.required(input.performanceId);
    this.assertHead(performance, input.expectedHead);
    if (performance.status !== "recording") throw new Error("MIDI recording is not running.");
    const startTick = whole(input.startTick, 0, Number.MAX_SAFE_INTEGER, "Take start");
    const endTick = whole(input.endTick, 1, Number.MAX_SAFE_INTEGER, "Take end");
    if (endTick <= startTick) throw new Error("MIDI take end must be after its start.");
    const notes = input.notes.map((note) => this.buildNote(note, startTick, endTick, performance.channelFilter));
    const controllers = (input.controllers ?? []).map((event) =>
      this.buildController(event, startTick, endTick, performance.channelFilter),
    );
    const take: TimelineMidiPerformanceTake = {
      id: `timeline-midi-performance-take-${++this.takeSequence}`,
      pass: performance.currentPass,
      trackId: performance.armedTrackId!,
      inputDeviceId: performance.inputDeviceId!,
      startTick,
      endTick,
      notes,
      controllers,
      rawTakeId: null,
      transform: null,
      selected: performance.takes.length === 0,
      recordedAt: this.now().toISOString(),
      recordedBy: input.recordedBy,
    };
    performance.takes.push(take);
    performance.status = "stopped";
    performance.recordingStartedAt = null;
    const next = this.save(performance, input.recordedBy);
    this.record(next, "take-committed", take.id, "Immutable raw MIDI take committed.", input.recordedBy);
    return next;
  }

  deriveQuantizedTake(input: {
    performanceId: TimelineId;
    expectedHead: number;
    takeId: TimelineId;
    gridTicks: number;
    strength: number;
    createdBy: TimelineUserId;
  }) {
    const performance = this.editable(input.performanceId, input.expectedHead);
    const source = this.take(performance, input.takeId);
    const raw = source.rawTakeId
      ? this.take(performance, source.rawTakeId)
      : source;
    const gridTicks = whole(input.gridTicks, 1, Number.MAX_SAFE_INTEGER, "Quantize grid");
    const strength = ratio(input.strength, "Quantize strength");
    const notes = raw.notes.map((note) => {
      const nearest = Math.round(note.startTick / gridTicks) * gridTicks;
      const startTick = Math.max(raw.startTick, Math.min(raw.endTick - 1, Math.round(note.startTick + (nearest - note.startTick) * strength)));
      return { ...clone(note), id: `timeline-midi-note-${++this.noteSequence}`, startTick };
    });
    const derived: TimelineMidiPerformanceTake = {
      ...clone(raw),
      id: `timeline-midi-performance-take-${++this.takeSequence}`,
      notes,
      controllers: raw.controllers.map((event) => ({ ...clone(event), id: `timeline-midi-controller-${++this.controllerSequence}` })),
      rawTakeId: raw.id,
      transform: { kind: "quantize", gridTicks, strength },
      selected: false,
      recordedAt: this.now().toISOString(),
      recordedBy: input.createdBy,
    };
    performance.takes.push(derived);
    const next = this.save(performance, input.createdBy);
    this.record(next, "take-derived", derived.id, `Reversible quantized take derived from ${raw.id}.`, input.createdBy);
    return next;
  }

  selectTake(input: {
    performanceId: TimelineId;
    expectedHead: number;
    takeId: TimelineId;
    selectedBy: TimelineUserId;
  }) {
    const performance = this.editable(input.performanceId, input.expectedHead);
    this.take(performance, input.takeId);
    performance.takes.forEach((take) => { take.selected = take.id === input.takeId; });
    const next = this.save(performance, input.selectedBy);
    this.record(next, "take-selected", input.takeId, "MIDI take selected for arrangement handoff.", input.selectedBy);
    return next;
  }

  validate(input: {
    performanceId: TimelineId;
    expectedHead: number;
    validatedBy: TimelineUserId;
  }) {
    const performance = this.editable(input.performanceId, input.expectedHead);
    performance.issues = this.inspect(performance);
    performance.status = performance.issues.length ? "held" : "validated";
    const next = this.save(performance, input.validatedBy);
    this.record(
      next,
      next.status === "held" ? "held" : "validated",
      next.id,
      next.status === "held" ? `MIDI performance held with ${next.issues.length} issue(s).` : "MIDI performance validated.",
      input.validatedBy,
    );
    return next;
  }

  activate(input: {
    performanceId: TimelineId;
    expectedHead: number;
    activatedBy: TimelineUserId;
  }) {
    const performance = this.required(input.performanceId);
    this.assertHead(performance, input.expectedHead);
    if (performance.status !== "validated") throw new Error("Only a validated MIDI performance can be activated.");
    performance.status = "active";
    const next = this.save(performance, input.activatedBy);
    this.record(next, "activated", next.id, "Selected MIDI take activated for arrangement use.", input.activatedBy);
    return next;
  }

  archive(input: {
    performanceId: TimelineId;
    expectedHead: number;
    archivedBy: TimelineUserId;
  }) {
    const performance = this.required(input.performanceId);
    this.assertHead(performance, input.expectedHead);
    if (performance.status === "recording") throw new Error("Stop MIDI recording before archiving.");
    if (performance.status === "archived") throw new Error("MIDI performance is already archived.");
    performance.status = "archived";
    const next = this.save(performance, input.archivedBy);
    this.record(next, "archived", next.id, "MIDI performance archived with raw takes preserved.", input.archivedBy);
    return next;
  }

  getPerformance(id: TimelineId) {
    const value = this.performances.get(id);
    return value ? clone(value) : null;
  }

  selectedTake(performanceId: TimelineId) {
    return this.required(performanceId).takes.find((take) => take.selected) ?? null;
  }

  listEvents(performanceId?: TimelineId) {
    return this.events.filter((event) => !performanceId || event.performanceId === performanceId).map(clone);
  }

  exportArchive(): TimelineMidiPerformanceArchive {
    return { performances: [...this.performances.values()].map(clone), events: this.listEvents() };
  }

  restoreArchive(archive: TimelineMidiPerformanceArchive) {
    const performanceIds = new Set<TimelineId>();
    const takeIds = new Set<TimelineId>();
    const eventIds = new Set<TimelineId>();
    for (const performance of archive.performances) {
      if (performanceIds.has(performance.id)) throw new Error("Duplicate MIDI performance identity.");
      performanceIds.add(performance.id);
      for (const take of performance.takes) {
        if (takeIds.has(take.id)) throw new Error("Duplicate MIDI performance take identity.");
        takeIds.add(take.id);
      }
    }
    for (const event of archive.events) {
      if (eventIds.has(event.id)) throw new Error("Duplicate MIDI performance event identity.");
      if (!performanceIds.has(event.performanceId)) throw new Error("MIDI performance event refers to a missing performance.");
      eventIds.add(event.id);
    }
    this.performances.clear();
    this.events.splice(0);
    this.performanceSequence = this.takeSequence = this.noteSequence = this.controllerSequence = this.eventSequence = 0;
    for (const performance of archive.performances) {
      this.performances.set(performance.id, clone(performance));
      this.performanceSequence = Math.max(this.performanceSequence, this.sequence(performance.id));
      for (const take of performance.takes) {
        this.takeSequence = Math.max(this.takeSequence, this.sequence(take.id));
        take.notes.forEach((note) => { this.noteSequence = Math.max(this.noteSequence, this.sequence(note.id)); });
        take.controllers.forEach((event) => { this.controllerSequence = Math.max(this.controllerSequence, this.sequence(event.id)); });
      }
    }
    archive.events.forEach((event) => {
      this.events.push(clone(event));
      this.eventSequence = Math.max(this.eventSequence, this.sequence(event.id));
    });
  }

  private buildNote(
    note: Omit<TimelineMidiNoteEvent, "id">,
    startTick: number,
    endTick: number,
    channelFilter: number | "omni",
  ): TimelineMidiNoteEvent {
    const built = {
      id: `timeline-midi-note-${++this.noteSequence}`,
      pitch: whole(note.pitch, 0, 127, "MIDI pitch"),
      velocity: whole(note.velocity, 1, 127, "MIDI velocity"),
      releaseVelocity: whole(note.releaseVelocity, 0, 127, "MIDI release velocity"),
      channel: whole(note.channel, 1, 16, "MIDI channel"),
      startTick: whole(note.startTick, startTick, endTick - 1, "Note start"),
      durationTicks: whole(note.durationTicks, 1, endTick - startTick, "Note duration"),
    };
    if (built.startTick + built.durationTicks > endTick) throw new Error("MIDI note extends beyond the take.");
    if (channelFilter !== "omni" && built.channel !== channelFilter) throw new Error("MIDI note does not match the armed channel.");
    return built;
  }

  private buildController(
    event: Omit<TimelineMidiControllerEvent, "id">,
    startTick: number,
    endTick: number,
    channelFilter: number | "omni",
  ): TimelineMidiControllerEvent {
    const built = {
      id: `timeline-midi-controller-${++this.controllerSequence}`,
      controller: whole(event.controller, 0, 127, "MIDI controller"),
      value: whole(event.value, 0, 127, "MIDI controller value"),
      channel: whole(event.channel, 1, 16, "MIDI channel"),
      tick: whole(event.tick, startTick, endTick, "Controller tick"),
    };
    if (channelFilter !== "omni" && built.channel !== channelFilter) throw new Error("MIDI controller does not match the armed channel.");
    return built;
  }

  private inspect(performance: TimelineMidiPerformance): TimelineMidiPerformanceIssue[] {
    const issues: TimelineMidiPerformanceIssue[] = [];
    if (!performance.takes.length) issues.push({ code: "take-required", message: "At least one MIDI take is required.", subjectId: null });
    const selected = performance.takes.filter((take) => take.selected);
    if (selected.length !== 1) issues.push({ code: "selected-take-required", message: "Exactly one MIDI take must be selected.", subjectId: null });
    for (const take of performance.takes) {
      for (const note of take.notes) {
        if (note.startTick < take.startTick || note.startTick + note.durationTicks > take.endTick) {
          issues.push({ code: "note-range-invalid", message: "MIDI note is outside its take.", subjectId: note.id });
        }
        if (note.durationTicks <= 0) issues.push({ code: "stuck-note", message: "MIDI note has no valid note-off duration.", subjectId: note.id });
      }
      const ordered = [...take.controllers].sort((a, b) => a.tick - b.tick);
      for (const event of ordered) {
        if (event.tick < take.startTick || event.tick > take.endTick) {
          issues.push({ code: "controller-range-invalid", message: "Controller event is outside its take.", subjectId: event.id });
        }
      }
    }
    return issues;
  }

  private take(performance: TimelineMidiPerformance, id: TimelineId) {
    const take = performance.takes.find((candidate) => candidate.id === id);
    if (!take) throw new Error("MIDI performance take was not found.");
    return take;
  }

  private editable(id: TimelineId, expectedHead: number) {
    const performance = this.required(id);
    this.assertHead(performance, expectedHead);
    if (!["draft", "stopped", "held"].includes(performance.status)) {
      throw new Error(`${performance.status} MIDI performances cannot be edited.`);
    }
    return performance;
  }

  private required(id: TimelineId) {
    const value = this.performances.get(id);
    if (!value) throw new Error(`MIDI performance ${id} was not found.`);
    return clone(value);
  }

  private assertHead(performance: TimelineMidiPerformance, expectedHead: number) {
    if (performance.head !== expectedHead) {
      throw new Error(`MIDI performance head conflict: expected ${expectedHead}, current ${performance.head}.`);
    }
  }

  private save(performance: TimelineMidiPerformance, updatedBy: TimelineUserId) {
    const next = {
      ...clone(performance),
      head: performance.head + 1,
      updatedAt: this.now().toISOString(),
      updatedBy: text(updatedBy, "Editor identity"),
    };
    this.performances.set(next.id, clone(next));
    return clone(next);
  }

  private record(
    performance: TimelineMidiPerformance,
    action: TimelineMidiPerformanceEvent["action"],
    subjectId: TimelineId,
    message: string,
    recordedBy: TimelineUserId,
  ) {
    this.events.push({
      id: `timeline-midi-performance-event-${++this.eventSequence}`,
      performanceId: performance.id,
      action,
      subjectId,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private sequence(id: TimelineId) {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineMidiPerformanceEngine = new TimelineMidiPerformanceEngine();
