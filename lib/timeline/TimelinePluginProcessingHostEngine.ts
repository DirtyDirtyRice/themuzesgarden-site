import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelinePluginFormat = "vst3" | "au" | "aax" | "clap" | "wasm" | "built-in";
export type TimelinePluginPermission = "audio" | "midi" | "filesystem" | "network";

export type TimelinePluginManifest = {
  pluginId: string;
  name: string;
  vendor: string;
  version: string;
  format: TimelinePluginFormat;
  binaryFingerprint: string;
  supportedPlatforms: Array<"windows" | "macos" | "linux" | "web">;
  architectures: Array<"x64" | "arm64" | "wasm">;
  sampleRates: number[];
  minChannels: number;
  maxChannels: number;
  latencySamples: number;
  memoryMb: number;
  permissions: TimelinePluginPermission[];
};

export type TimelineHostedPlugin = {
  id: TimelineId;
  manifest: TimelinePluginManifest;
  trust: "pending" | "trusted" | "quarantined" | "revoked";
  issues: string[];
  crashCount: number;
  registeredAt: string;
  registeredBy: TimelineUserId;
  reviewedAt?: string;
  reviewedBy?: TimelineUserId;
};

export type TimelinePluginInstance = {
  id: TimelineId;
  hostedPluginId: TimelineId;
  pluginId: string;
  pluginVersion: string;
  order: number;
  enabled: boolean;
  bypassed: boolean;
  stateFingerprint: string;
  latencySamples: number;
};

