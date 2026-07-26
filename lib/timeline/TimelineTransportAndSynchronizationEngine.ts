import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineTransportStatus =
  | "draft"
  | "held"
  | "validated"
  | "active"
  | "archived";

export type TimelineTransportPlaybackState =
  | "stopped"
  | "counting-in"
  | "playing"
  | "paused";

export type TimelineTempoPoint = {
  id: TimelineId;
  tick: number;
  bpm: number;
};

export type TimelineTimeSignaturePoint = {
  id: TimelineId;
  tick: number;
  numerator: number;
  denominator: 1 | 2 | 4 | 8 | 16 | 32;
};

export type TimelineTransportLoop = {
  enabled: boolean;
  startTick: number;
  endTick: number;
};

export type TimelineSynchronizationSource = {
  id: TimelineId;
  kind: "internal" | "midi-clock" | "link" | "ltc" | "mtc";
  available: boolean;
  offsetSamples: number;
  toleranceSamples: number;
  lastObservedSample: number | null;
  driftSamples: number;
};

export type TimelineTransportIssue = {
  code:
    | "session-required"
    | "graph-required"
    | "tempo-origin-required"
    | "signature-origin-required"
    | "loop-invalid"
    | "sync-unavailable"
    | "sync-drift";
  message: string;
  subjectId: TimelineId | null;
};

