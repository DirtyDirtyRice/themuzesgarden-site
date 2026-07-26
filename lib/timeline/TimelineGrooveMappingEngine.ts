import type {
  TimelineAudioSlice,
  TimelineSliceMapRecord,
} from "./TimelineSliceMapEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineGrooveMappingConfiguration = {
  subdivisionsPerBeat: 2 | 3 | 4 | 6 | 8;
  maximumTimingOffsetMilliseconds: number;
  minimumSlices: number;
  accentNormalization: "boundary-confidence" | "uniform";
};

export type TimelineGrooveStep = {
  id: TimelineId;
  sliceId: TimelineId;
  step: number;
  beat: number;
  subdivision: number;
  expectedSeconds: number;
  actualSeconds: number;
  offsetMilliseconds: number;
  normalizedOffset: number;
  accent: number;
};

export type TimelineGrooveTemplate = {
  subdivisionsPerBeat: number;
  cycleBeats: number;
  offsets: number[];
  accents: number[];
  swingRatio: number | null;
};

export type TimelineGrooveMappingRecord = {
  id: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  sliceMapId: TimelineId;
  bpm: number;
  configuration: TimelineGrooveMappingConfiguration;
  steps: TimelineGrooveStep[];
  template: TimelineGrooveTemplate;
  timingSpreadMilliseconds: number;
  confidence: number;
  ambiguous: boolean;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineGrooveMappingIssue = {
  code:
    | "slice-map-required"
    | "tempo-required"
    | "configuration-invalid"
    | "slice-map-invalid"
    | "insufficient-evidence";
  message: string;
};

export type TimelineGrooveMappingResult = {
  accepted: boolean;
  groove: TimelineGrooveMappingRecord | null;
  issues: TimelineGrooveMappingIssue[];
};

export type TimelineGrooveMappingArchive = {
  grooves: TimelineGrooveMappingRecord[];
};

const DEFAULT_CONFIGURATION: TimelineGrooveMappingConfiguration = {
  subdivisionsPerBeat: 2,
  maximumTimingOffsetMilliseconds: 125,
  minimumSlices: 4,
  accentNormalization: "boundary-confidence",
};
const clone = <T>(value: T): T => structuredClone(value);
const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

function normalizeConfiguration(
  input?: Partial<TimelineGrooveMappingConfiguration>,
): TimelineGrooveMappingConfiguration | null {
  const value = { ...DEFAULT_CONFIGURATION, ...input };
  if (
    ![2, 3, 4, 6, 8].includes(value.subdivisionsPerBeat) ||
    !Number.isFinite(value.maximumTimingOffsetMilliseconds) ||
    value.maximumTimingOffsetMilliseconds < 1 ||
    value.maximumTimingOffsetMilliseconds > 1_000 ||
    !Number.isInteger(value.minimumSlices) ||
    value.minimumSlices < 2 ||
    value.minimumSlices > 10_000 ||
    !["boundary-confidence", "uniform"].includes(value.accentNormalization)
  ) return null;
  return value;
}

function validateSlices(sliceMap: TimelineSliceMapRecord): string | null {
  let previousEnd = 0;
  for (const [index, slice] of sliceMap.slices.entries()) {
    if (
      slice.index !== index ||
      !Number.isInteger(slice.startFrame) ||
      !Number.isInteger(slice.endFrame) ||
      slice.startFrame < previousEnd ||
      slice.endFrame <= slice.startFrame ||
      slice.endFrame > sliceMap.frameCount ||
      !Number.isFinite(slice.startSeconds) ||
      !Number.isFinite(slice.endSeconds)
    ) return "Slice map contains malformed or overlapping frame ranges.";
    previousEnd = slice.endFrame;
  }
  return null;
}

function accentFor(
  slice: TimelineAudioSlice,
  mode: TimelineGrooveMappingConfiguration["accentNormalization"],
): number {
  if (mode === "uniform") return 1;
  return round(Math.max(
    0,
    Math.min(1, (
      slice.openingBoundary.confidence +
      slice.closingBoundary.confidence
    ) / 2),
  ));
}

function standardDeviation(values: number[]): number {
  if (!values.length) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      values.length,
  );
}

