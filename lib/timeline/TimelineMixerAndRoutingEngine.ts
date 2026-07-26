import type { TimelineId, TimelineTrackId, TimelineUserId } from "./TimelineTypes";

export type TimelineMixerStatus = "draft" | "held" | "validated" | "active" | "archived";
export type TimelineMixerChannelKind = "track" | "instrument" | "group" | "aux" | "master";

export type TimelineMixerChannel = {
  id: TimelineId;
  externalId: TimelineId;
  name: string;
  kind: TimelineMixerChannelKind;
  inputChannels: number;
  outputChannels: number;
  gainDb: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  phaseInverted: boolean;
  latencySamples: number;
  available: boolean;
  order: number;
};

export type TimelineMixerRoute = {
  id: TimelineId;
  sourceChannelId: TimelineId;
  destinationChannelId: TimelineId;
  kind: "output" | "send";
  preFader: boolean;
  gainDb: number;
  enabled: boolean;
  channelCount: number;
};

export type TimelineMixerIssue = {
  code:
    | "master-required"
    | "route-required"
    | "route-cycle"
    | "route-channel-mismatch"
    | "channel-unavailable"
    | "route-duplicate";
  message: string;
  subjectId: TimelineId;
};

export type TimelineMixerConsole = {
  id: TimelineId;
  projectId: TimelineId;
  songId: TimelineId;
  multiTrackSessionId: TimelineId;
  audioGraphId: TimelineId;
  name: string;
  sampleRate: number;
  status: TimelineMixerStatus;
  head: number;
  channels: TimelineMixerChannel[];
  routes: TimelineMixerRoute[];
  issues: TimelineMixerIssue[];
  processingOrder: TimelineId[];
  totalLatencySamples: number;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineMixerMeterSnapshot = {
  id: TimelineId;
  mixerId: TimelineId;
  channelId: TimelineId;
  peakDbfs: number[];
  rmsDbfs: number[];
  clipped: boolean;
  measuredAtSample: number;
  recordedAt: string;
};

export type TimelineMixerEvent = {
  id: TimelineId;
  mixerId: TimelineId;
  action: "created" | "channel-added" | "channel-updated" | "route-added" | "route-updated" | "metered" | "validated" | "held" | "activated" | "archived";
  subjectId: TimelineId;
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelineMixerAndRoutingArchive = {
  mixers: TimelineMixerConsole[];
  meters: TimelineMixerMeterSnapshot[];
  events: TimelineMixerEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);
function text(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}
function whole(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) throw new Error(`${label} must be a whole number from ${minimum} to ${maximum}.`);
  return value;
}
function finite(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new Error(`${label} must be from ${minimum} to ${maximum}.`);
  return value;
}

export class TimelineMixerAndRoutingEngine {
  private readonly mixers = new Map<TimelineId, TimelineMixerConsole>();
  private readonly meters: TimelineMixerMeterSnapshot[] = [];
  private readonly events: TimelineMixerEvent[] = [];
  private mixerSequence = 0;
  private channelSequence = 0;
  private routeSequence = 0;
  private meterSequence = 0;
  private eventSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createMixer(input: {
    projectId: TimelineId;
    songId: TimelineId;
    multiTrackSessionId: TimelineId;
    audioGraphId: TimelineId;
    name: string;
    sampleRate: number;
    createdBy: TimelineUserId;
  }) {
    const timestamp = this.now().toISOString();
    const mixer: TimelineMixerConsole = {
      id: `timeline-mixer-${++this.mixerSequence}`,
      projectId: text(input.projectId, "Project identity"),
      songId: text(input.songId, "Song identity"),
      multiTrackSessionId: text(input.multiTrackSessionId, "Multi-track session identity"),
      audioGraphId: text(input.audioGraphId, "Audio graph identity"),
      name: text(input.name, "Mixer name"),
      sampleRate: whole(input.sampleRate, 8_000, 384_000, "Sample rate"),
      status: "draft", head: 0, channels: [], routes: [], issues: [],
      processingOrder: [], totalLatencySamples: 0,
      createdAt: timestamp, createdBy: text(input.createdBy, "Creator identity"),
      updatedAt: timestamp, updatedBy: input.createdBy,
    };
    this.mixers.set(mixer.id, clone(mixer));
    this.record(mixer, "created", mixer.id, "Mixer console created.", input.createdBy);
    return clone(mixer);
  }

  addChannel(input: {
    mixerId: TimelineId;
    expectedHead: number;
    externalId: TimelineId;
    name: string;
    kind: TimelineMixerChannelKind;
    inputChannels?: number;
    outputChannels?: number;
    latencySamples?: number;
    addedBy: TimelineUserId;
  }) {
    const mixer = this.editable(input.mixerId, input.expectedHead);
    if (input.kind === "master" && mixer.channels.some((channel) => channel.kind === "master")) throw new Error("Mixer already has a master channel.");
    if (mixer.channels.some((channel) => channel.externalId === input.externalId)) throw new Error("External channel identity is already in this mixer.");
    const channel: TimelineMixerChannel = {
      id: `timeline-mixer-channel-${++this.channelSequence}`,
      externalId: text(input.externalId, "External channel identity"),
      name: text(input.name, "Channel name"),
      kind: input.kind,
      inputChannels: whole(input.inputChannels ?? 2, 1, 128, "Input channels"),
      outputChannels: whole(input.outputChannels ?? 2, 1, 128, "Output channels"),
      gainDb: 0, pan: 0, muted: false, soloed: false, phaseInverted: false,
      latencySamples: whole(input.latencySamples ?? 0, 0, 10_000_000, "Channel latency"),
      available: true,
      order: mixer.channels.length,
    };
    mixer.channels.push(channel);
    const next = this.save(mixer, input.addedBy);
    this.record(next, "channel-added", channel.id, `${channel.kind} channel added.`, input.addedBy);
    return next;
  }

  updateChannel(input: {
    mixerId: TimelineId;
    expectedHead: number;
    channelId: TimelineId;
    gainDb?: number;
    pan?: number;
    muted?: boolean;
    soloed?: boolean;
    phaseInverted?: boolean;
    available?: boolean;
    latencySamples?: number;
    updatedBy: TimelineUserId;
  }) {
    const mixer = this.editable(input.mixerId, input.expectedHead);
    const channel = this.channel(mixer, input.channelId);
    if (input.gainDb !== undefined) channel.gainDb = finite(input.gainDb, -120, 24, "Channel gain");
    if (input.pan !== undefined) channel.pan = finite(input.pan, -1, 1, "Channel pan");
    if (input.muted !== undefined) channel.muted = input.muted;
    if (input.soloed !== undefined) channel.soloed = input.soloed;
    if (input.phaseInverted !== undefined) channel.phaseInverted = input.phaseInverted;
    if (input.available !== undefined) channel.available = input.available;
    if (input.latencySamples !== undefined) channel.latencySamples = whole(input.latencySamples, 0, 10_000_000, "Channel latency");
    const next = this.save(mixer, input.updatedBy);
    this.record(next, "channel-updated", channel.id, "Mixer channel controls updated.", input.updatedBy);
    return next;
  }

  addRoute(input: {
    mixerId: TimelineId;
    expectedHead: number;
    sourceChannelId: TimelineId;
    destinationChannelId: TimelineId;
    kind?: "output" | "send";
    preFader?: boolean;
    gainDb?: number;
    channelCount?: number;
    addedBy: TimelineUserId;
  }) {
    const mixer = this.editable(input.mixerId, input.expectedHead);
    const source = this.channel(mixer, input.sourceChannelId);
    const destination = this.channel(mixer, input.destinationChannelId);
    if (source.id === destination.id) throw new Error("A mixer channel cannot route to itself.");
    const kind = input.kind ?? "output";
    if (destination.kind === "master" && kind === "send") throw new Error("The master channel accepts output routes, not sends.");
    const route: TimelineMixerRoute = {
      id: `timeline-mixer-route-${++this.routeSequence}`,
      sourceChannelId: source.id,
      destinationChannelId: destination.id,
      kind,
      preFader: input.preFader ?? false,
      gainDb: finite(input.gainDb ?? 0, -120, 24, "Route gain"),
      enabled: true,
      channelCount: whole(input.channelCount ?? Math.min(source.outputChannels, destination.inputChannels), 1, 128, "Route channel count"),
    };
    if (route.channelCount > source.outputChannels || route.channelCount > destination.inputChannels) throw new Error("Route channel count exceeds source or destination capacity.");
    if (mixer.routes.some((value) => value.sourceChannelId === source.id && value.destinationChannelId === destination.id && value.kind === kind)) throw new Error("Duplicate mixer route.");
    this.assertAcyclic(mixer.channels, [...mixer.routes, route]);
    mixer.routes.push(route);
    const next = this.save(mixer, input.addedBy);
    this.record(next, "route-added", route.id, `${kind} route added.`, input.addedBy);
    return next;
  }

  updateRoute(input: {
    mixerId: TimelineId;
    expectedHead: number;
    routeId: TimelineId;
    enabled?: boolean;
    preFader?: boolean;
    gainDb?: number;
    updatedBy: TimelineUserId;
  }) {
    const mixer = this.editable(input.mixerId, input.expectedHead);
    const route = mixer.routes.find((candidate) => candidate.id === input.routeId);
    if (!route) throw new Error("Mixer route was not found.");
    if (input.enabled !== undefined) route.enabled = input.enabled;
    if (input.preFader !== undefined) route.preFader = input.preFader;
    if (input.gainDb !== undefined) route.gainDb = finite(input.gainDb, -120, 24, "Route gain");
    this.assertAcyclic(mixer.channels, mixer.routes);
    const next = this.save(mixer, input.updatedBy);
    this.record(next, "route-updated", route.id, "Mixer route controls updated.", input.updatedBy);
    return next;
  }

  effectiveChannelState(mixerId: TimelineId, channelId: TimelineId) {
    const mixer = this.required(mixerId);
    const channel = this.channel(mixer, channelId);
    const anySolo = mixer.channels.some((value) => value.soloed && value.available);
    return {
      audible: channel.available && !channel.muted && (!anySolo || channel.soloed || channel.kind === "master"),
      gainDb: channel.gainDb,
      pan: channel.pan,
      phaseInverted: channel.phaseInverted,
    };
  }

  recordMeter(input: {
    mixerId: TimelineId;
    channelId: TimelineId;
    peakDbfs: number[];
    rmsDbfs: number[];
    measuredAtSample: number;
    recordedBy: TimelineUserId;
  }) {
    const mixer = this.required(input.mixerId);
    const channel = this.channel(mixer, input.channelId);
    if (input.peakDbfs.length !== channel.outputChannels || input.rmsDbfs.length !== channel.outputChannels) throw new Error("Meter channel count does not match the mixer channel.");
    const peakDbfs = input.peakDbfs.map((value) => finite(value, -200, 24, "Peak level"));
    const rmsDbfs = input.rmsDbfs.map((value) => finite(value, -200, 24, "RMS level"));
    const snapshot: TimelineMixerMeterSnapshot = {
      id: `timeline-mixer-meter-${++this.meterSequence}`,
      mixerId: mixer.id,
      channelId: channel.id,
      peakDbfs,
      rmsDbfs,
      clipped: peakDbfs.some((value) => value >= 0),
      measuredAtSample: whole(input.measuredAtSample, 0, Number.MAX_SAFE_INTEGER, "Meter sample"),
      recordedAt: this.now().toISOString(),
    };
    this.meters.push(snapshot);
    this.record(mixer, "metered", snapshot.id, snapshot.clipped ? "Meter snapshot recorded clipping." : "Meter snapshot recorded.", input.recordedBy);
    return clone(snapshot);
  }

  validate(input: { mixerId: TimelineId; expectedHead: number; validatedBy: TimelineUserId }) {
    const mixer = this.editable(input.mixerId, input.expectedHead);
    mixer.issues = this.inspect(mixer);
    const order = this.topologicalOrder(mixer.channels, mixer.routes.filter((route) => route.enabled));
    mixer.processingOrder = order ?? [];
    mixer.totalLatencySamples = order ? this.maximumPathLatency(mixer, order) : 0;
    mixer.status = mixer.issues.length ? "held" : "validated";
    const next = this.save(mixer, input.validatedBy);
    this.record(next, next.status === "held" ? "held" : "validated", next.id, next.status === "held" ? `Mixer held with ${next.issues.length} issue(s).` : "Mixer and routing validated.", input.validatedBy);
    return next;
  }

  activate(input: { mixerId: TimelineId; expectedHead: number; activatedBy: TimelineUserId }) {
    const mixer = this.required(input.mixerId);
    this.assertHead(mixer, input.expectedHead);
    if (mixer.status !== "validated" || mixer.issues.length) throw new Error("Only a validated mixer can be activated.");
    mixer.status = "active";
    const next = this.save(mixer, input.activatedBy);
    this.record(next, "activated", next.id, "Validated mixer activated.", input.activatedBy);
    return next;
  }

  archive(input: { mixerId: TimelineId; expectedHead: number; archivedBy: TimelineUserId }) {
    const mixer = this.required(input.mixerId);
    this.assertHead(mixer, input.expectedHead);
    if (mixer.status === "archived") throw new Error("Mixer is already archived.");
    mixer.status = "archived";
    const next = this.save(mixer, input.archivedBy);
    this.record(next, "archived", next.id, "Mixer archived with routing history preserved.", input.archivedBy);
    return next;
  }

  getMixer(id: TimelineId) {
    const value = this.mixers.get(id);
    return value ? clone(value) : null;
  }
  listMeters(mixerId: TimelineId, channelId?: TimelineId) {
    return this.meters.filter((value) => value.mixerId === mixerId && (!channelId || value.channelId === channelId)).map(clone);
  }
  listEvents(mixerId?: TimelineId) {
    return this.events.filter((event) => !mixerId || event.mixerId === mixerId).map(clone);
  }
  exportArchive(): TimelineMixerAndRoutingArchive {
    return { mixers: [...this.mixers.values()].map(clone), meters: this.meters.map(clone), events: this.events.map(clone) };
  }

  restoreArchive(archive: TimelineMixerAndRoutingArchive) {
    const ids = new Set<TimelineId>();
    const use = (id: TimelineId) => {
      if (ids.has(id)) throw new Error("Mixer archive contains duplicate identities.");
      ids.add(id);
    };
    archive.mixers.forEach((mixer) => {
      use(mixer.id);
      mixer.channels.forEach((channel) => use(channel.id));
      mixer.routes.forEach((route) => use(route.id));
    });
    archive.meters.forEach((meter) => {
      use(meter.id);
      const mixer = archive.mixers.find((value) => value.id === meter.mixerId);
      if (!mixer?.channels.some((channel) => channel.id === meter.channelId)) throw new Error("Meter refers to a missing mixer channel.");
    });
    archive.events.forEach((event) => {
      use(event.id);
      if (!archive.mixers.some((mixer) => mixer.id === event.mixerId)) throw new Error("Mixer event refers to a missing mixer.");
    });
    this.mixers.clear(); this.meters.splice(0); this.events.splice(0);
    this.mixerSequence = this.channelSequence = this.routeSequence = this.meterSequence = this.eventSequence = 0;
    archive.mixers.forEach((mixer) => {
      this.mixers.set(mixer.id, clone(mixer));
      this.mixerSequence = Math.max(this.mixerSequence, this.sequence(mixer.id));
      mixer.channels.forEach((channel) => { this.channelSequence = Math.max(this.channelSequence, this.sequence(channel.id)); });
      mixer.routes.forEach((route) => { this.routeSequence = Math.max(this.routeSequence, this.sequence(route.id)); });
    });
    archive.meters.forEach((meter) => { this.meters.push(clone(meter)); this.meterSequence = Math.max(this.meterSequence, this.sequence(meter.id)); });
    archive.events.forEach((event) => { this.events.push(clone(event)); this.eventSequence = Math.max(this.eventSequence, this.sequence(event.id)); });
  }

  private inspect(mixer: TimelineMixerConsole) {
    const issues: TimelineMixerIssue[] = [];
    const masters = mixer.channels.filter((channel) => channel.kind === "master");
    if (masters.length !== 1) issues.push({ code: "master-required", message: "Mixer requires exactly one master channel.", subjectId: mixer.id });
    for (const channel of mixer.channels) {
      if (!channel.available) issues.push({ code: "channel-unavailable", message: `${channel.name} is unavailable.`, subjectId: channel.id });
      if (channel.kind !== "master" && !mixer.routes.some((route) => route.enabled && route.sourceChannelId === channel.id)) issues.push({ code: "route-required", message: `${channel.name} has no enabled output or send.`, subjectId: channel.id });
    }
    for (const route of mixer.routes.filter((value) => value.enabled)) {
      const source = mixer.channels.find((channel) => channel.id === route.sourceChannelId);
      const destination = mixer.channels.find((channel) => channel.id === route.destinationChannelId);
      if (!source || !destination || route.channelCount > source.outputChannels || route.channelCount > destination.inputChannels) issues.push({ code: "route-channel-mismatch", message: "Mixer route has incompatible channel capacity.", subjectId: route.id });
    }
    if (!this.topologicalOrder(mixer.channels, mixer.routes.filter((route) => route.enabled))) issues.push({ code: "route-cycle", message: "Mixer routing contains a feedback cycle.", subjectId: mixer.id });
    return issues;
  }

  private assertAcyclic(channels: TimelineMixerChannel[], routes: TimelineMixerRoute[]) {
    if (!this.topologicalOrder(channels, routes.filter((route) => route.enabled))) throw new Error("Mixer routing contains a feedback cycle.");
  }

  private topologicalOrder(channels: TimelineMixerChannel[], routes: TimelineMixerRoute[]) {
    const indegree = new Map(channels.map((channel) => [channel.id, 0]));
    const outgoing = new Map<TimelineId, TimelineId[]>();
    routes.forEach((route) => {
      if (!indegree.has(route.sourceChannelId) || !indegree.has(route.destinationChannelId)) return;
      indegree.set(route.destinationChannelId, (indegree.get(route.destinationChannelId) ?? 0) + 1);
      outgoing.set(route.sourceChannelId, [...(outgoing.get(route.sourceChannelId) ?? []), route.destinationChannelId]);
    });
    const ready = channels.filter((channel) => indegree.get(channel.id) === 0).sort((a, b) => a.order - b.order).map((channel) => channel.id);
    const order: TimelineId[] = [];
    while (ready.length) {
      const id = ready.shift()!;
      order.push(id);
      for (const target of outgoing.get(id) ?? []) {
        const next = (indegree.get(target) ?? 0) - 1;
        indegree.set(target, next);
        if (next === 0) ready.push(target);
      }
    }
    return order.length === channels.length ? order : null;
  }

  private maximumPathLatency(mixer: TimelineMixerConsole, order: TimelineId[]) {
    const totals = new Map<TimelineId, number>();
    order.forEach((id) => {
      const channel = this.channel(mixer, id);
      const upstream = mixer.routes.filter((route) => route.enabled && route.destinationChannelId === id).map((route) => totals.get(route.sourceChannelId) ?? 0);
      totals.set(id, channel.latencySamples + (upstream.length ? Math.max(...upstream) : 0));
    });
    return Math.max(0, ...totals.values());
  }

  private channel(mixer: TimelineMixerConsole, id: TimelineId) {
    const channel = mixer.channels.find((candidate) => candidate.id === id);
    if (!channel) throw new Error("Mixer channel was not found.");
    return channel;
  }
  private editable(id: TimelineId, expectedHead: number) {
    const mixer = this.required(id);
    this.assertHead(mixer, expectedHead);
    if (!["draft", "held"].includes(mixer.status)) throw new Error(`${mixer.status} mixers cannot be edited.`);
    return mixer;
  }
  private required(id: TimelineId) {
    const value = this.mixers.get(id);
    if (!value) throw new Error(`Mixer ${id} was not found.`);
    return clone(value);
  }
  private assertHead(mixer: TimelineMixerConsole, expectedHead: number) {
    if (mixer.head !== expectedHead) throw new Error(`Mixer head conflict: expected ${expectedHead}, current ${mixer.head}.`);
  }
  private save(mixer: TimelineMixerConsole, updatedBy: TimelineUserId) {
    const next = { ...clone(mixer), head: mixer.head + 1, updatedAt: this.now().toISOString(), updatedBy: text(updatedBy, "Editor identity") };
    this.mixers.set(next.id, clone(next));
    return clone(next);
  }
  private record(mixer: TimelineMixerConsole, action: TimelineMixerEvent["action"], subjectId: TimelineId, message: string, recordedBy: TimelineUserId) {
    this.events.push({ id: `timeline-mixer-event-${++this.eventSequence}`, mixerId: mixer.id, action, subjectId, message, recordedAt: this.now().toISOString(), recordedBy });
  }
  private sequence(id: TimelineId) {
    return Number(id.match(/(\d+)$/)?.[1] ?? 0);
  }
}

export const timelineMixerAndRoutingEngine = new TimelineMixerAndRoutingEngine();
