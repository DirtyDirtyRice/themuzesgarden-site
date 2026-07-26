import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineDeviceChainStatus = "draft" | "held" | "validated" | "active" | "archived";
export type TimelineDeviceKind = "instrument" | "audio-effect" | "midi-effect" | "utility";
export type TimelineDeviceParameter = { id: string; name: string; value: number; minimum: number; maximum: number; unit: string };
export type TimelineChainDevice = {
  id: TimelineId; pluginId: string; pluginVersion: string; name: string; kind: TimelineDeviceKind;
  format: "builtin" | "vst3" | "au" | "clap"; inputChannels: number; outputChannels: number;
  latencySamples: number; bypassed: boolean; wet: number; available: boolean; parameters: TimelineDeviceParameter[];
};
export type TimelineDeviceChainIssue = {
  code: "device-required" | "plugin-unavailable" | "channel-mismatch" | "instrument-position" | "parameter-invalid";
  message: string; subjectId: TimelineId | null;
};
export type TimelineDeviceChain = {
  id: TimelineId; projectId: TimelineId; ownerId: TimelineId; name: string; inputChannels: number; outputChannels: number;
  devices: TimelineChainDevice[]; status: TimelineDeviceChainStatus; head: number; issues: TimelineDeviceChainIssue[];
  createdAt: string; createdBy: TimelineUserId; updatedAt: string; updatedBy: TimelineUserId;
};
export type TimelineDeviceChainSnapshot = {
  id: TimelineId; chainId: TimelineId; name: string; devices: TimelineChainDevice[]; createdAt: string; createdBy: TimelineUserId;
};
export type TimelineDeviceChainEvent = {
  id: TimelineId; chainId: TimelineId;
  action: "created" | "device-added" | "device-updated" | "device-moved" | "device-removed" | "snapshot-created" | "snapshot-restored" | "validated" | "held" | "activated" | "archived";
  subjectId: TimelineId; message: string; recordedAt: string; recordedBy: TimelineUserId;
};
export type TimelinePluginAndDeviceChainArchive = {
  chains: TimelineDeviceChain[]; snapshots: TimelineDeviceChainSnapshot[]; events: TimelineDeviceChainEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);
const text = (value: string, label: string) => {
  const result = value.trim();
  if (!result) throw new Error(`${label} is required.`);
  return result;
};
const channels = (value: number, label: string) => {
  if (!Number.isInteger(value) || value < 1 || value > 64) throw new Error(`${label} must be between 1 and 64.`);
  return value;
};

export class TimelinePluginAndDeviceChainEngine {
  private readonly chains = new Map<TimelineId, TimelineDeviceChain>();
  private readonly snapshots: TimelineDeviceChainSnapshot[] = [];
  private readonly events: TimelineDeviceChainEvent[] = [];
  private chainSequence = 0;
  private deviceSequence = 0;
  private snapshotSequence = 0;
  private eventSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  createChain(input: { projectId: TimelineId; ownerId: TimelineId; name: string; inputChannels: number; outputChannels: number; createdBy: TimelineUserId }) {
    const timestamp = this.now().toISOString();
    const chain: TimelineDeviceChain = {
      id: `timeline-device-chain-${++this.chainSequence}`, projectId: text(input.projectId, "Project"),
      ownerId: text(input.ownerId, "Chain owner"), name: text(input.name, "Chain name"),
      inputChannels: channels(input.inputChannels, "Input channels"), outputChannels: channels(input.outputChannels, "Output channels"),
      devices: [], status: "draft", head: 0, issues: [], createdAt: timestamp, createdBy: text(input.createdBy, "Creator"),
      updatedAt: timestamp, updatedBy: input.createdBy,
    };
    this.chains.set(chain.id, clone(chain));
    this.record(chain, "created", chain.id, `Created ${chain.name}.`, input.createdBy);
    return clone(chain);
  }