function swingRatio(
  steps: TimelineGrooveStep[],
  subdivisionsPerBeat: number,
): number | null {
  if (subdivisionsPerBeat !== 2) return null;
  const byBeat = new Map<number, TimelineGrooveStep[]>();
  for (const step of steps) {
    const beat = Math.floor(step.beat);
    const values = byBeat.get(beat) ?? [];
    values.push(step);
    byBeat.set(beat, values);
  }
  const ratios: number[] = [];
  for (const values of byBeat.values()) {
    const first = values.find((value) => value.subdivision === 0);
    const second = values.find((value) => value.subdivision === 1);
    if (!first || !second) continue;
    const nextBeat = first.expectedSeconds + 60 / (
      (second.expectedSeconds - first.expectedSeconds) * 2 * 60
    );
    const firstDuration = second.actualSeconds - first.actualSeconds;
    const fullBeatDuration = nextBeat - first.actualSeconds;
    const secondDuration = fullBeatDuration - firstDuration;
    if (firstDuration > 0 && secondDuration > 0) {
      ratios.push(firstDuration / secondDuration);
    }
  }
  if (!ratios.length) return null;
  return round(ratios.reduce((sum, value) => sum + value, 0) / ratios.length);
}

export class TimelineGrooveMappingEngine {
  private readonly grooves = new Map<TimelineId, TimelineGrooveMappingRecord>();
  private nextId = 1;

  constructor(private readonly now: () => Date = () => new Date()) {}