export type TimelineTransportSynchronization = {
  id: TimelineId;
  projectId: TimelineId;
  sessionId: TimelineId;
  audioGraphId: TimelineId;
  name: string;
  sampleRate: number;
  ppq: number;
  status: TimelineTransportStatus;
  playbackState: TimelineTransportPlaybackState;
  head: number;
  tick: number;
  sample: number;
  countInBars: number;
  countInRemainingTicks: number;
  tempoMap: TimelineTempoPoint[];
  timeSignatureMap: TimelineTimeSignaturePoint[];
  loop: TimelineTransportLoop;
  synchronization: TimelineSynchronizationSource;
  issues: TimelineTransportIssue[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineTransportEvent = {
  id: TimelineId;
  transportId: TimelineId;
  action:
    | "created"
    | "tempo-added"
    | "signature-added"
    | "loop-updated"
    | "validated"
    | "held"
    | "activated"
    | "played"
    | "paused"
    | "stopped"
    | "located"
    | "advanced"
    | "synchronized"
    | "archived";
  tick: number;
  sample: number;
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineTransportArchive = {
  transports: TimelineTransportSynchronization[];
  events: TimelineTransportEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);

function text(value: string, label: string): string {
  const result = value.trim();
  if (!result) throw new Error(`${label} is required.`);
  return result;
}

function integer(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`);
  }
  return value;
}

function bpm(value: number): number {
  if (!Number.isFinite(value) || value < 10 || value > 999) {
    throw new Error("Tempo must be between 10 and 999 BPM.");
  }
  return value;
}

export class TimelineTransportAndSynchronizationEngine {
  private readonly transports = new Map<
    TimelineId,
    TimelineTransportSynchronization
  >();
  private readonly events: TimelineTransportEvent[] = [];
  private transportSequence = 0;
  private tempoSequence = 0;
  private signatureSequence = 0;
  private eventSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createTransport(input: {
    projectId: TimelineId;
    sessionId: TimelineId;
    audioGraphId: TimelineId;
    name: string;
    sampleRate: number;
    ppq?: number;
    bpm: number;
    numerator?: number;
    denominator?: 1 | 2 | 4 | 8 | 16 | 32;
    countInBars?: number;
    synchronizationKind?: TimelineSynchronizationSource["kind"];
    createdBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const now = this.now().toISOString();
    const transport: TimelineTransportSynchronization = {
      id: `timeline-transport-sync-${++this.transportSequence}`,
      projectId: text(input.projectId, "Project identity"),
      sessionId: text(input.sessionId, "Session identity"),
      audioGraphId: text(input.audioGraphId, "Audio graph identity"),
      name: text(input.name, "Transport name"),
      sampleRate: integer(input.sampleRate, 8_000, 384_000, "Sample rate"),
      ppq: integer(input.ppq ?? 960, 24, 15_360, "PPQ"),
      status: "draft",
      playbackState: "stopped",
      head: 0,
      tick: 0,
      sample: 0,
      countInBars: integer(input.countInBars ?? 0, 0, 16, "Count-in bars"),
      countInRemainingTicks: 0,
      tempoMap: [
        {
          id: `timeline-tempo-point-${++this.tempoSequence}`,
          tick: 0,
          bpm: bpm(input.bpm),
        },
      ],
      timeSignatureMap: [
        {
          id: `timeline-signature-point-${++this.signatureSequence}`,
          tick: 0,
          numerator: integer(input.numerator ?? 4, 1, 32, "Numerator"),
          denominator: input.denominator ?? 4,
        },
      ],
      loop: { enabled: false, startTick: 0, endTick: 0 },
      synchronization: {
        id: "transport-clock",
        kind: input.synchronizationKind ?? "internal",
        available: true,
        offsetSamples: 0,
        toleranceSamples: 256,
        lastObservedSample: null,
        driftSamples: 0,
      },
      issues: [],
      createdAt: now,
      createdBy: text(input.createdBy, "Creator identity"),
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.transports.set(transport.id, clone(transport));
    this.record(transport, "created", "Transport created as a draft.", input.createdBy);
    return clone(transport);
  }

  addTempoPoint(input: {
    transportId: TimelineId;
    expectedHead: number;
    tick: number;
    bpm: number;
    editedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.editable(input.transportId, input.expectedHead);
    const tick = integer(input.tick, 0, Number.MAX_SAFE_INTEGER, "Tempo tick");
    if (transport.tempoMap.some((point) => point.tick === tick)) {
      throw new Error("A tempo point already exists at this tick.");
    }
    transport.tempoMap.push({
      id: `timeline-tempo-point-${++this.tempoSequence}`,
      tick,
      bpm: bpm(input.bpm),
    });
    transport.tempoMap.sort((a, b) => a.tick - b.tick);
    const next = this.save(transport, input.editedBy);
    this.record(next, "tempo-added", "Tempo point added.", input.editedBy);
    return next;
  }

  addTimeSignaturePoint(input: {
    transportId: TimelineId;
    expectedHead: number;
    tick: number;
    numerator: number;
    denominator: 1 | 2 | 4 | 8 | 16 | 32;
    editedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.editable(input.transportId, input.expectedHead);
    const tick = integer(input.tick, 0, Number.MAX_SAFE_INTEGER, "Signature tick");
    if (transport.timeSignatureMap.some((point) => point.tick === tick)) {
      throw new Error("A time-signature point already exists at this tick.");
    }
    transport.timeSignatureMap.push({
      id: `timeline-signature-point-${++this.signatureSequence}`,
      tick,
      numerator: integer(input.numerator, 1, 32, "Numerator"),
      denominator: input.denominator,
    });
    transport.timeSignatureMap.sort((a, b) => a.tick - b.tick);
    const next = this.save(transport, input.editedBy);
    this.record(next, "signature-added", "Time-signature point added.", input.editedBy);
    return next;
  }

  setLoop(input: {
    transportId: TimelineId;
    expectedHead: number;
    enabled: boolean;
    startTick: number;
    endTick: number;
    editedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.editable(input.transportId, input.expectedHead);
    const startTick = integer(input.startTick, 0, Number.MAX_SAFE_INTEGER, "Loop start");
    const endTick = integer(input.endTick, 0, Number.MAX_SAFE_INTEGER, "Loop end");
    if (input.enabled && endTick <= startTick) {
      throw new Error("Loop end must be after loop start.");
    }
    transport.loop = { enabled: input.enabled, startTick, endTick };
    const next = this.save(transport, input.editedBy);
    this.record(next, "loop-updated", "Transport loop updated.", input.editedBy);
    return next;
  }

  configureSynchronization(input: {
    transportId: TimelineId;
    expectedHead: number;
    kind: TimelineSynchronizationSource["kind"];
    available: boolean;
    offsetSamples?: number;
    toleranceSamples?: number;
    editedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.editable(input.transportId, input.expectedHead);
    transport.synchronization = {
      ...transport.synchronization,
      kind: input.kind,
      available: input.available,
      offsetSamples: integer(
        input.offsetSamples ?? 0,
        -transport.sampleRate * 60,
        transport.sampleRate * 60,
        "Synchronization offset",
      ),
      toleranceSamples: integer(
        input.toleranceSamples ?? 256,
        0,
        transport.sampleRate,
        "Synchronization tolerance",
      ),
    };
    return this.save(transport, input.editedBy);
  }

  validate(input: {
    transportId: TimelineId;
    expectedHead: number;
    validatedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.editable(input.transportId, input.expectedHead);
    const issues = this.inspect(transport);
    transport.issues = issues;
    transport.status = issues.length ? "held" : "validated";
    const next = this.save(transport, input.validatedBy);
    this.record(
      next,
      issues.length ? "held" : "validated",
      issues.length ? `Transport held with ${issues.length} issue(s).` : "Transport validated.",
      input.validatedBy,
    );
    return next;
  }

  activate(input: {
    transportId: TimelineId;
    expectedHead: number;
    activatedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.getRequired(input.transportId);
    this.head(transport, input.expectedHead);
    if (transport.status !== "validated") {
      throw new Error("Only a validated transport can be activated.");
    }
    transport.status = "active";
    const next = this.save(transport, input.activatedBy);
    this.record(next, "activated", "Transport activated.", input.activatedBy);
    return next;
  }

  play(input: {
    transportId: TimelineId;
    expectedHead: number;
    playedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.active(input.transportId, input.expectedHead);
    const signature = this.signatureAt(transport, transport.tick);
    transport.countInRemainingTicks =
      transport.countInBars *
      signature.numerator *
      (transport.ppq * 4 / signature.denominator);
    transport.playbackState =
      transport.countInRemainingTicks > 0 ? "counting-in" : "playing";
    const next = this.save(transport, input.playedBy);
    this.record(next, "played", "Playback started.", input.playedBy);
    return next;
  }

  pause(input: {
    transportId: TimelineId;
    expectedHead: number;
    pausedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.active(input.transportId, input.expectedHead);
    transport.playbackState = "paused";
    transport.countInRemainingTicks = 0;
    const next = this.save(transport, input.pausedBy);
    this.record(next, "paused", "Playback paused.", input.pausedBy);
    return next;
  }

  stop(input: {
    transportId: TimelineId;
    expectedHead: number;
    returnToTick?: number;
    stoppedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.active(input.transportId, input.expectedHead);
    transport.playbackState = "stopped";
    transport.countInRemainingTicks = 0;
    transport.tick = integer(
      input.returnToTick ?? 0,
      0,
      Number.MAX_SAFE_INTEGER,
      "Return tick",
    );
    transport.sample = this.tickToSampleValue(transport, transport.tick);
    const next = this.save(transport, input.stoppedBy);
    this.record(next, "stopped", "Playback stopped.", input.stoppedBy);
    return next;
  }

  locate(input: {
    transportId: TimelineId;
    expectedHead: number;
    tick: number;
    locatedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.active(input.transportId, input.expectedHead);
    transport.tick = integer(input.tick, 0, Number.MAX_SAFE_INTEGER, "Locate tick");
    transport.sample = this.tickToSampleValue(transport, transport.tick);
    const next = this.save(transport, input.locatedBy);
    this.record(next, "located", "Transport located to a musical tick.", input.locatedBy);
    return next;
  }

  advance(input: {
    transportId: TimelineId;
    expectedHead: number;
    samples: number;
    advancedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.active(input.transportId, input.expectedHead);
    if (!["playing", "counting-in"].includes(transport.playbackState)) {
      throw new Error("Transport must be playing before it can advance.");
    }
    let samples = integer(input.samples, 0, Number.MAX_SAFE_INTEGER, "Sample advance");
    if (transport.playbackState === "counting-in") {
      const countInSamples =
        this.tickToSampleValue(transport, transport.countInRemainingTicks) -
        this.tickToSampleValue(transport, 0);
      if (samples < countInSamples) {
        transport.countInRemainingTicks -= this.samplesToTicks(
          transport,
          samples,
          0,
        );
        samples = 0;
      } else {
        samples -= countInSamples;
        transport.countInRemainingTicks = 0;
        transport.playbackState = "playing";
      }
    }
    if (samples > 0) {
      const targetSample = transport.sample + samples;
      let targetTick = this.sampleToTickValue(transport, targetSample);
      if (transport.loop.enabled && targetTick >= transport.loop.endTick) {
        const loopLength = transport.loop.endTick - transport.loop.startTick;
        targetTick =
          transport.loop.startTick +
          ((targetTick - transport.loop.startTick) % loopLength);
      }
      transport.tick = targetTick;
      transport.sample = this.tickToSampleValue(transport, targetTick);
    }
    const next = this.save(transport, input.advancedBy);
    this.record(next, "advanced", "Transport advanced sample-accurately.", input.advancedBy);
    return next;
  }

  observeExternalClock(input: {
    transportId: TimelineId;
    expectedHead: number;
    observedSample: number;
    synchronizedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.active(input.transportId, input.expectedHead);
    if (transport.synchronization.kind === "internal") {
      throw new Error("Internal clock does not accept external observations.");
    }
    if (!transport.synchronization.available) {
      throw new Error("External synchronization source is unavailable.");
    }
    const observed = integer(
      input.observedSample,
      0,
      Number.MAX_SAFE_INTEGER,
      "Observed sample",
    );
    const expected = transport.sample + transport.synchronization.offsetSamples;
    const drift = observed - expected;
    transport.synchronization.lastObservedSample = observed;
    transport.synchronization.driftSamples = drift;
    if (Math.abs(drift) > transport.synchronization.toleranceSamples) {
      transport.sample = Math.max(0, observed - transport.synchronization.offsetSamples);
      transport.tick = this.sampleToTickValue(transport, transport.sample);
    }
    const next = this.save(transport, input.synchronizedBy);
    this.record(next, "synchronized", `External clock drift measured at ${drift} samples.`, input.synchronizedBy);
    return next;
  }

  tickToSample(transportId: TimelineId, tick: number): number {
    return this.tickToSampleValue(
      this.getRequired(transportId),
      integer(tick, 0, Number.MAX_SAFE_INTEGER, "Tick"),
    );
  }

  sampleToTick(transportId: TimelineId, sample: number): number {
    return this.sampleToTickValue(
      this.getRequired(transportId),
      integer(sample, 0, Number.MAX_SAFE_INTEGER, "Sample"),
    );
  }

  archive(input: {
    transportId: TimelineId;
    expectedHead: number;
    archivedBy: TimelineUserId;
  }): TimelineTransportSynchronization {
    const transport = this.getRequired(input.transportId);
    this.head(transport, input.expectedHead);
    transport.status = "archived";
    transport.playbackState = "stopped";
    const next = this.save(transport, input.archivedBy);
    this.record(next, "archived", "Transport archived.", input.archivedBy);
    return next;
  }

  getTransport(id: TimelineId): TimelineTransportSynchronization | null {
    const value = this.transports.get(id);
    return value ? clone(value) : null;
  }

  listEvents(transportId?: TimelineId): TimelineTransportEvent[] {
    return this.events
      .filter((event) => !transportId || event.transportId === transportId)
      .map(clone);
  }

  exportArchive(): TimelineTransportArchive {
    return {
      transports: Array.from(this.transports.values()).map(clone),
      events: this.listEvents(),
    };
  }

  restoreArchive(archive: TimelineTransportArchive): void {
    if (new Set(archive.transports.map((item) => item.id)).size !== archive.transports.length) {
      throw new Error("Transport archive contains duplicate identities.");
    }
    if (new Set(archive.events.map((item) => item.id)).size !== archive.events.length) {
      throw new Error("Transport archive contains duplicate event identities.");
    }
    const transportIds = new Set(archive.transports.map((item) => item.id));
    if (archive.events.some((event) => !transportIds.has(event.transportId))) {
      throw new Error("Transport event refers to a missing transport.");
    }
    this.transports.clear();
    this.events.splice(0);
    this.transportSequence = 0;
    this.tempoSequence = 0;
    this.signatureSequence = 0;
    this.eventSequence = 0;
    archive.transports.forEach((transport) => {
      this.transports.set(transport.id, clone(transport));
      this.transportSequence = Math.max(this.transportSequence, this.sequence(transport.id));
      transport.tempoMap.forEach((point) => {
        this.tempoSequence = Math.max(this.tempoSequence, this.sequence(point.id));
      });
      transport.timeSignatureMap.forEach((point) => {
        this.signatureSequence = Math.max(this.signatureSequence, this.sequence(point.id));
      });
    });
    archive.events.forEach((event) => {
      this.events.push(clone(event));
      this.eventSequence = Math.max(this.eventSequence, this.sequence(event.id));
    });
  }

  private tickToSampleValue(
    transport: TimelineTransportSynchronization,
    targetTick: number,
  ): number {
    let samples = 0;
    const points = transport.tempoMap;
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const end = Math.min(targetTick, points[index + 1]?.tick ?? targetTick);
      if (end > point.tick) {
        samples +=
          (end - point.tick) *
          (transport.sampleRate * 60 / (point.bpm * transport.ppq));
      }
      if (targetTick <= end) break;
    }
    return Math.round(samples);
  }

  private sampleToTickValue(
    transport: TimelineTransportSynchronization,
    targetSample: number,
  ): number {
    let remaining = targetSample;
    const points = transport.tempoMap;
    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const samplesPerTick = transport.sampleRate * 60 / (point.bpm * transport.ppq);
      const nextTick = points[index + 1]?.tick;
      if (nextTick === undefined) {
        return point.tick + Math.round(remaining / samplesPerTick);
      }
      const segmentSamples = (nextTick - point.tick) * samplesPerTick;
      if (remaining <= segmentSamples) {
        return point.tick + Math.round(remaining / samplesPerTick);
      }
      remaining -= segmentSamples;
    }
    return 0;
  }

  private samplesToTicks(
    transport: TimelineTransportSynchronization,
    samples: number,
    fromTick: number,
  ): number {
    return Math.max(
      0,
      this.sampleToTickValue(
        transport,
        this.tickToSampleValue(transport, fromTick) + samples,
      ) - fromTick,
    );
  }

  private signatureAt(
    transport: TimelineTransportSynchronization,
    tick: number,
  ): TimelineTimeSignaturePoint {
    return [...transport.timeSignatureMap]
      .reverse()
      .find((point) => point.tick <= tick)!;
  }

  private inspect(transport: TimelineTransportSynchronization): TimelineTransportIssue[] {
    const issues: TimelineTransportIssue[] = [];
    if (!transport.sessionId) issues.push({ code: "session-required", message: "Session is required.", subjectId: null });
    if (!transport.audioGraphId) issues.push({ code: "graph-required", message: "Audio graph is required.", subjectId: null });
    if (transport.tempoMap[0]?.tick !== 0) issues.push({ code: "tempo-origin-required", message: "Tempo map must begin at tick zero.", subjectId: null });
    if (transport.timeSignatureMap[0]?.tick !== 0) issues.push({ code: "signature-origin-required", message: "Signature map must begin at tick zero.", subjectId: null });
    if (transport.loop.enabled && transport.loop.endTick <= transport.loop.startTick) issues.push({ code: "loop-invalid", message: "Loop range is invalid.", subjectId: null });
    if (transport.synchronization.kind !== "internal" && !transport.synchronization.available) {
      issues.push({ code: "sync-unavailable", message: "External synchronization source is unavailable.", subjectId: transport.synchronization.id });
    }
    return issues;
  }

  private editable(id: TimelineId, expectedHead: number) {
    const transport = this.getRequired(id);
    this.head(transport, expectedHead);
    if (["active", "archived"].includes(transport.status)) {
      throw new Error(`${transport.status} transports cannot be edited.`);
    }
    return transport;
  }

  private active(id: TimelineId, expectedHead: number) {
    const transport = this.getRequired(id);
    this.head(transport, expectedHead);
    if (transport.status !== "active") throw new Error("Transport is not active.");
    return transport;
  }

  private getRequired(id: TimelineId) {
    const transport = this.transports.get(id);
    if (!transport) throw new Error(`Transport ${id} was not found.`);
    return clone(transport);
  }

  private head(transport: TimelineTransportSynchronization, expectedHead: number) {
    if (transport.head !== expectedHead) {
      throw new Error(`Transport head conflict: expected ${expectedHead}, current ${transport.head}.`);
    }
  }

  private save(transport: TimelineTransportSynchronization, updatedBy: TimelineUserId) {
    const next = {
      ...clone(transport),
      head: transport.head + 1,
      updatedAt: this.now().toISOString(),
      updatedBy: text(updatedBy, "Editor identity"),
    };
    this.transports.set(next.id, clone(next));
    return clone(next);
  }

  private record(
    transport: TimelineTransportSynchronization,
    action: TimelineTransportEvent["action"],
    message: string,
    recordedBy: TimelineUserId,
  ) {
    this.events.push({
      id: `timeline-transport-event-${++this.eventSequence}`,
      transportId: transport.id,
      action,
      tick: transport.tick,
      sample: transport.sample,
      message,
      recordedAt: this.now().toISOString(),
      recordedBy,
    });
  }

  private sequence(id: TimelineId) {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineTransportAndSynchronizationEngine =
  new TimelineTransportAndSynchronizationEngine();
