import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineInstrumentStatus =
  | "draft"
  | "held"
  | "validated"
  | "active"
  | "archived";

export type TimelineSamplerEnvelope = {
  attackMs: number;
  decayMs: number;
  sustain: number;
  releaseMs: number;
};

export type TimelineSamplerZone = {
  id: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  rootKey: number;
  keyLow: number;
  keyHigh: number;
  velocityLow: number;
  velocityHigh: number;
  startSample: number;
  endSample: number;
  loopStartSample: number | null;
  loopEndSample: number | null;
  tuneCents: number;
  gainDb: number;
  pan: number;
  roundRobinGroup: number;
  chokeGroup: number | null;
  enabled: boolean;
};

export type TimelineSamplerInstrument = {
  id: TimelineId;
  projectId: TimelineId;
  name: string;
  sampleRate: number;
  polyphony: number;
  voiceStealing: "oldest" | "quietest" | "none";
  pitchBendRange: number;
  envelope: TimelineSamplerEnvelope;
  zones: TimelineSamplerZone[];
  status: TimelineInstrumentStatus;
  head: number;
  issues: TimelineInstrumentIssue[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineInstrumentIssue = {
  code:
    | "zone-required"
    | "source-required"
    | "key-range-invalid"
    | "velocity-range-invalid"
    | "sample-range-invalid"
    | "loop-range-invalid"
    | "zone-collision";
  message: string;
  subjectId: TimelineId | null;
};

export type TimelineSamplerVoice = {
  id: TimelineId;
  instrumentId: TimelineId;
  zoneId: TimelineId;
  note: number;
  velocity: number;
  channel: number;
  playbackRate: number;
  gainDb: number;
  pan: number;
  sourceStartSample: number;
  sourceEndSample: number;
  loopStartSample: number | null;
  loopEndSample: number | null;
  state: "attack" | "sustain" | "release" | "stolen" | "choked";
  startedAtSample: number;
  releasedAtSample: number | null;
};

export type TimelineInstrumentEvent = {
  id: TimelineId;
  instrumentId: TimelineId;
  action:
    | "created"
    | "zone-added"
    | "zone-updated"
    | "validated"
    | "held"
    | "activated"
    | "note-on"
    | "note-off"
    | "voice-stolen"
    | "voice-choked"
    | "archived";
  subjectId: TimelineId;
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineInstrumentAndSamplerArchive = {
  instruments: TimelineSamplerInstrument[];
  voices: TimelineSamplerVoice[];
  events: TimelineInstrumentEvent[];
  roundRobinPositions: Array<[string, number]>;
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

function finite(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${label} must be from ${minimum} to ${maximum}.`);
  }
  return value;
}

export class TimelineInstrumentAndSamplerEngine {
  private readonly instruments = new Map<TimelineId, TimelineSamplerInstrument>();
  private readonly voices = new Map<TimelineId, TimelineSamplerVoice>();
  private readonly events: TimelineInstrumentEvent[] = [];
  private readonly roundRobinPositions = new Map<string, number>();
  private instrumentSequence = 0;
  private zoneSequence = 0;
  private voiceSequence = 0;
  private eventSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createInstrument(input: {
    projectId: TimelineId;
    name: string;
    sampleRate: number;
    polyphony?: number;
    voiceStealing?: TimelineSamplerInstrument["voiceStealing"];
    pitchBendRange?: number;
    envelope?: Partial<TimelineSamplerEnvelope>;
    createdBy: TimelineUserId;
  }) {
    const timestamp = this.now().toISOString();
    const instrument: TimelineSamplerInstrument = {
      id: `timeline-sampler-instrument-${++this.instrumentSequence}`,
      projectId: text(input.projectId, "Project identity"),
      name: text(input.name, "Instrument name"),
      sampleRate: whole(input.sampleRate, 8_000, 384_000, "Sample rate"),
      polyphony: whole(input.polyphony ?? 32, 1, 2_048, "Polyphony"),
      voiceStealing: input.voiceStealing ?? "oldest",
      pitchBendRange: finite(input.pitchBendRange ?? 2, 0, 96, "Pitch-bend range"),
      envelope: this.envelope(input.envelope),
      zones: [],
      status: "draft",
      head: 0,
      issues: [],
      createdAt: timestamp,
      createdBy: text(input.createdBy, "Creator identity"),
      updatedAt: timestamp,
      updatedBy: input.createdBy,
    };
    this.instruments.set(instrument.id, clone(instrument));
    this.record(instrument, "created", instrument.id, "Sampler instrument created.", input.createdBy);
    return clone(instrument);
  }

  addZone(input: {
    instrumentId: TimelineId;
    expectedHead: number;
    sourceArtifactId: TimelineId;
    sourceFingerprint: string;
    rootKey: number;
    keyLow: number;
    keyHigh: number;
    velocityLow?: number;
    velocityHigh?: number;
    startSample: number;
    endSample: number;
    loopStartSample?: number | null;
    loopEndSample?: number | null;
    tuneCents?: number;
    gainDb?: number;
    pan?: number;
    roundRobinGroup?: number;
    chokeGroup?: number | null;
    addedBy: TimelineUserId;
  }) {
    const instrument = this.editable(input.instrumentId, input.expectedHead);
    const zone: TimelineSamplerZone = {
      id: `timeline-sampler-zone-${++this.zoneSequence}`,
      sourceArtifactId: text(input.sourceArtifactId, "Source artifact identity"),
      sourceFingerprint: text(input.sourceFingerprint, "Source fingerprint"),
      rootKey: whole(input.rootKey, 0, 127, "Root key"),
      keyLow: whole(input.keyLow, 0, 127, "Low key"),
      keyHigh: whole(input.keyHigh, 0, 127, "High key"),
      velocityLow: whole(input.velocityLow ?? 1, 1, 127, "Low velocity"),
      velocityHigh: whole(input.velocityHigh ?? 127, 1, 127, "High velocity"),
      startSample: whole(input.startSample, 0, Number.MAX_SAFE_INTEGER, "Sample start"),
      endSample: whole(input.endSample, 1, Number.MAX_SAFE_INTEGER, "Sample end"),
      loopStartSample: input.loopStartSample ?? null,
      loopEndSample: input.loopEndSample ?? null,
      tuneCents: finite(input.tuneCents ?? 0, -12_000, 12_000, "Zone tuning"),
      gainDb: finite(input.gainDb ?? 0, -120, 24, "Zone gain"),
      pan: finite(input.pan ?? 0, -1, 1, "Zone pan"),
      roundRobinGroup: whole(input.roundRobinGroup ?? 0, 0, 10_000, "Round-robin group"),
      chokeGroup:
        input.chokeGroup === undefined || input.chokeGroup === null
          ? null
          : whole(input.chokeGroup, 1, 10_000, "Choke group"),
      enabled: true,
    };
    this.assertZone(zone);
    instrument.zones.push(zone);
    const next = this.save(instrument, input.addedBy);
    this.record(next, "zone-added", zone.id, "Validated sample zone added non-destructively.", input.addedBy);
    return next;
  }

  updateZone(input: {
    instrumentId: TimelineId;
    expectedHead: number;
    zoneId: TimelineId;
    enabled?: boolean;
    tuneCents?: number;
    gainDb?: number;
    pan?: number;
    chokeGroup?: number | null;
    updatedBy: TimelineUserId;
  }) {
    const instrument = this.editable(input.instrumentId, input.expectedHead);
    const zone = this.zone(instrument, input.zoneId);
    if (input.enabled !== undefined) zone.enabled = input.enabled;
    if (input.tuneCents !== undefined) zone.tuneCents = finite(input.tuneCents, -12_000, 12_000, "Zone tuning");
    if (input.gainDb !== undefined) zone.gainDb = finite(input.gainDb, -120, 24, "Zone gain");
    if (input.pan !== undefined) zone.pan = finite(input.pan, -1, 1, "Zone pan");
    if (input.chokeGroup !== undefined) {
      zone.chokeGroup = input.chokeGroup === null ? null : whole(input.chokeGroup, 1, 10_000, "Choke group");
    }
    const next = this.save(instrument, input.updatedBy);
    this.record(next, "zone-updated", zone.id, "Sampler zone settings updated.", input.updatedBy);
    return next;
  }

  validate(input: {
    instrumentId: TimelineId;
    expectedHead: number;
    validatedBy: TimelineUserId;
  }) {
    const instrument = this.editable(input.instrumentId, input.expectedHead);
    instrument.issues = this.inspect(instrument);
    instrument.status = instrument.issues.length ? "held" : "validated";
    const next = this.save(instrument, input.validatedBy);
    this.record(
      next,
      next.status === "held" ? "held" : "validated",
      next.id,
      next.status === "held" ? `Instrument held with ${next.issues.length} issue(s).` : "Instrument zones validated.",
      input.validatedBy,
    );
    return next;
  }

  activate(input: {
    instrumentId: TimelineId;
    expectedHead: number;
    activatedBy: TimelineUserId;
  }) {
    const instrument = this.required(input.instrumentId);
    this.assertHead(instrument, input.expectedHead);
    if (instrument.status !== "validated") throw new Error("Only a validated sampler instrument can be activated.");
    instrument.status = "active";
    const next = this.save(instrument, input.activatedBy);
    this.record(next, "activated", next.id, "Validated sampler instrument activated.", input.activatedBy);
    return next;
  }

  noteOn(input: {
    instrumentId: TimelineId;
    note: number;
    velocity: number;
    channel: number;
    pitchBend?: number;
    atSample: number;
    triggeredBy: TimelineUserId;
  }) {
    const instrument = this.required(input.instrumentId);
    if (instrument.status !== "active") throw new Error("Sampler instrument is not active.");
    const note = whole(input.note, 0, 127, "MIDI note");
    const velocity = whole(input.velocity, 1, 127, "MIDI velocity");
    const channel = whole(input.channel, 1, 16, "MIDI channel");
    const atSample = whole(input.atSample, 0, Number.MAX_SAFE_INTEGER, "Voice start sample");
    const pitchBend = finite(input.pitchBend ?? 0, -1, 1, "Pitch bend");
    const matching = instrument.zones.filter(
      (zone) =>
        zone.enabled &&
        note >= zone.keyLow &&
        note <= zone.keyHigh &&
        velocity >= zone.velocityLow &&
        velocity <= zone.velocityHigh,
    );
    if (!matching.length) throw new Error("No sampler zone matches this note and velocity.");
    const grouped = new Map<number, TimelineSamplerZone[]>();
    for (const zone of matching) {
      const values = grouped.get(zone.roundRobinGroup) ?? [];
      values.push(zone);
      grouped.set(zone.roundRobinGroup, values);
    }
    const selected: TimelineSamplerZone[] = [];
    for (const [group, zones] of grouped) {
      if (group === 0) selected.push(...zones);
      else {
        const key = `${instrument.id}:${group}`;
        const index = this.roundRobinPositions.get(key) ?? 0;
        selected.push(zones[index % zones.length]);
        this.roundRobinPositions.set(key, index + 1);
      }
    }
    const created: TimelineSamplerVoice[] = [];
    for (const zone of selected) {
      if (zone.chokeGroup !== null) this.choke(instrument, zone.chokeGroup, atSample, input.triggeredBy);
      this.ensurePolyphony(instrument, atSample, input.triggeredBy);
      const semitones = note - zone.rootKey + zone.tuneCents / 100 + pitchBend * instrument.pitchBendRange;
      const voice: TimelineSamplerVoice = {
        id: `timeline-sampler-voice-${++this.voiceSequence}`,
        instrumentId: instrument.id,
        zoneId: zone.id,
        note,
        velocity,
        channel,
        playbackRate: Math.pow(2, semitones / 12),
        gainDb: zone.gainDb + 20 * Math.log10(velocity / 127),
        pan: zone.pan,
        sourceStartSample: zone.startSample,
        sourceEndSample: zone.endSample,
        loopStartSample: zone.loopStartSample,
        loopEndSample: zone.loopEndSample,
        state: "attack",
        startedAtSample: atSample,
        releasedAtSample: null,
      };
      this.voices.set(voice.id, clone(voice));
      created.push(voice);
      this.record(instrument, "note-on", voice.id, `Voice started from ${zone.id}.`, input.triggeredBy);
    }
    return created.map(clone);
  }

  noteOff(input: {
    instrumentId: TimelineId;
    note: number;
    channel: number;
    atSample: number;
    releasedBy: TimelineUserId;
  }) {
    const instrument = this.required(input.instrumentId);
    const atSample = whole(input.atSample, 0, Number.MAX_SAFE_INTEGER, "Voice release sample");
    const released: TimelineSamplerVoice[] = [];
    for (const voice of this.voices.values()) {
      if (
        voice.instrumentId === instrument.id &&
        voice.note === input.note &&
        voice.channel === input.channel &&
        ["attack", "sustain"].includes(voice.state)
      ) {
        const next = { ...voice, state: "release" as const, releasedAtSample: atSample };
        this.voices.set(next.id, clone(next));
        released.push(next);
        this.record(instrument, "note-off", next.id, "Voice entered its release envelope.", input.releasedBy);
      }
    }
    return released.map(clone);
  }

  activeVoices(instrumentId: TimelineId) {
    return [...this.voices.values()]
      .filter((voice) => voice.instrumentId === instrumentId && ["attack", "sustain", "release"].includes(voice.state))
      .sort((a, b) => a.startedAtSample - b.startedAtSample)
      .map(clone);
  }

  archive(input: {
    instrumentId: TimelineId;
    expectedHead: number;
    archivedBy: TimelineUserId;
  }) {
    const instrument = this.required(input.instrumentId);
    this.assertHead(instrument, input.expectedHead);
    if (instrument.status === "archived") throw new Error("Sampler instrument is already archived.");
    instrument.status = "archived";
    const next = this.save(instrument, input.archivedBy);
    this.record(next, "archived", next.id, "Sampler instrument archived with zones preserved.", input.archivedBy);
    return next;
  }

  getInstrument(id: TimelineId) {
    const value = this.instruments.get(id);
    return value ? clone(value) : null;
  }

  listEvents(instrumentId?: TimelineId) {
    return this.events.filter((event) => !instrumentId || event.instrumentId === instrumentId).map(clone);
  }

  exportArchive(): TimelineInstrumentAndSamplerArchive {
    return {
      instruments: [...this.instruments.values()].map(clone),
      voices: [...this.voices.values()].map(clone),
      events: this.listEvents(),
      roundRobinPositions: [...this.roundRobinPositions.entries()],
    };
  }

  restoreArchive(archive: TimelineInstrumentAndSamplerArchive) {
    const ids = new Set<TimelineId>();
    const use = (id: TimelineId) => {
      if (ids.has(id)) throw new Error("Sampler archive contains duplicate identities.");
      ids.add(id);
    };
    archive.instruments.forEach((instrument) => {
      use(instrument.id);
      instrument.zones.forEach((zone) => use(zone.id));
    });
    archive.voices.forEach((voice) => {
      use(voice.id);
      const instrument = archive.instruments.find((candidate) => candidate.id === voice.instrumentId);
      if (!instrument?.zones.some((zone) => zone.id === voice.zoneId)) {
        throw new Error("Sampler voice refers to a missing instrument zone.");
      }
    });
    archive.events.forEach((event) => {
      use(event.id);
      if (!archive.instruments.some((instrument) => instrument.id === event.instrumentId)) {
        throw new Error("Sampler event refers to a missing instrument.");
      }
    });
    this.instruments.clear();
    this.voices.clear();
    this.events.splice(0);
    this.roundRobinPositions.clear();
    this.instrumentSequence = this.zoneSequence = this.voiceSequence = this.eventSequence = 0;
    archive.instruments.forEach((instrument) => {
      this.instruments.set(instrument.id, clone(instrument));
      this.instrumentSequence = Math.max(this.instrumentSequence, this.sequence(instrument.id));
      instrument.zones.forEach((zone) => { this.zoneSequence = Math.max(this.zoneSequence, this.sequence(zone.id)); });
    });
    archive.voices.forEach((voice) => {
      this.voices.set(voice.id, clone(voice));
      this.voiceSequence = Math.max(this.voiceSequence, this.sequence(voice.id));
    });
    archive.events.forEach((event) => {
      this.events.push(clone(event));
      this.eventSequence = Math.max(this.eventSequence, this.sequence(event.id));
    });
    archive.roundRobinPositions.forEach(([key, value]) => this.roundRobinPositions.set(key, value));
  }

  private inspect(instrument: TimelineSamplerInstrument) {
    const issues: TimelineInstrumentIssue[] = [];
    const enabled = instrument.zones.filter((zone) => zone.enabled);
    if (!enabled.length) issues.push({ code: "zone-required", message: "At least one enabled sampler zone is required.", subjectId: null });
    for (const zone of enabled) {
      if (!zone.sourceArtifactId.trim() || !zone.sourceFingerprint.trim()) issues.push({ code: "source-required", message: "Sampler zone source identity is incomplete.", subjectId: zone.id });
      if (zone.keyHigh < zone.keyLow || zone.rootKey < zone.keyLow || zone.rootKey > zone.keyHigh) issues.push({ code: "key-range-invalid", message: "Sampler key range is invalid.", subjectId: zone.id });
      if (zone.velocityHigh < zone.velocityLow) issues.push({ code: "velocity-range-invalid", message: "Sampler velocity range is invalid.", subjectId: zone.id });
      if (zone.endSample <= zone.startSample) issues.push({ code: "sample-range-invalid", message: "Sampler source range is invalid.", subjectId: zone.id });
      if ((zone.loopStartSample === null) !== (zone.loopEndSample === null) || (zone.loopStartSample !== null && (zone.loopStartSample < zone.startSample || zone.loopEndSample! > zone.endSample || zone.loopEndSample! <= zone.loopStartSample))) {
        issues.push({ code: "loop-range-invalid", message: "Sampler loop range is invalid.", subjectId: zone.id });
      }
    }
    return issues;
  }

  private assertZone(zone: TimelineSamplerZone) {
    if (zone.keyHigh < zone.keyLow || zone.rootKey < zone.keyLow || zone.rootKey > zone.keyHigh) throw new Error("Root key must be inside an ordered key range.");
    if (zone.velocityHigh < zone.velocityLow) throw new Error("Velocity range is invalid.");
    if (zone.endSample <= zone.startSample) throw new Error("Sample end must be after sample start.");
    if ((zone.loopStartSample === null) !== (zone.loopEndSample === null)) throw new Error("Sampler loops require both start and end.");
    if (zone.loopStartSample !== null && (zone.loopStartSample < zone.startSample || zone.loopEndSample! > zone.endSample || zone.loopEndSample! <= zone.loopStartSample)) throw new Error("Sampler loop must be inside its source range.");
  }

  private envelope(input: Partial<TimelineSamplerEnvelope> = {}): TimelineSamplerEnvelope {
    return {
      attackMs: finite(input.attackMs ?? 5, 0, 600_000, "Envelope attack"),
      decayMs: finite(input.decayMs ?? 100, 0, 600_000, "Envelope decay"),
      sustain: finite(input.sustain ?? 1, 0, 1, "Envelope sustain"),
      releaseMs: finite(input.releaseMs ?? 250, 0, 600_000, "Envelope release"),
    };
  }

  private choke(instrument: TimelineSamplerInstrument, chokeGroup: number, atSample: number, recordedBy: TimelineUserId) {
    const zoneIds = new Set(instrument.zones.filter((zone) => zone.chokeGroup === chokeGroup).map((zone) => zone.id));
    for (const voice of this.voices.values()) {
      if (voice.instrumentId === instrument.id && zoneIds.has(voice.zoneId) && ["attack", "sustain", "release"].includes(voice.state)) {
        const next = { ...voice, state: "choked" as const, releasedAtSample: atSample };
        this.voices.set(next.id, clone(next));
        this.record(instrument, "voice-choked", next.id, `Choke group ${chokeGroup} stopped the voice.`, recordedBy);
      }
    }
  }

  private ensurePolyphony(instrument: TimelineSamplerInstrument, atSample: number, recordedBy: TimelineUserId) {
    const active = this.activeVoices(instrument.id);
    if (active.length < instrument.polyphony) return;
    if (instrument.voiceStealing === "none") throw new Error("Sampler polyphony limit reached.");
    const victim = instrument.voiceStealing === "quietest"
      ? [...active].sort((a, b) => a.gainDb - b.gainDb || a.startedAtSample - b.startedAtSample)[0]
      : active[0];
    const stolen = { ...victim, state: "stolen" as const, releasedAtSample: atSample };
    this.voices.set(stolen.id, clone(stolen));
    this.record(instrument, "voice-stolen", stolen.id, "Voice stolen to honor the polyphony limit.", recordedBy);
  }

  private zone(instrument: TimelineSamplerInstrument, id: TimelineId) {
    const zone = instrument.zones.find((candidate) => candidate.id === id);
    if (!zone) throw new Error("Sampler zone was not found.");
    return zone;
  }

  private editable(id: TimelineId, expectedHead: number) {
    const instrument = this.required(id);
    this.assertHead(instrument, expectedHead);
    if (!["draft", "held"].includes(instrument.status)) throw new Error(`${instrument.status} sampler instruments cannot be edited.`);
    return instrument;
  }

  private required(id: TimelineId) {
    const value = this.instruments.get(id);
    if (!value) throw new Error(`Sampler instrument ${id} was not found.`);
    return clone(value);
  }

  private assertHead(instrument: TimelineSamplerInstrument, expectedHead: number) {
    if (instrument.head !== expectedHead) throw new Error(`Instrument head conflict: expected ${expectedHead}, current ${instrument.head}.`);
  }

  private save(instrument: TimelineSamplerInstrument, updatedBy: TimelineUserId) {
    const next = { ...clone(instrument), head: instrument.head + 1, updatedAt: this.now().toISOString(), updatedBy: text(updatedBy, "Editor identity") };
    this.instruments.set(next.id, clone(next));
    return clone(next);
  }

  private record(instrument: TimelineSamplerInstrument, action: TimelineInstrumentEvent["action"], subjectId: TimelineId, message: string, recordedBy: TimelineUserId) {
    this.events.push({ id: `timeline-instrument-event-${++this.eventSequence}`, instrumentId: instrument.id, action, subjectId, message, recordedAt: this.now().toISOString(), recordedBy });
  }

  private sequence(id: TimelineId) {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineInstrumentAndSamplerEngine =
  new TimelineInstrumentAndSamplerEngine();