  create(input: {
    sliceMap: TimelineSliceMapRecord;
    configuration?: Partial<TimelineGrooveMappingConfiguration>;
    createdBy: TimelineUserId;
  }): TimelineGrooveMappingResult {
    const issues: TimelineGrooveMappingIssue[] = [];
    if (!input.sliceMap?.id?.trim()) {
      issues.push({ code: "slice-map-required", message: "A slice map is required." });
    }
    if (!input.sliceMap?.tempo || input.sliceMap.tempo.bpm <= 0) {
      issues.push({
        code: "tempo-required",
        message: "A trusted tempo is required before groove mapping.",
      });
    }
    const configuration = normalizeConfiguration(input.configuration);
    if (!configuration) {
      issues.push({ code: "configuration-invalid", message: "Groove configuration is invalid." });
    }
    const sliceIssue = input.sliceMap ? validateSlices(input.sliceMap) : null;
    if (sliceIssue) {
      issues.push({ code: "slice-map-invalid", message: sliceIssue });
    }
    if (
      input.sliceMap &&
      configuration &&
      input.sliceMap.slices.length < configuration.minimumSlices
    ) {
      issues.push({
        code: "insufficient-evidence",
        message: `At least ${configuration.minimumSlices} slices are required.`,
      });
    }
    if (issues.length || !configuration || !input.sliceMap.tempo) {
      return { accepted: false, groove: null, issues };
    }

    const bpm = input.sliceMap.tempo.bpm;
    const secondsPerBeat = 60 / bpm;
    const secondsPerStep = secondsPerBeat / configuration.subdivisionsPerBeat;
    const steps = input.sliceMap.slices.map((slice, index) => {
      const nearestStep = Math.round(slice.startSeconds / secondsPerStep);
      const expectedSeconds = nearestStep * secondsPerStep;
      const rawOffset = (slice.startSeconds - expectedSeconds) * 1_000;
      const offsetMilliseconds = Math.max(
        -configuration.maximumTimingOffsetMilliseconds,
        Math.min(configuration.maximumTimingOffsetMilliseconds, rawOffset),
      );
      return {
        id: `timeline-groove-${this.nextId}-step-${index + 1}`,
        sliceId: slice.id,
        step: nearestStep,
        beat: round(nearestStep / configuration.subdivisionsPerBeat),
        subdivision: nearestStep % configuration.subdivisionsPerBeat,
        expectedSeconds: round(expectedSeconds),
        actualSeconds: slice.startSeconds,
        offsetMilliseconds: round(offsetMilliseconds),
        normalizedOffset: round(offsetMilliseconds / (secondsPerStep * 1_000)),
        accent: accentFor(slice, configuration.accentNormalization),
      };
    });
    const offsets = steps.map((value) => value.offsetMilliseconds);
    const timingSpreadMilliseconds = round(standardDeviation(offsets));
    const evidenceFactor = Math.min(1, steps.length / 16);
    const clippingFactor = steps.filter((value) =>
      Math.abs(value.offsetMilliseconds) >=
      configuration.maximumTimingOffsetMilliseconds
    ).length / steps.length;
    const confidence = round(Math.max(0, evidenceFactor * (1 - clippingFactor)));
    const cycleSteps = configuration.subdivisionsPerBeat * 4;
    const templateOffsets = new Array<number>(cycleSteps).fill(0);
    const templateAccents = new Array<number>(cycleSteps).fill(0);
    const counts = new Array<number>(cycleSteps).fill(0);
    for (const step of steps) {
      const position = ((step.step % cycleSteps) + cycleSteps) % cycleSteps;
      templateOffsets[position] += step.normalizedOffset;
      templateAccents[position] += step.accent;
      counts[position] += 1;
    }
    for (let index = 0; index < cycleSteps; index += 1) {
      if (counts[index]) {
        templateOffsets[index] = round(templateOffsets[index] / counts[index]);
        templateAccents[index] = round(templateAccents[index] / counts[index]);
      }
    }
    const record: TimelineGrooveMappingRecord = {
      id: `timeline-groove-${this.nextId}`,
      sourceArtifactId: input.sliceMap.sourceArtifactId,
      sourceFingerprint: input.sliceMap.sourceFingerprint,
      sliceMapId: input.sliceMap.id,
      bpm,
      configuration,
      steps,
      template: {
        subdivisionsPerBeat: configuration.subdivisionsPerBeat,
        cycleBeats: 4,
        offsets: templateOffsets,
        accents: templateAccents,
        swingRatio: swingRatio(steps, configuration.subdivisionsPerBeat),
      },
      timingSpreadMilliseconds,
      confidence,
      ambiguous: confidence < 0.5 || steps.length < 8,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.nextId += 1;
    this.grooves.set(record.id, clone(record));
    return { accepted: true, groove: clone(record), issues: [] };
  }

  get(id: TimelineId): TimelineGrooveMappingRecord | null {
    const value = this.grooves.get(id);
    return value ? clone(value) : null;
  }

  list(sourceArtifactId?: TimelineId): TimelineGrooveMappingRecord[] {
    return [...this.grooves.values()]
      .filter((value) => !sourceArtifactId || value.sourceArtifactId === sourceArtifactId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  exportArchive(): TimelineGrooveMappingArchive {
    return { grooves: this.list() };
  }

  restoreArchive(archive: TimelineGrooveMappingArchive): void {
    const restored = new Map<TimelineId, TimelineGrooveMappingRecord>();
    let maximumId = 0;
    for (const groove of archive.grooves) {
      if (restored.has(groove.id)) throw new Error(`Duplicate groove id: ${groove.id}`);
      restored.set(groove.id, clone(groove));
      const match = /^timeline-groove-(\d+)$/.exec(groove.id);
      if (match) maximumId = Math.max(maximumId, Number(match[1]));
    }
    this.grooves.clear();
    for (const [id, groove] of restored) this.grooves.set(id, groove);
    this.nextId = maximumId + 1;
  }
}
