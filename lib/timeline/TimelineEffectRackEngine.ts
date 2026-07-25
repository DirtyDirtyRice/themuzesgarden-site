import { createHash } from "node:crypto";

import { TimelineMixSessionEngine } from "./TimelineMixSessionEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineEffectTargetKind = "lane" | "bus";
export type TimelineEffectParameterValue = number | boolean | string;

export type TimelineEffectParameterDefinition = {
  key: string;
  label: string;
  kind: "number" | "boolean" | "choice";
  defaultValue: TimelineEffectParameterValue;
  minimum?: number;
  maximum?: number;
  choices?: string[];
  automatable: boolean;
};

export type TimelineEffectDefinition = {
  id: string;
  name: string;
  category:
    | "equalizer"
    | "dynamics"
    | "space"
    | "delay"
    | "distortion"
    | "modulation"
    | "utility";
  version: string;
  parameters: TimelineEffectParameterDefinition[];
};

export type TimelineEffectInstance = {
  id: TimelineId;
  definitionId: string;
  definitionVersion: string;
  name: string;
  order: number;
  enabled: boolean;
  wet: number;
  parameters: Record<string, TimelineEffectParameterValue>;
  presetId: TimelineId | null;
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineEffectRack = {
  id: TimelineId;
  sessionId: TimelineId;
  targetKind: TimelineEffectTargetKind;
  targetId: TimelineId;
  head: number;
  effects: TimelineEffectInstance[];
  createdAt: string;
  createdBy: TimelineUserId;
  updatedAt: string;
  updatedBy: TimelineUserId;
};

export type TimelineEffectPreset = {
  id: TimelineId;
  definitionId: string;
  definitionVersion: string;
  name: string;
  parameters: Record<string, TimelineEffectParameterValue>;
  wet: number;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineEffectRackSnapshot = {
  id: TimelineId;
  sessionId: TimelineId;
  mixHead: number;
  checksum: string;
  racks: TimelineEffectRack[];
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineEffectRackArchive = {
  definitions: TimelineEffectDefinition[];
  racks: TimelineEffectRack[];
  presets: TimelineEffectPreset[];
  snapshots: TimelineEffectRackSnapshot[];
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function checksum(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const BUILT_INS: TimelineEffectDefinition[] = [
  {
    id: "garden.equalizer",
    name: "Garden Equalizer",
    category: "equalizer",
    version: "1.0.0",
    parameters: [
      {
        key: "lowGainDb",
        label: "Low Gain",
        kind: "number",
        defaultValue: 0,
        minimum: -24,
        maximum: 24,
        automatable: true,
      },
      {
        key: "midGainDb",
        label: "Mid Gain",
        kind: "number",
        defaultValue: 0,
        minimum: -24,
        maximum: 24,
        automatable: true,
      },
      {
        key: "highGainDb",
        label: "High Gain",
        kind: "number",
        defaultValue: 0,
        minimum: -24,
        maximum: 24,
        automatable: true,
      },
      {
        key: "highPassHz",
        label: "High Pass",
        kind: "number",
        defaultValue: 20,
        minimum: 20,
        maximum: 20000,
        automatable: true,
      },
    ],
  },
  {
    id: "garden.compressor",
    name: "Garden Compressor",
    category: "dynamics",
    version: "1.0.0",
    parameters: [
      {
        key: "thresholdDb",
        label: "Threshold",
        kind: "number",
        defaultValue: -18,
        minimum: -80,
        maximum: 0,
        automatable: true,
      },
      {
        key: "ratio",
        label: "Ratio",
        kind: "number",
        defaultValue: 4,
        minimum: 1,
        maximum: 40,
        automatable: true,
      },
      {
        key: "attackMs",
        label: "Attack",
        kind: "number",
        defaultValue: 10,
        minimum: 0.1,
        maximum: 1000,
        automatable: true,
      },
      {
        key: "releaseMs",
        label: "Release",
        kind: "number",
        defaultValue: 100,
        minimum: 1,
        maximum: 5000,
        automatable: true,
      },
    ],
  },
  {
    id: "garden.reverb",
    name: "Garden Reverb",
    category: "space",
    version: "1.0.0",
    parameters: [
      {
        key: "decaySeconds",
        label: "Decay",
        kind: "number",
        defaultValue: 1.8,
        minimum: 0.1,
        maximum: 30,
        automatable: true,
      },
      {
        key: "preDelayMs",
        label: "Pre-delay",
        kind: "number",
        defaultValue: 20,
        minimum: 0,
        maximum: 500,
        automatable: true,
      },
      {
        key: "room",
        label: "Room",
        kind: "choice",
        defaultValue: "studio",
        choices: ["room", "studio", "hall", "plate", "chamber"],
        automatable: false,
      },
    ],
  },
  {
    id: "garden.delay",
    name: "Garden Delay",
    category: "delay",
    version: "1.0.0",
    parameters: [
      {
        key: "timeMs",
        label: "Time",
        kind: "number",
        defaultValue: 250,
        minimum: 1,
        maximum: 5000,
        automatable: true,
      },
      {
        key: "feedback",
        label: "Feedback",
        kind: "number",
        defaultValue: 0.25,
        minimum: 0,
        maximum: 0.98,
        automatable: true,
      },
      {
        key: "sync",
        label: "Tempo Sync",
        kind: "boolean",
        defaultValue: false,
        automatable: false,
      },
    ],
  },
  {
    id: "garden.saturation",
    name: "Garden Saturation",
    category: "distortion",
    version: "1.0.0",
    parameters: [
      {
        key: "driveDb",
        label: "Drive",
        kind: "number",
        defaultValue: 0,
        minimum: 0,
        maximum: 36,
        automatable: true,
      },
      {
        key: "character",
        label: "Character",
        kind: "choice",
        defaultValue: "warm",
        choices: ["clean", "warm", "tape", "tube", "hard"],
        automatable: false,
      },
    ],
  },
  {
    id: "garden.utility",
    name: "Garden Utility",
    category: "utility",
    version: "1.0.0",
    parameters: [
      {
        key: "gainDb",
        label: "Gain",
        kind: "number",
        defaultValue: 0,
        minimum: -120,
        maximum: 24,
        automatable: true,
      },
      {
        key: "phaseInvert",
        label: "Phase Invert",
        kind: "boolean",
        defaultValue: false,
        automatable: false,
      },
      {
        key: "channelMode",
        label: "Channel Mode",
        kind: "choice",
        defaultValue: "stereo",
        choices: ["stereo", "mono", "left", "right", "mid", "side"],
        automatable: false,
      },
    ],
  },
];

export class TimelineEffectRackEngine {
  private readonly definitions = new Map<string, TimelineEffectDefinition>();
  private readonly racks = new Map<TimelineId, TimelineEffectRack>();
  private readonly presets = new Map<TimelineId, TimelineEffectPreset>();
  private readonly snapshots = new Map<
    TimelineId,
    TimelineEffectRackSnapshot
  >();
  private rackSequence = 0;
  private effectSequence = 0;
  private presetSequence = 0;
  private snapshotSequence = 0;

  constructor(
    readonly mixes = new TimelineMixSessionEngine(),
    private readonly now: () => Date = () => new Date(),
  ) {
    BUILT_INS.forEach((definition) =>
      this.definitions.set(definition.id, clone(definition)),
    );
  }

  registerDefinition(definition: TimelineEffectDefinition): void {
    this.validateDefinition(definition);
    const existing = this.definitions.get(definition.id);
    if (existing && existing.version === definition.version) {
      throw new Error("Effect definition and version already exist.");
    }
    if (existing) {
      throw new Error(
        "A new effect version requires a distinct definition ID.",
      );
    }
    this.definitions.set(definition.id, clone(definition));
  }

  listDefinitions(): TimelineEffectDefinition[] {
    return [...this.definitions.values()]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(clone);
  }

  createRack(input: {
    sessionId: TimelineId;
    targetKind: TimelineEffectTargetKind;
    targetId: TimelineId;
    createdBy: TimelineUserId;
  }): TimelineEffectRack {
    const session = this.editableSession(input.sessionId);
    const targets = input.targetKind === "lane" ? session.lanes : session.buses;
    if (!targets.some((target) => target.id === input.targetId)) {
      throw new Error(`Effect rack ${input.targetKind} target was not found.`);
    }
    if (
      [...this.racks.values()].some(
        (rack) =>
          rack.sessionId === session.id &&
          rack.targetKind === input.targetKind &&
          rack.targetId === input.targetId,
      )
    ) {
      throw new Error("The mix target already has an effect rack.");
    }
    const now = this.now().toISOString();
    const rack: TimelineEffectRack = {
      id: `timeline-effect-rack-${++this.rackSequence}`,
      sessionId: session.id,
      targetKind: input.targetKind,
      targetId: input.targetId,
      head: 0,
      effects: [],
      createdAt: now,
      createdBy: input.createdBy,
      updatedAt: now,
      updatedBy: input.createdBy,
    };
    this.racks.set(rack.id, clone(rack));
    return clone(rack);
  }

  addEffect(input: {
    rackId: TimelineId;
    expectedHead: number;
    definitionId: string;
    name?: string;
    wet?: number;
    parameters?: Record<string, TimelineEffectParameterValue>;
    editedBy: TimelineUserId;
  }): TimelineEffectRack {
    const rack = this.editableRack(input.rackId, input.expectedHead);
    const definition = this.requiredDefinition(input.definitionId);
    const parameters = this.defaults(definition);
    Object.entries(input.parameters ?? {}).forEach(([key, value]) => {
      this.validateParameter(definition, key, value);
      parameters[key] = value;
    });
    this.validateWet(input.wet ?? 1);
    const now = this.now().toISOString();
    const effect: TimelineEffectInstance = {
      id: `timeline-effect-${++this.effectSequence}`,
      definitionId: definition.id,
      definitionVersion: definition.version,
      name: input.name?.trim() || definition.name,
      order: rack.effects.length,
      enabled: true,
      wet: input.wet ?? 1,
      parameters,
      presetId: null,
      createdAt: now,
      createdBy: input.editedBy,
      updatedAt: now,
      updatedBy: input.editedBy,
    };
    return this.saveEdit(
      { ...rack, effects: [...rack.effects, effect] },
      input.editedBy,
    );
  }

  updateEffect(input: {
    rackId: TimelineId;
    expectedHead: number;
    effectId: TimelineId;
    patch: Partial<
      Pick<TimelineEffectInstance, "name" | "enabled" | "wet" | "order">
    > & { parameters?: Record<string, TimelineEffectParameterValue> };
    editedBy: TimelineUserId;
  }): TimelineEffectRack {
    const rack = this.editableRack(input.rackId, input.expectedHead);
    const current = rack.effects.find((effect) => effect.id === input.effectId);
    if (!current) throw new Error("Effect instance was not found.");
    const definition = this.requiredDefinition(current.definitionId);
    const parameters = { ...current.parameters };
    Object.entries(input.patch.parameters ?? {}).forEach(([key, value]) => {
      this.validateParameter(definition, key, value);
      parameters[key] = value;
    });
    const next = {
      ...current,
      ...clone(input.patch),
      id: current.id,
      parameters,
      presetId: input.patch.parameters ? null : current.presetId,
      updatedAt: this.now().toISOString(),
      updatedBy: input.editedBy,
    };
    this.validateWet(next.wet);
    const effects = rack.effects
      .map((effect) => (effect.id === next.id ? next : effect))
      .sort(
        (left, right) =>
          left.order - right.order || left.id.localeCompare(right.id),
      )
      .map((effect, order) => ({ ...effect, order }));
    return this.saveEdit({ ...rack, effects }, input.editedBy);
  }

  removeEffect(input: {
    rackId: TimelineId;
    expectedHead: number;
    effectId: TimelineId;
    editedBy: TimelineUserId;
  }): TimelineEffectRack {
    const rack = this.editableRack(input.rackId, input.expectedHead);
    if (!rack.effects.some((effect) => effect.id === input.effectId)) {
      throw new Error("Effect instance was not found.");
    }
    const effects = rack.effects
      .filter((effect) => effect.id !== input.effectId)
      .map((effect, order) => ({ ...effect, order }));
    return this.saveEdit({ ...rack, effects }, input.editedBy);
  }

  createPreset(input: {
    rackId: TimelineId;
    effectId: TimelineId;
    name: string;
    createdBy: TimelineUserId;
  }): TimelineEffectPreset {
    const rack = this.requiredRack(input.rackId);
    const effect = rack.effects.find(
      (candidate) => candidate.id === input.effectId,
    );
    if (!effect) throw new Error("Effect instance was not found.");
    const preset: TimelineEffectPreset = {
      id: `timeline-effect-preset-${++this.presetSequence}`,
      definitionId: effect.definitionId,
      definitionVersion: effect.definitionVersion,
      name: input.name.trim() || `${effect.name} preset`,
      parameters: clone(effect.parameters),
      wet: effect.wet,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.presets.set(preset.id, clone(preset));
    return clone(preset);
  }

  applyPreset(input: {
    rackId: TimelineId;
    expectedHead: number;
    effectId: TimelineId;
    presetId: TimelineId;
    editedBy: TimelineUserId;
  }): TimelineEffectRack {
    const rack = this.editableRack(input.rackId, input.expectedHead);
    const preset = this.presets.get(input.presetId);
    if (!preset) throw new Error("Effect preset was not found.");
    const effect = rack.effects.find(
      (candidate) => candidate.id === input.effectId,
    );
    if (!effect) throw new Error("Effect instance was not found.");
    if (
      effect.definitionId !== preset.definitionId ||
      effect.definitionVersion !== preset.definitionVersion
    ) {
      throw new Error("Preset belongs to a different effect definition.");
    }
    return this.savePresetApplication(rack, effect, preset, input.editedBy);
  }

  createSnapshot(input: {
    sessionId: TimelineId;
    createdBy: TimelineUserId;
  }): TimelineEffectRackSnapshot {
    const session = this.requiredSession(input.sessionId);
    const racks = this.listRacks(session.id);
    this.validateReady(racks);
    const snapshot: TimelineEffectRackSnapshot = {
      id: `timeline-effect-rack-snapshot-${++this.snapshotSequence}`,
      sessionId: session.id,
      mixHead: session.head,
      checksum: checksum(racks),
      racks,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.snapshots.set(snapshot.id, clone(snapshot));
    return clone(snapshot);
  }

  verifySnapshot(snapshotId: TimelineId): {
    valid: boolean;
    mixChanged: boolean;
    rackChanged: boolean;
  } {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) throw new Error("Effect rack snapshot was not found.");
    const session = this.requiredSession(snapshot.sessionId);
    const mixChanged = session.head !== snapshot.mixHead;
    const rackChanged =
      checksum(this.listRacks(snapshot.sessionId)) !== snapshot.checksum;
    return { valid: !mixChanged && !rackChanged, mixChanged, rackChanged };
  }

  automatableParameters(effectId: TimelineId): string[] {
    for (const rack of this.racks.values()) {
      const effect = rack.effects.find(
        (candidate) => candidate.id === effectId,
      );
      if (effect) {
        return this.requiredDefinition(effect.definitionId)
          .parameters.filter((parameter) => parameter.automatable)
          .map((parameter) => parameter.key);
      }
    }
    throw new Error("Effect instance was not found.");
  }

  getRack(rackId: TimelineId): TimelineEffectRack | null {
    const rack = this.racks.get(rackId);
    return rack ? clone(rack) : null;
  }

  listRacks(sessionId: TimelineId): TimelineEffectRack[] {
    return [...this.racks.values()]
      .filter((rack) => rack.sessionId === sessionId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  exportArchive(): TimelineEffectRackArchive {
    return {
      definitions: this.listDefinitions(),
      racks: [...this.racks.values()].map(clone),
      presets: [...this.presets.values()].map(clone),
      snapshots: [...this.snapshots.values()].map(clone),
    };
  }

  restoreArchive(archive: TimelineEffectRackArchive): void {
    this.assertUnique(archive.definitions, "effect definition");
    this.assertUnique(archive.racks, "effect rack");
    this.assertUnique(
      archive.racks.flatMap((rack) => rack.effects),
      "effect",
    );
    this.assertUnique(archive.presets, "effect preset");
    this.assertUnique(archive.snapshots, "effect rack snapshot");
    archive.definitions.forEach((definition) =>
      this.validateDefinition(definition),
    );
    archive.racks.forEach((rack) => this.requiredSession(rack.sessionId));
    this.definitions.clear();
    this.racks.clear();
    this.presets.clear();
    this.snapshots.clear();
    archive.definitions.forEach((definition) =>
      this.definitions.set(definition.id, clone(definition)),
    );
    archive.racks.forEach((rack) => this.racks.set(rack.id, clone(rack)));
    archive.presets.forEach((preset) =>
      this.presets.set(preset.id, clone(preset)),
    );
    archive.snapshots.forEach((snapshot) =>
      this.snapshots.set(snapshot.id, clone(snapshot)),
    );
    const sequence = (id: string) => Number(id.match(/(\d+)$/)?.[1] ?? 0);
    this.rackSequence = Math.max(
      0,
      ...archive.racks.map((rack) => sequence(rack.id)),
    );
    this.effectSequence = Math.max(
      0,
      ...archive.racks
        .flatMap((rack) => rack.effects)
        .map((effect) => sequence(effect.id)),
    );
    this.presetSequence = Math.max(
      0,
      ...archive.presets.map((preset) => sequence(preset.id)),
    );
    this.snapshotSequence = Math.max(
      0,
      ...archive.snapshots.map((snapshot) => sequence(snapshot.id)),
    );
  }

  private savePresetApplication(
    rack: TimelineEffectRack,
    effect: TimelineEffectInstance,
    preset: TimelineEffectPreset,
    editedBy: TimelineUserId,
  ): TimelineEffectRack {
    const now = this.now().toISOString();
    const effects = rack.effects.map((candidate) =>
      candidate.id === effect.id
        ? {
            ...candidate,
            wet: preset.wet,
            parameters: clone(preset.parameters),
            presetId: preset.id,
            updatedAt: now,
            updatedBy: editedBy,
          }
        : candidate,
    );
    return this.saveEdit({ ...rack, effects }, editedBy);
  }

  private validateReady(racks: TimelineEffectRack[]): void {
    racks.forEach((rack) =>
      rack.effects.forEach((effect) => {
        const definition = this.requiredDefinition(effect.definitionId);
        if (definition.version !== effect.definitionVersion) {
          throw new Error(
            `Effect ${effect.id} definition version is unavailable.`,
          );
        }
        definition.parameters.forEach((parameter) =>
          this.validateParameter(
            definition,
            parameter.key,
            effect.parameters[parameter.key],
          ),
        );
      }),
    );
  }

  private defaults(
    definition: TimelineEffectDefinition,
  ): Record<string, TimelineEffectParameterValue> {
    return Object.fromEntries(
      definition.parameters.map((parameter) => [
        parameter.key,
        parameter.defaultValue,
      ]),
    );
  }

  private validateDefinition(definition: TimelineEffectDefinition): void {
    if (
      !definition.id.trim() ||
      !definition.name.trim() ||
      !definition.version.trim()
    ) {
      throw new Error("Effect definition requires ID, name, and version.");
    }
    const keys = definition.parameters.map((parameter) => parameter.key);
    if (new Set(keys).size !== keys.length) {
      throw new Error("Effect definition contains duplicate parameter keys.");
    }
    definition.parameters.forEach((parameter) => {
      if (!parameter.key.trim())
        throw new Error("Effect parameter key is required.");
      this.validateParameter(definition, parameter.key, parameter.defaultValue);
    });
  }

  private validateParameter(
    definition: TimelineEffectDefinition,
    key: string,
    value: TimelineEffectParameterValue,
  ): void {
    const parameter = definition.parameters.find(
      (candidate) => candidate.key === key,
    );
    if (!parameter) throw new Error(`Unknown effect parameter ${key}.`);
    if (parameter.kind === "boolean" && typeof value !== "boolean") {
      throw new Error(`Effect parameter ${key} requires a boolean.`);
    }
    if (parameter.kind === "choice") {
      if (typeof value !== "string" || !parameter.choices?.includes(value)) {
        throw new Error(`Effect parameter ${key} has an invalid choice.`);
      }
    }
    if (parameter.kind === "number") {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < (parameter.minimum ?? -Infinity) ||
        value > (parameter.maximum ?? Infinity)
      ) {
        throw new Error(`Effect parameter ${key} is outside its valid range.`);
      }
    }
  }

  private validateWet(wet: number): void {
    if (!Number.isFinite(wet) || wet < 0 || wet > 1) {
      throw new Error("Effect wet value must be between 0 and 1.");
    }
  }

  private requiredDefinition(definitionId: string): TimelineEffectDefinition {
    const definition = this.definitions.get(definitionId);
    if (!definition) throw new Error("Effect definition was not found.");
    return clone(definition);
  }

  private editableRack(
    rackId: TimelineId,
    expectedHead: number,
  ): TimelineEffectRack {
    const rack = this.requiredRack(rackId);
    this.editableSession(rack.sessionId);
    if (rack.head !== expectedHead) {
      throw new Error(
        `Stale rack head ${expectedHead}; current head is ${rack.head}.`,
      );
    }
    return rack;
  }

  private requiredRack(rackId: TimelineId): TimelineEffectRack {
    const rack = this.racks.get(rackId);
    if (!rack) throw new Error("Effect rack was not found.");
    return clone(rack);
  }

  private editableSession(sessionId: TimelineId) {
    const session = this.requiredSession(sessionId);
    if (session.status !== "editing") {
      throw new Error("Effect racks can change only while the mix is editing.");
    }
    return session;
  }

  private requiredSession(sessionId: TimelineId) {
    const session = this.mixes.getSession(sessionId);
    if (!session) throw new Error("Mix session was not found.");
    return session;
  }

  private saveEdit(
    rack: TimelineEffectRack,
    editedBy: TimelineUserId,
  ): TimelineEffectRack {
    const next = {
      ...clone(rack),
      head: rack.head + 1,
      updatedAt: this.now().toISOString(),
      updatedBy: editedBy,
    };
    this.racks.set(next.id, clone(next));
    return clone(next);
  }

  private assertUnique<T extends { id: string }>(
    values: T[],
    label: string,
  ): void {
    if (new Set(values.map((value) => value.id)).size !== values.length) {
      throw new Error(`Archive contains duplicate ${label} IDs.`);
    }
  }
}

export const timelineEffectRackEngine = new TimelineEffectRackEngine();