export type TimelineProcessingChain = {
  id: TimelineId;
  projectId: TimelineId;
  targetId: TimelineId;
  sampleRate: number;
  channels: number;
  platform: "windows" | "macos" | "linux" | "web";
  architecture: "x64" | "arm64" | "wasm";
  maxLatencySamples: number;
  maxMemoryMb: number;
  head: number;
  status: "draft" | "held" | "ready" | "active" | "failed" | "archived";
  instances: TimelinePluginInstance[];
  issues: string[];
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelinePluginHostEvent = {
  id: TimelineId;
  projectId: TimelineId | null;
  subjectId: TimelineId;
  action:
    | "registered"
    | "trusted"
    | "quarantined"
    | "chain-created"
    | "instance-added"
    | "validated"
    | "activated"
    | "crashed"
    | "recovered";
  message: string;
  recordedAt: string;
  recordedBy: TimelineUserId;
};

export type TimelinePluginHostArchive = {
  plugins: TimelineHostedPlugin[];
  chains: TimelineProcessingChain[];
  events: TimelinePluginHostEvent[];
};

const clone = <T>(value: T): T => structuredClone(value);

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

export class TimelinePluginProcessingHostEngine {
  private readonly plugins = new Map<TimelineId, TimelineHostedPlugin>();
  private readonly chains = new Map<TimelineId, TimelineProcessingChain>();
  private readonly events: TimelinePluginHostEvent[] = [];
  private pluginSequence = 0;
  private chainSequence = 0;
  private instanceSequence = 0;
  private eventSequence = 0;

  constructor(private readonly now: () => Date = () => new Date()) {}

  registerPlugin(input: {
    manifest: TimelinePluginManifest;
    observedBinaryFingerprint: string;
    allowedPermissions: TimelinePluginPermission[];
    registeredBy: TimelineUserId;
  }): TimelineHostedPlugin {
    const manifest = this.normalizeManifest(input.manifest);
    if (
      [...this.plugins.values()].some(
        (value) =>
          value.manifest.pluginId === manifest.pluginId &&
          value.manifest.version === manifest.version &&
          value.trust !== "revoked",
      )
    ) {
      throw new Error("This plugin ID and version are already registered.");
    }
    const issues: string[] = [];
    if (text(input.observedBinaryFingerprint, "Observed binary fingerprint") !== manifest.binaryFingerprint) {
      issues.push("Plugin binary fingerprint does not match its manifest.");
    }
    const allowed = new Set(input.allowedPermissions);
    for (const permission of manifest.permissions) {
      if (!allowed.has(permission)) issues.push(`Plugin requests unauthorized ${permission} permission.`);
    }
    const value: TimelineHostedPlugin = {
      id: `timeline-hosted-plugin-${++this.pluginSequence}`,
      manifest,
      trust: "pending",
      issues,
      crashCount: 0,
      registeredAt: this.now().toISOString(),
      registeredBy: input.registeredBy,
    };
    this.plugins.set(value.id, clone(value));
    this.record(null, value.id, "registered", issues.length ? `Plugin held with ${issues.length} issue(s).` : "Plugin registered for review.", input.registeredBy);
    return clone(value);
  }

  reviewPlugin(input: {
    hostedPluginId: TimelineId;
    decision: "trust" | "quarantine";
    reviewedBy: TimelineUserId;
  }): TimelineHostedPlugin {
    const value = this.requirePlugin(input.hostedPluginId);
    if (value.trust !== "pending") throw new Error("Only a pending plugin can be reviewed.");
    if (input.decision === "trust" && value.issues.length) {
      throw new Error("A plugin with unresolved security issues cannot be trusted.");
    }
    if (value.registeredBy === input.reviewedBy) {
      throw new Error("Plugin trust requires an independent reviewer.");
    }
    const reviewed: TimelineHostedPlugin = {
      ...value,
      trust: input.decision === "trust" ? "trusted" : "quarantined",
      reviewedAt: this.now().toISOString(),
      reviewedBy: input.reviewedBy,
    };
    this.plugins.set(reviewed.id, clone(reviewed));
    this.record(null, reviewed.id, reviewed.trust === "trusted" ? "trusted" : "quarantined", `Plugin ${reviewed.trust}.`, input.reviewedBy);
    return clone(reviewed);
  }

  createChain(input: {
    projectId: TimelineId;
    targetId: TimelineId;
    sampleRate: number;
    channels: number;
    platform: TimelineProcessingChain["platform"];
    architecture: TimelineProcessingChain["architecture"];
    maxLatencySamples: number;
    maxMemoryMb: number;
    createdBy: TimelineUserId;
  }): TimelineProcessingChain {
    const value: TimelineProcessingChain = {
      id: `timeline-processing-chain-${++this.chainSequence}`,
      projectId: text(input.projectId, "Project ID"),
      targetId: text(input.targetId, "Processing target ID"),
      sampleRate: whole(input.sampleRate, 8_000, 384_000, "Sample rate"),
      channels: whole(input.channels, 1, 128, "Channel count"),
      platform: input.platform,
      architecture: input.architecture,
      maxLatencySamples: whole(input.maxLatencySamples, 0, 1_000_000, "Maximum latency"),
      maxMemoryMb: whole(input.maxMemoryMb, 1, 1_000_000, "Maximum memory"),
      head: 0,
      status: "draft",
      instances: [],
      issues: [],
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.chains.set(value.id, clone(value));
    this.record(value.projectId, value.id, "chain-created", "Isolated processing chain created.", input.createdBy);
    return clone(value);
  }

  addPlugin(input: {
    chainId: TimelineId;
    expectedHead: number;
    hostedPluginId: TimelineId;
    stateFingerprint: string;
    addedBy: TimelineUserId;
  }): TimelineProcessingChain {
    const chain = this.editableChain(input.chainId, input.expectedHead);
    const plugin = this.requirePlugin(input.hostedPluginId);
    const instance: TimelinePluginInstance = {
      id: `timeline-plugin-instance-${++this.instanceSequence}`,
      hostedPluginId: plugin.id,
      pluginId: plugin.manifest.pluginId,
      pluginVersion: plugin.manifest.version,
      order: chain.instances.length,
      enabled: true,
      bypassed: false,
      stateFingerprint: text(input.stateFingerprint, "Plugin state fingerprint"),
      latencySamples: plugin.manifest.latencySamples,
    };
    const next = { ...chain, head: chain.head + 1, status: "draft" as const, instances: [...chain.instances, instance], issues: [] };
    this.chains.set(next.id, clone(next));
    this.record(next.projectId, instance.id, "instance-added", `${plugin.manifest.name} added non-destructively.`, input.addedBy);
    return clone(next);
  }

  validateChain(input: { chainId: TimelineId; validatedBy: TimelineUserId }): TimelineProcessingChain {
    const value = this.requireChain(input.chainId);
    if (!["draft", "held", "failed"].includes(value.status)) throw new Error("This chain cannot be validated.");
    const issues: string[] = [];
    let latency = 0;
    let memory = 0;
    for (const instance of value.instances) {
      const plugin = this.requirePlugin(instance.hostedPluginId);
      const manifest = plugin.manifest;
      if (plugin.trust !== "trusted") issues.push(`${manifest.name} is not trusted.`);
      if (manifest.version !== instance.pluginVersion) issues.push(`${manifest.name} version is unavailable.`);
      if (!manifest.supportedPlatforms.includes(value.platform)) issues.push(`${manifest.name} does not support ${value.platform}.`);
      if (!manifest.architectures.includes(value.architecture)) issues.push(`${manifest.name} does not support ${value.architecture}.`);
      if (!manifest.sampleRates.includes(value.sampleRate)) issues.push(`${manifest.name} does not support ${value.sampleRate} Hz.`);
      if (value.channels < manifest.minChannels || value.channels > manifest.maxChannels) issues.push(`${manifest.name} has incompatible channel requirements.`);
      latency += manifest.latencySamples;
      memory += manifest.memoryMb;
    }
    if (!value.instances.length) issues.push("Processing chain requires at least one plugin.");
    if (latency > value.maxLatencySamples) issues.push(`Chain latency ${latency} exceeds its ${value.maxLatencySamples} sample limit.`);
    if (memory > value.maxMemoryMb) issues.push(`Chain memory ${memory} MB exceeds its ${value.maxMemoryMb} MB limit.`);
    const next: TimelineProcessingChain = { ...value, status: issues.length ? "held" : "ready", issues: [...new Set(issues)] };
    this.chains.set(next.id, clone(next));
    this.record(next.projectId, next.id, "validated", issues.length ? `Chain held: ${next.issues.join(" ")}` : "Every plugin and resource limit passed validation.", input.validatedBy);
    return clone(next);
  }

  activateChain(input: { chainId: TimelineId; activatedBy: TimelineUserId }): TimelineProcessingChain {
    const value = this.requireChain(input.chainId);
    if (value.status !== "ready") throw new Error("Only a ready processing chain can be activated.");
    for (const current of this.chains.values()) {
      if (current.projectId === value.projectId && current.targetId === value.targetId && current.status === "active") {
        this.chains.set(current.id, { ...current, status: "archived" });
      }
    }
    const active: TimelineProcessingChain = { ...value, status: "active" };
    this.chains.set(active.id, clone(active));
    this.record(active.projectId, active.id, "activated", "Validated chain activated.", input.activatedBy);
    return clone(active);
  }

  reportCrash(input: {
    chainId: TimelineId;
    instanceId: TimelineId;
    reason: string;
    reportedBy: TimelineUserId;
  }): TimelineProcessingChain {
    const chain = this.requireChain(input.chainId);
    const instance = chain.instances.find((value) => value.id === input.instanceId);
    if (!instance) throw new Error("Plugin instance was not found.");
    const plugin = this.requirePlugin(instance.hostedPluginId);
    const crashed: TimelineHostedPlugin = { ...plugin, crashCount: plugin.crashCount + 1, trust: "quarantined" };
    this.plugins.set(crashed.id, clone(crashed));
    const failed: TimelineProcessingChain = {
      ...chain,
      status: "failed",
      issues: [`${plugin.manifest.name} crashed: ${text(input.reason, "Crash reason")}`],
      instances: chain.instances.map((value) => value.id === instance.id ? { ...value, enabled: false, bypassed: true } : value),
    };
    this.chains.set(failed.id, clone(failed));
    this.record(failed.projectId, instance.id, "crashed", failed.issues[0], input.reportedBy);
    return clone(failed);
  }

  recoverChain(input: { chainId: TimelineId; recoveredBy: TimelineUserId }): TimelineProcessingChain {
    const value = this.requireChain(input.chainId);
    if (value.status !== "failed") throw new Error("Only a failed chain can be recovered.");
    const recovered: TimelineProcessingChain = { ...value, status: "draft", issues: [] };
    this.chains.set(recovered.id, clone(recovered));
    this.record(recovered.projectId, recovered.id, "recovered", "Chain returned to draft with crashed plugin bypassed.", input.recoveredBy);
    return clone(recovered);
  }

  getPlugin(id: TimelineId): TimelineHostedPlugin | null {
    const value = this.plugins.get(id);
    return value ? clone(value) : null;
  }

  getChain(id: TimelineId): TimelineProcessingChain | null {
    const value = this.chains.get(id);
    return value ? clone(value) : null;
  }

  listEvents(projectId?: TimelineId): TimelinePluginHostEvent[] {
    return this.events.filter((value) => !projectId || value.projectId === projectId).map(clone);
  }

  exportArchive(): TimelinePluginHostArchive {
    return { plugins: [...this.plugins.values()].map(clone), chains: [...this.chains.values()].map(clone), events: this.events.map(clone) };
  }

  restoreArchive(archive: TimelinePluginHostArchive): void {
    const ids = new Set<string>();
    const use = (id: string) => {
      if (ids.has(id)) throw new Error("Plugin host archive contains duplicate IDs.");
      ids.add(id);
    };
    this.plugins.clear();
    this.chains.clear();
    this.events.length = 0;
    for (const plugin of archive.plugins) {
      use(plugin.id);
      this.normalizeManifest(plugin.manifest);
      this.plugins.set(plugin.id, clone(plugin));
    }
    for (const chain of archive.chains) {
      use(chain.id);
      for (const instance of chain.instances) {
        use(instance.id);
        if (!this.plugins.has(instance.hostedPluginId)) throw new Error("Chain references an unknown hosted plugin.");
      }
      this.chains.set(chain.id, clone(chain));
    }
    this.events.push(...archive.events.map(clone));
    this.pluginSequence = this.highest(archive.plugins.map((value) => value.id));
    this.chainSequence = this.highest(archive.chains.map((value) => value.id));
    this.instanceSequence = this.highest(archive.chains.flatMap((value) => value.instances.map((instance) => instance.id)));
    this.eventSequence = this.highest(archive.events.map((value) => value.id));
  }

  private normalizeManifest(manifest: TimelinePluginManifest): TimelinePluginManifest {
    const value = clone(manifest);
    value.pluginId = text(value.pluginId, "Plugin ID");
    value.name = text(value.name, "Plugin name");
    value.vendor = text(value.vendor, "Plugin vendor");
    value.version = text(value.version, "Plugin version");
    value.binaryFingerprint = text(value.binaryFingerprint, "Binary fingerprint");
    value.sampleRates = [...new Set(value.sampleRates.map((rate) => whole(rate, 8_000, 384_000, "Plugin sample rate")))];
    value.supportedPlatforms = [...new Set(value.supportedPlatforms)];
    value.architectures = [...new Set(value.architectures)];
    value.permissions = [...new Set(value.permissions)];
    whole(value.minChannels, 1, 128, "Minimum channels");
    whole(value.maxChannels, value.minChannels, 128, "Maximum channels");
    whole(value.latencySamples, 0, 1_000_000, "Plugin latency");
    whole(value.memoryMb, 1, 1_000_000, "Plugin memory");
    if (!value.sampleRates.length || !value.supportedPlatforms.length || !value.architectures.length) throw new Error("Plugin compatibility matrix is incomplete.");
    return value;
  }

  private editableChain(id: TimelineId, expectedHead: number): TimelineProcessingChain {
    const value = this.requireChain(id);
    if (!["draft", "held", "failed"].includes(value.status)) throw new Error("Active or archived chains cannot be edited.");
    if (value.head !== expectedHead) throw new Error(`Stale chain head ${expectedHead}; current head is ${value.head}.`);
    return value;
  }

  private requirePlugin(id: TimelineId): TimelineHostedPlugin {
    const value = this.plugins.get(id);
    if (!value) throw new Error(`Unknown hosted plugin: ${id}`);
    return clone(value);
  }

  private requireChain(id: TimelineId): TimelineProcessingChain {
    const value = this.chains.get(id);
    if (!value) throw new Error(`Unknown processing chain: ${id}`);
    return clone(value);
  }

  private record(projectId: TimelineId | null, subjectId: TimelineId, action: TimelinePluginHostEvent["action"], message: string, recordedBy: TimelineUserId): void {
    this.events.push({ id: `timeline-plugin-host-event-${++this.eventSequence}`, projectId, subjectId, action, message, recordedAt: this.now().toISOString(), recordedBy });
  }

  private highest(ids: string[]): number {
    return ids.reduce((maximum, id) => Math.max(maximum, Number(id.match(/(\d+)$/)?.[1] ?? 0)), 0);
  }
}