  addDevice(input: {
    chainId: TimelineId; expectedHead: number; pluginId: string; pluginVersion: string; name: string; kind: TimelineDeviceKind;
    format: TimelineChainDevice["format"]; inputChannels: number; outputChannels: number; latencySamples?: number;
    available?: boolean; parameters?: TimelineDeviceParameter[]; addedBy: TimelineUserId; index?: number;
  }) {
    const chain = this.editable(input.chainId, input.expectedHead);
    const device: TimelineChainDevice = {
      id: `timeline-chain-device-${++this.deviceSequence}`, pluginId: text(input.pluginId, "Plugin"),
      pluginVersion: text(input.pluginVersion, "Plugin version"), name: text(input.name, "Device name"),
      kind: input.kind, format: input.format, inputChannels: channels(input.inputChannels, "Device input channels"),
      outputChannels: channels(input.outputChannels, "Device output channels"),
      latencySamples: this.nonnegative(input.latencySamples ?? 0, "Device latency"),
      bypassed: false, wet: 1, available: input.available ?? true,
      parameters: (input.parameters ?? []).map((parameter) => this.validParameter(parameter)),
    };
    const index = input.index ?? chain.devices.length;
    if (!Number.isInteger(index) || index < 0 || index > chain.devices.length) throw new Error("Device index is outside the chain.");
    chain.devices.splice(index, 0, device);
    const saved = this.save(chain, input.addedBy);
    this.record(saved, "device-added", device.id, `Added ${device.name}.`, input.addedBy);
    return saved;
  }

  updateDevice(input: {
    chainId: TimelineId; deviceId: TimelineId; expectedHead: number; updatedBy: TimelineUserId; bypassed?: boolean;
    wet?: number; available?: boolean; latencySamples?: number; parameters?: Array<{ id: string; value: number }>;
  }) {
    const chain = this.editable(input.chainId, input.expectedHead);
    const device = this.device(chain, input.deviceId);
    if (input.wet !== undefined && (!Number.isFinite(input.wet) || input.wet < 0 || input.wet > 1)) throw new Error("Device wet value must be between 0 and 1.");
    if (input.latencySamples !== undefined) device.latencySamples = this.nonnegative(input.latencySamples, "Device latency");
    if (input.bypassed !== undefined) device.bypassed = input.bypassed;
    if (input.wet !== undefined) device.wet = input.wet;
    if (input.available !== undefined) device.available = input.available;
    for (const update of input.parameters ?? []) {
      const parameter = device.parameters.find((value) => value.id === update.id);
      if (!parameter) throw new Error(`Device parameter ${update.id} was not found.`);
      if (!Number.isFinite(update.value) || update.value < parameter.minimum || update.value > parameter.maximum) throw new Error(`${parameter.name} is outside its valid range.`);
      parameter.value = update.value;
    }
    const saved = this.save(chain, input.updatedBy);
    this.record(saved, "device-updated", device.id, `Updated ${device.name}.`, input.updatedBy);
    return saved;
  }

  moveDevice(input: { chainId: TimelineId; deviceId: TimelineId; toIndex: number; expectedHead: number; movedBy: TimelineUserId }) {
    const chain = this.editable(input.chainId, input.expectedHead);
    if (!Number.isInteger(input.toIndex) || input.toIndex < 0 || input.toIndex >= chain.devices.length) throw new Error("Destination index is outside the chain.");
    const from = chain.devices.findIndex((value) => value.id === input.deviceId);
    if (from < 0) throw new Error("Chain device was not found.");
    const [device] = chain.devices.splice(from, 1);
    chain.devices.splice(input.toIndex, 0, device);
    const saved = this.save(chain, input.movedBy);
    this.record(saved, "device-moved", device.id, `Moved ${device.name} to position ${input.toIndex + 1}.`, input.movedBy);
    return saved;
  }

  removeDevice(input: { chainId: TimelineId; deviceId: TimelineId; expectedHead: number; removedBy: TimelineUserId }) {
    const chain = this.editable(input.chainId, input.expectedHead);
    const index = chain.devices.findIndex((value) => value.id === input.deviceId);
    if (index < 0) throw new Error("Chain device was not found.");
    const [device] = chain.devices.splice(index, 1);
    const saved = this.save(chain, input.removedBy);
    this.record(saved, "device-removed", device.id, `Removed ${device.name}.`, input.removedBy);
    return saved;
  }

  createSnapshot(input: { chainId: TimelineId; name: string; createdBy: TimelineUserId }) {
    const chain = this.required(input.chainId);
    const snapshot: TimelineDeviceChainSnapshot = {
      id: `timeline-device-snapshot-${++this.snapshotSequence}`, chainId: chain.id, name: text(input.name, "Snapshot name"),
      devices: clone(chain.devices), createdAt: this.now().toISOString(), createdBy: text(input.createdBy, "Snapshot creator"),
    };
    this.snapshots.push(clone(snapshot));
    this.record(chain, "snapshot-created", snapshot.id, `Created snapshot ${snapshot.name}.`, input.createdBy);
    return clone(snapshot);
  }

