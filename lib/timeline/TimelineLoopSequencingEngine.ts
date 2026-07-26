import type { TimelineGrooveMappingRecord } from "./TimelineGrooveMappingEngine";
import type { TimelineSliceMapRecord } from "./TimelineSliceMapEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineLoopStepInput = {
  sliceId: TimelineId | null;
  probability?: number;
  accent?: number;
  repeat?: number;
};

export type TimelineLoopSequenceConfiguration = {
  beatsPerBar: number;
  subdivisionsPerBeat: number;
  bars: number;
  seed: number;
};

export type TimelineLoopSequenceStep = {
  id: TimelineId;
  step: number;
  bar: number;
  beat: number;
  subdivision: number;
  sliceId: TimelineId | null;
  probability: number;
  accent: number;
  repeat: number;
  grooveOffsetSeconds: number;
};

export type TimelineLoopPlaybackEvent = {
  id: TimelineId;
  stepId: TimelineId;
  sliceId: TimelineId;
  repeat: number;
  timelineStartSeconds: number;
  durationSeconds: number;
  gain: number;
  probabilityRoll: number;
};

export type TimelineLoopSequenceRecord = {
  id: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  sliceMapId: TimelineId;
  grooveMappingId: TimelineId | null;
  bpm: number;
  configuration: TimelineLoopSequenceConfiguration;
  steps: TimelineLoopSequenceStep[];
  events: TimelineLoopPlaybackEvent[];
  durationSeconds: number;
  skippedStepIds: TimelineId[];
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineLoopSequencingIssue = {
  code:
    | "slice-map-required"
    | "tempo-required"
    | "steps-required"
    | "configuration-invalid"
    | "pattern-length-invalid"
    | "slice-not-found"
    | "step-invalid"
    | "groove-mismatch";
  message: string;
};

export type TimelineLoopSequencingResult = {
  accepted: boolean;
  sequence: TimelineLoopSequenceRecord | null;
  issues: TimelineLoopSequencingIssue[];
};

export type TimelineLoopSequencingArchive = {
  sequences: TimelineLoopSequenceRecord[];
};

const DEFAULT_CONFIGURATION: TimelineLoopSequenceConfiguration = {
  beatsPerBar: 4,
  subdivisionsPerBeat: 4,
  bars: 1,
  seed: 1,
};
const clone = <T>(value: T): T => structuredClone(value);
const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

function normalizeConfiguration(
  input?: Partial<TimelineLoopSequenceConfiguration>,
): TimelineLoopSequenceConfiguration | null {
  const value = { ...DEFAULT_CONFIGURATION, ...input };
  if (
    !Number.isInteger(value.beatsPerBar) ||
    value.beatsPerBar < 1 ||
    value.beatsPerBar > 32 ||
    !Number.isInteger(value.subdivisionsPerBeat) ||
    ![1, 2, 3, 4, 6, 8].includes(value.subdivisionsPerBeat) ||
    !Number.isInteger(value.bars) ||
    value.bars < 1 ||
    value.bars > 1_024 ||
    !Number.isInteger(value.seed) ||
    value.seed < 0 ||
    value.seed > 0x7fffffff
  ) return null;
  return value;
}

function deterministicRoll(seed: number, step: number): number {
  let value = (seed ^ Math.imul(step + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return round((value >>> 0) / 0x100000000);
}

function validateStep(step: TimelineLoopStepInput): string | null {
  const probability = step.probability ?? 1;
  const accent = step.accent ?? 1;
  const repeat = step.repeat ?? 1;
  if (
    (step.sliceId !== null && !step.sliceId.trim()) ||
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 1 ||
    !Number.isFinite(accent) ||
    accent < 0 ||
    accent > 4 ||
    !Number.isInteger(repeat) ||
    repeat < 1 ||
    repeat > 128
  ) return "Step probability, accent, repeat, or slice identity is invalid.";
  return null;
}

export class TimelineLoopSequencingEngine {
  private readonly sequences = new Map<TimelineId, TimelineLoopSequenceRecord>();
  private nextId = 1;

  constructor(private readonly now: () => Date = () => new Date()) {}

  create(input: {
    sliceMap: TimelineSliceMapRecord;
    grooveMapping?: TimelineGrooveMappingRecord | null;
    pattern: TimelineLoopStepInput[];
    configuration?: Partial<TimelineLoopSequenceConfiguration>;
    createdBy: TimelineUserId;
  }): TimelineLoopSequencingResult {
    const issues: TimelineLoopSequencingIssue[] = [];
    if (!input.sliceMap?.id?.trim()) {
      issues.push({ code: "slice-map-required", message: "A slice map is required." });
    }
    if (!input.sliceMap?.tempo) {
      issues.push({ code: "tempo-required", message: "A trusted tempo is required." });
    }
    if (!input.pattern?.length) {
      issues.push({ code: "steps-required", message: "At least one pattern step is required." });
    }
    const configuration = normalizeConfiguration(input.configuration);
    if (!configuration) {
      issues.push({ code: "configuration-invalid", message: "Sequence configuration is invalid." });
    }
    if (
      configuration &&
      input.pattern?.length !==
        configuration.beatsPerBar *
        configuration.subdivisionsPerBeat *
        configuration.bars
    ) {
      issues.push({
        code: "pattern-length-invalid",
        message: "Pattern length must exactly fill the configured bars.",
      });
    }
    const knownSlices = new Map(
      (input.sliceMap?.slices ?? []).map((slice) => [slice.id, slice]),
    );
    for (const step of input.pattern ?? []) {
      const invalid = validateStep(step);
      if (invalid) issues.push({ code: "step-invalid", message: invalid });
      if (step.sliceId !== null && !knownSlices.has(step.sliceId)) {
        issues.push({
          code: "slice-not-found",
          message: `Slice ${step.sliceId} was not found in the source map.`,
        });
      }
    }
    if (
      input.grooveMapping &&
      (
        input.grooveMapping.sliceMapId !== input.sliceMap.id ||
        input.grooveMapping.sourceFingerprint !== input.sliceMap.sourceFingerprint
      )
    ) {
      issues.push({
        code: "groove-mismatch",
        message: "Groove evidence does not belong to the supplied slice map.",
      });
    }
    if (issues.length || !configuration || !input.sliceMap.tempo) {
      return { accepted: false, sequence: null, issues };
    }

    const bpm = input.sliceMap.tempo.bpm;
    const stepDuration = 60 / bpm / configuration.subdivisionsPerBeat;
    const grooveOffsets = input.grooveMapping?.template.offsets ?? [];
    const grooveAccents = input.grooveMapping?.template.accents ?? [];
    const steps: TimelineLoopSequenceStep[] = input.pattern.map((inputStep, index) => {
      const stepInBar = index % (
        configuration.beatsPerBar * configuration.subdivisionsPerBeat
      );
      const grooveIndex = grooveOffsets.length
        ? index % grooveOffsets.length
        : -1;
      return {
        id: `timeline-loop-sequence-${this.nextId}-step-${index + 1}`,
        step: index,
        bar: Math.floor(index / (
          configuration.beatsPerBar * configuration.subdivisionsPerBeat
        )) + 1,
        beat: Math.floor(stepInBar / configuration.subdivisionsPerBeat) + 1,
        subdivision: stepInBar % configuration.subdivisionsPerBeat,
        sliceId: inputStep.sliceId,
        probability: inputStep.probability ?? 1,
        accent: round(
          (inputStep.accent ?? 1) *
          (grooveIndex >= 0 && grooveAccents[grooveIndex]
            ? grooveAccents[grooveIndex]
            : 1),
        ),
        repeat: inputStep.repeat ?? 1,
        grooveOffsetSeconds: grooveIndex >= 0
          ? round(grooveOffsets[grooveIndex] * stepDuration)
          : 0,
      };
    });
    const events: TimelineLoopPlaybackEvent[] = [];
    const skippedStepIds: TimelineId[] = [];
    for (const step of steps) {
      const roll = deterministicRoll(configuration.seed, step.step);
      if (step.sliceId === null || roll >= step.probability) {
        skippedStepIds.push(step.id);
        continue;
      }
      const slice = knownSlices.get(step.sliceId)!;
      const eventDuration = Math.min(slice.durationSeconds, stepDuration / step.repeat);
      for (let repeat = 0; repeat < step.repeat; repeat += 1) {
        events.push({
          id: `timeline-loop-sequence-${this.nextId}-event-${events.length + 1}`,
          stepId: step.id,
          sliceId: step.sliceId,
          repeat,
          timelineStartSeconds: round(Math.max(
            0,
            step.step * stepDuration +
              step.grooveOffsetSeconds +
              repeat * eventDuration,
          )),
          durationSeconds: round(eventDuration),
          gain: step.accent,
          probabilityRoll: roll,
        });
      }
    }
    const sequence: TimelineLoopSequenceRecord = {
      id: `timeline-loop-sequence-${this.nextId}`,
      sourceArtifactId: input.sliceMap.sourceArtifactId,
      sourceFingerprint: input.sliceMap.sourceFingerprint,
      sliceMapId: input.sliceMap.id,
      grooveMappingId: input.grooveMapping?.id ?? null,
      bpm,
      configuration,
      steps,
      events,
      durationSeconds: round(steps.length * stepDuration),
      skippedStepIds,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.nextId += 1;
    this.sequences.set(sequence.id, clone(sequence));
    return { accepted: true, sequence: clone(sequence), issues: [] };
  }

  get(id: TimelineId): TimelineLoopSequenceRecord | null {
    const value = this.sequences.get(id);
    return value ? clone(value) : null;
  }

  list(sourceArtifactId?: TimelineId): TimelineLoopSequenceRecord[] {
    return [...this.sequences.values()]
      .filter((value) => !sourceArtifactId || value.sourceArtifactId === sourceArtifactId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  exportArchive(): TimelineLoopSequencingArchive {
    return { sequences: this.list() };
  }

  restoreArchive(archive: TimelineLoopSequencingArchive): void {
    const restored = new Map<TimelineId, TimelineLoopSequenceRecord>();
    let maximumId = 0;
    for (const sequence of archive.sequences) {
      if (restored.has(sequence.id)) throw new Error(`Duplicate sequence id: ${sequence.id}`);
      restored.set(sequence.id, clone(sequence));
      const match = /^timeline-loop-sequence-(\d+)$/.exec(sequence.id);
      if (match) maximumId = Math.max(maximumId, Number(match[1]));
    }
    this.sequences.clear();
    for (const [id, sequence] of restored) this.sequences.set(id, sequence);
    this.nextId = maximumId + 1;
  }
}
