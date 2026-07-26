import type { TimelineSliceMapRecord } from "./TimelineSliceMapEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineSliceTransformOperation =
  | { type: "reverse" }
  | { type: "gain"; decibels: number }
  | { type: "fade"; fadeInMilliseconds: number; fadeOutMilliseconds: number }
  | { type: "pitch-shift"; semitones: number }
  | { type: "time-stretch"; ratio: number }
  | { type: "filter"; kind: "low-pass" | "high-pass"; frequencyHz: number; resonance: number }
  | { type: "envelope"; attackMilliseconds: number; decayMilliseconds: number; sustain: number; releaseMilliseconds: number };

export type TimelineValidatedSliceTransform = TimelineSliceTransformOperation & {
  id: TimelineId;
  order: number;
};

export type TimelineSliceTransformationRecipe = {
  id: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  sliceMapId: TimelineId;
  sliceId: TimelineId;
  sourceStartFrame: number;
  sourceEndFrame: number;
  sourceDurationSeconds: number;
  outputDurationSeconds: number;
  operations: TimelineValidatedSliceTransform[];
  renderRequired: boolean;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineSliceTransformationIssue = {
  code:
    | "slice-map-required"
    | "slice-required"
    | "slice-not-found"
    | "operations-required"
    | "operation-invalid"
    | "duration-invalid";
  message: string;
  operationIndex?: number;
};

export type TimelineSliceTransformationResult = {
  accepted: boolean;
  recipe: TimelineSliceTransformationRecipe | null;
  issues: TimelineSliceTransformationIssue[];
};

export type TimelineSliceTransformationArchive = {
  recipes: TimelineSliceTransformationRecipe[];
};

const clone = <T>(value: T): T => structuredClone(value);
const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

function validateOperation(
  operation: TimelineSliceTransformOperation,
  durationSeconds: number,
  sampleRate: number,
): string | null {
  switch (operation.type) {
    case "reverse":
      return null;
    case "gain":
      return Number.isFinite(operation.decibels) &&
        operation.decibels >= -96 && operation.decibels <= 24
        ? null : "Gain must be between -96 dB and +24 dB.";
    case "fade":
      return Number.isFinite(operation.fadeInMilliseconds) &&
        Number.isFinite(operation.fadeOutMilliseconds) &&
        operation.fadeInMilliseconds >= 0 &&
        operation.fadeOutMilliseconds >= 0 &&
        operation.fadeInMilliseconds + operation.fadeOutMilliseconds <=
          durationSeconds * 1_000
        ? null : "Combined fades cannot exceed the slice duration.";
    case "pitch-shift":
      return Number.isFinite(operation.semitones) &&
        operation.semitones >= -48 && operation.semitones <= 48
        ? null : "Pitch shift must be between -48 and +48 semitones.";
    case "time-stretch":
      return Number.isFinite(operation.ratio) &&
        operation.ratio >= 0.125 && operation.ratio <= 8
        ? null : "Time-stretch ratio must be between 0.125 and 8.";
    case "filter":
      return Number.isFinite(operation.frequencyHz) &&
        operation.frequencyHz >= 20 &&
        operation.frequencyHz < sampleRate / 2 &&
        Number.isFinite(operation.resonance) &&
        operation.resonance >= 0.1 &&
        operation.resonance <= 30
        ? null : "Filter frequency or resonance is outside safe bounds.";
    case "envelope":
      return [
        operation.attackMilliseconds,
        operation.decayMilliseconds,
        operation.releaseMilliseconds,
      ].every((value) => Number.isFinite(value) && value >= 0) &&
        Number.isFinite(operation.sustain) &&
        operation.sustain >= 0 &&
        operation.sustain <= 1 &&
        operation.attackMilliseconds +
          operation.decayMilliseconds +
          operation.releaseMilliseconds <= durationSeconds * 1_000
        ? null : "Envelope stages exceed safe bounds or slice duration.";
    default:
      return "Unknown transformation operation.";
  }
}

export class TimelineSliceTransformationEngine {
  private readonly recipes = new Map<TimelineId, TimelineSliceTransformationRecipe>();
  private nextId = 1;

  constructor(private readonly now: () => Date = () => new Date()) {}

  create(input: {
    sliceMap: TimelineSliceMapRecord;
    sliceId: TimelineId;
    operations: TimelineSliceTransformOperation[];
    createdBy: TimelineUserId;
  }): TimelineSliceTransformationResult {
    const issues: TimelineSliceTransformationIssue[] = [];
    if (!input.sliceMap?.id?.trim()) {
      issues.push({ code: "slice-map-required", message: "A slice map is required." });
    }
    if (!input.sliceId?.trim()) {
      issues.push({ code: "slice-required", message: "A slice identity is required." });
    }
    if (!input.operations?.length) {
      issues.push({ code: "operations-required", message: "At least one transformation is required." });
    }
    const slice = input.sliceMap?.slices.find((value) => value.id === input.sliceId);
    if (input.sliceId?.trim() && !slice) {
      issues.push({ code: "slice-not-found", message: `Slice ${input.sliceId} was not found.` });
    }
    if (slice) {
      input.operations.forEach((operation, index) => {
        const message = validateOperation(
          operation,
          slice.durationSeconds,
          input.sliceMap.sampleRate,
        );
        if (message) issues.push({
          code: "operation-invalid",
          message,
          operationIndex: index,
        });
      });
    }
    if (issues.length || !slice) {
      return { accepted: false, recipe: null, issues };
    }
    let outputDurationSeconds = slice.durationSeconds;
    for (const operation of input.operations) {
      if (operation.type === "time-stretch") {
        outputDurationSeconds *= operation.ratio;
      }
    }
    if (
      !Number.isFinite(outputDurationSeconds) ||
      outputDurationSeconds < 1 / input.sliceMap.sampleRate ||
      outputDurationSeconds > 60 * 60
    ) {
      return {
        accepted: false,
        recipe: null,
        issues: [{
          code: "duration-invalid",
          message: "The transformation chain produces an unsafe output duration.",
        }],
      };
    }
    const recipe: TimelineSliceTransformationRecipe = {
      id: `timeline-slice-transformation-${this.nextId}`,
      sourceArtifactId: input.sliceMap.sourceArtifactId,
      sourceFingerprint: input.sliceMap.sourceFingerprint,
      sliceMapId: input.sliceMap.id,
      sliceId: slice.id,
      sourceStartFrame: slice.startFrame,
      sourceEndFrame: slice.endFrame,
      sourceDurationSeconds: slice.durationSeconds,
      outputDurationSeconds: round(outputDurationSeconds),
      operations: input.operations.map((operation, index) => ({
        ...clone(operation),
        id: `timeline-slice-transformation-${this.nextId}-operation-${index + 1}`,
        order: index,
      })),
      renderRequired: input.operations.some((operation) =>
        operation.type === "pitch-shift" ||
        operation.type === "time-stretch" ||
        operation.type === "filter"
      ),
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.nextId += 1;
    this.recipes.set(recipe.id, clone(recipe));
    return { accepted: true, recipe: clone(recipe), issues: [] };
  }

  get(id: TimelineId): TimelineSliceTransformationRecipe | null {
    const value = this.recipes.get(id);
    return value ? clone(value) : null;
  }

  list(sourceArtifactId?: TimelineId): TimelineSliceTransformationRecipe[] {
    return [...this.recipes.values()]
      .filter((value) => !sourceArtifactId || value.sourceArtifactId === sourceArtifactId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  exportArchive(): TimelineSliceTransformationArchive {
    return { recipes: this.list() };
  }

  restoreArchive(archive: TimelineSliceTransformationArchive): void {
    const restored = new Map<TimelineId, TimelineSliceTransformationRecipe>();
    let maximumId = 0;
    for (const recipe of archive.recipes) {
      if (restored.has(recipe.id)) throw new Error(`Duplicate transformation id: ${recipe.id}`);
      restored.set(recipe.id, clone(recipe));
      const match = /^timeline-slice-transformation-(\d+)$/.exec(recipe.id);
      if (match) maximumId = Math.max(maximumId, Number(match[1]));
    }
    this.recipes.clear();
    for (const [id, recipe] of restored) this.recipes.set(id, recipe);
    this.nextId = maximumId + 1;
  }
}