  restoreSnapshot(input: { chainId: TimelineId; snapshotId: TimelineId; expectedHead: number; restoredBy: TimelineUserId }) {
    const chain = this.editable(input.chainId, input.expectedHead);
    const snapshot = this.snapshots.find((value) => value.id === input.snapshotId && value.chainId === chain.id);
    if (!snapshot) throw new Error("Device-chain snapshot was not found.");
    chain.devices = clone(snapshot.devices);
    const saved = this.save(chain, input.restoredBy);
    this.record(saved, "snapshot-restored", snapshot.id, `Restored snapshot ${snapshot.name}.`, input.restoredBy);
    return saved;
  }

  validate(input: { chainId: TimelineId; expectedHead: number; validatedBy: TimelineUserId }) {
    const chain = this.editable(input.chainId, input.expectedHead);
    chain.issues = this.inspect(chain);
    chain.status = chain.issues.length ? "held" : "validated";
    const saved = this.save(chain, input.validatedBy);
    this.record(saved, chain.status === "held" ? "held" : "validated", chain.id, chain.status === "held" ? `Held with ${chain.issues.length} issue(s).` : "Validated device chain.", input.validatedBy);
    return saved;
  }

  activate(input: { chainId: TimelineId; expectedHead: number; activatedBy: TimelineUserId }) {
    const chain = this.required(input.chainId);
    this.assertHead(chain, input.expectedHead);
    if (chain.status !== "validated") throw new Error("Only a validated device chain can be activated.");
    chain.status = "active";
    const saved = this.save(chain, input.activatedBy);
    this.record(saved, "activated", chain.id, "Activated device chain.", input.activatedBy);
    return saved;
  }

  archive(input: { chainId: TimelineId; expectedHead: number; archivedBy: TimelineUserId }) {
    const chain = this.required(input.chainId);
    this.assertHead(chain, input.expectedHead);
    chain.status = "archived";
    const saved = this.save(chain, input.archivedBy);
    this.record(saved, "archived", chain.id, "Archived device chain.", input.archivedBy);
    return saved;
  }

  totalLatency(chainId: TimelineId) {
    return this.required(chainId).devices.filter((device) => !device.bypassed).reduce((sum, device) => sum + device.latencySamples, 0);
  }
  processingOrder(chainId: TimelineId) { return this.required(chainId).devices.map((device) => device.id); }
  listEvents(chainId: TimelineId) { return this.events.filter((event) => event.chainId === chainId).map(clone); }
  listSnapshots(chainId: TimelineId) { return this.snapshots.filter((snapshot) => snapshot.chainId === chainId).map(clone); }
  getChain(chainId: TimelineId) { return this.required(chainId); }
  exportArchive(): TimelinePluginAndDeviceChainArchive {
    return { chains: [...this.chains.values()].map(clone), snapshots: this.snapshots.map(clone), events: this.events.map(clone) };
  }

  restoreArchive(archive: TimelinePluginAndDeviceChainArchive) {
    const ids = new Set<TimelineId>();
    const use = (id: TimelineId) => { if (ids.has(id)) throw new Error("Device-chain archive contains duplicate identities."); ids.add(id); };
    archive.chains.forEach((chain) => { use(chain.id); chain.devices.forEach((device) => use(device.id)); });
    archive.snapshots.forEach((snapshot) => {
      use(snapshot.id);
      if (!archive.chains.some((chain) => chain.id === snapshot.chainId)) throw new Error("Snapshot refers to a missing device chain.");
    });
    archive.events.forEach((event) => {
      use(event.id);
      if (!archive.chains.some((chain) => chain.id === event.chainId)) throw new Error("Event refers to a missing device chain.");
    });
    this.chains.clear(); this.snapshots.splice(0); this.events.splice(0);
    this.chainSequence = this.deviceSequence = this.snapshotSequence = this.eventSequence = 0;
    archive.chains.forEach((chain) => {
      this.chains.set(chain.id, clone(chain)); this.chainSequence = Math.max(this.chainSequence, this.sequence(chain.id));
      chain.devices.forEach((device) => { this.deviceSequence = Math.max(this.deviceSequence, this.sequence(device.id)); });
    });
    archive.snapshots.forEach((snapshot) => { this.snapshots.push(clone(snapshot)); this.snapshotSequence = Math.max(this.snapshotSequence, this.sequence(snapshot.id)); });
    archive.events.forEach((event) => { this.events.push(clone(event)); this.eventSequence = Math.max(this.eventSequence, this.sequence(event.id)); });
  }

  private inspect(chain: TimelineDeviceChain) {
    const issues: TimelineDeviceChainIssue[] = [];
    if (!chain.devices.length) issues.push({ code: "device-required", message: "At least one device is required.", subjectId: chain.id });
    let channelCount = chain.inputChannels;
    let instrumentSeen = false;
    chain.devices.forEach((device, index) => {
      if (!device.available) issues.push({ code: "plugin-unavailable", message: `${device.name} is unavailable.`, subjectId: device.id });
      if (device.kind === "instrument") {
        if (instrumentSeen || index > 0) issues.push({ code: "instrument-position", message: "An instrument must be the first and only instrument in a chain.", subjectId: device.id });
        instrumentSeen = true;
      } else if (device.inputChannels !== channelCount) {
        issues.push({ code: "channel-mismatch", message: `${device.name} expects ${device.inputChannels} channels but receives ${channelCount}.`, subjectId: device.id });
      }
      channelCount = device.outputChannels;
      if (device.parameters.some((parameter) => parameter.value < parameter.minimum || parameter.value > parameter.maximum)) issues.push({ code: "parameter-invalid", message: `${device.name} contains an invalid parameter.`, subjectId: device.id });
    });
    if (chain.devices.length && channelCount !== chain.outputChannels) issues.push({ code: "channel-mismatch", message: `Chain produces ${channelCount} channels but requires ${chain.outputChannels}.`, subjectId: chain.id });
    return issues;
  }
  private validParameter(value: TimelineDeviceParameter) {
    const parameter = { ...clone(value), id: text(value.id, "Parameter id"), name: text(value.name, "Parameter name"), unit: value.unit.trim() };
    if (![parameter.value, parameter.minimum, parameter.maximum].every(Number.isFinite) || parameter.minimum > parameter.maximum || parameter.value < parameter.minimum || parameter.value > parameter.maximum) throw new Error(`${parameter.name} has an invalid range or value.`);
    return parameter;
  }
  private nonnegative(value: number, label: string) {
    if (!Number.isInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative integer.`);
    return value;
  }
  private device(chain: TimelineDeviceChain, id: TimelineId) {
    const device = chain.devices.find((value) => value.id === id);
    if (!device) throw new Error("Chain device was not found.");
    return device;
  }
  private editable(id: TimelineId, expectedHead: number) {
    const chain = this.required(id); this.assertHead(chain, expectedHead);
    if (!["draft", "held"].includes(chain.status)) throw new Error(`${chain.status} device chains cannot be edited.`);
    return chain;
  }
  private required(id: TimelineId) {
    const chain = this.chains.get(id);
    if (!chain) throw new Error(`Device chain ${id} was not found.`);
    return clone(chain);
  }
  private assertHead(chain: TimelineDeviceChain, expectedHead: number) {
    if (chain.head !== expectedHead) throw new Error(`Device-chain head conflict: expected ${expectedHead}, current ${chain.head}.`);
  }
  private save(chain: TimelineDeviceChain, updatedBy: TimelineUserId) {
    const next = { ...clone(chain), head: chain.head + 1, updatedAt: this.now().toISOString(), updatedBy: text(updatedBy, "Editor") };
    this.chains.set(next.id, clone(next)); return clone(next);
  }
  private record(chain: TimelineDeviceChain, action: TimelineDeviceChainEvent["action"], subjectId: TimelineId, message: string, recordedBy: TimelineUserId) {
    this.events.push({ id: `timeline-device-chain-event-${++this.eventSequence}`, chainId: chain.id, action, subjectId, message, recordedAt: this.now().toISOString(), recordedBy });
  }
  private sequence(id: TimelineId) { return Number(id.match(/(\d+)$/)?.[1] ?? 0); }
}

export const timelinePluginAndDeviceChainEngine = new TimelinePluginAndDeviceChainEngine();
