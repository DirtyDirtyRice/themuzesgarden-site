import type {
  TimelineAudioSlice,
  TimelineSliceMapRecord,
} from "./TimelineSliceMapEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineSlicePlaybackMode = "one-shot" | "loop" | "gated";

export type TimelineSlicePlaybackConfiguration = {
  mode: TimelineSlicePlaybackMode;
  repetitions: number;
  gain: number;
  fadeInMilliseconds: number;
  fadeOutMilliseconds: number;
  startAtSeconds: number;
  gateDurationSeconds: number | null;
};

export type TimelineSlicePlaybackInstruction = {
  id: TimelineId;
  sliceId: TimelineId;
  repetition: number;
  sourceStartFrame: number;
  sourceEndFrame: number;
  sourceStartSeconds: number;
  sourceEndSeconds: number;
  timelineStartSeconds: number;
  timelineEndSeconds: number;
  durationSeconds: number;
  gain: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
};

export type TimelineSlicePlaybackPlan = {
  id: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  sliceMapId: TimelineId;
  configuration: TimelineSlicePlaybackConfiguration;
  sliceIds: TimelineId[];
  instructions: TimelineSlicePlaybackInstruction[];
  totalDurationSeconds: number;
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineSlicePlaybackIssue = {
  code:
    | "slice-map-required"
    | "selection-required"
    | "slice-not-found"
    | "configuration-invalid"
    | "slice-invalid"
    | "gate-too-short";
  message: string;
};

export type TimelineSlicePlaybackResult = {
  accepted: boolean;
  plan: TimelineSlicePlaybackPlan | null;
  issues: TimelineSlicePlaybackIssue[];
};

export type TimelineSlicePlaybackArchive = {
  plans: TimelineSlicePlaybackPlan[];
};

const DEFAULT_CONFIGURATION: TimelineSlicePlaybackConfiguration = {
  mode: "one-shot",
  repetitions: 1,
  gain: 1,
  fadeInMilliseconds: 3,
  fadeOutMilliseconds: 3,
  startAtSeconds: 0,
  gateDurationSeconds: null,
};
const clone = <T>(value: T): T => structuredClone(value);
const round = (value: number): number => Math.round(value * 1_000_000) / 1_000_000;

function normalizedConfiguration(
  input?: Partial<TimelineSlicePlaybackConfiguration>,
): TimelineSlicePlaybackConfiguration | null {
  const value = { ...DEFAULT_CONFIGURATION, ...input };
  if (
    !["one-shot", "loop", "gated"].includes(value.mode) ||
    !Number.isInteger(value.repetitions) ||
    value.repetitions < 1 ||
    value.repetitions > 100_000 ||
    !Number.isFinite(value.gain) ||
    value.gain < 0 ||
    value.gain > 4 ||
    !Number.isFinite(value.fadeInMilliseconds) ||
    value.fadeInMilliseconds < 0 ||
    value.fadeInMilliseconds > 10_000 ||
    !Number.isFinite(value.fadeOutMilliseconds) ||
    value.fadeOutMilliseconds < 0 ||
    value.fadeOutMilliseconds > 10_000 ||
    !Number.isFinite(value.startAtSeconds) ||
    value.startAtSeconds < 0 ||
    (
      value.gateDurationSeconds !== null &&
      (
        !Number.isFinite(value.gateDurationSeconds) ||
        value.gateDurationSeconds <= 0
      )
    ) ||
    (value.mode === "gated" && value.gateDurationSeconds === null)
  ) return null;
  if (value.mode === "one-shot") value.repetitions = 1;
  return value;
}

function validateSlice(slice: TimelineAudioSlice, frameCount: number): string | null {
  if (
    !Number.isInteger(slice.startFrame) ||
    !Number.isInteger(slice.endFrame) ||
    slice.startFrame < 0 ||
    slice.endFrame <= slice.startFrame ||
    slice.endFrame > frameCount ||
    !Number.isFinite(slice.durationSeconds) ||
    slice.durationSeconds <= 0
  ) return `Slice ${slice.id} has an invalid source range.`;
  return null;
}

function playbackDuration(
  slice: TimelineAudioSlice,
  configuration: TimelineSlicePlaybackConfiguration,
): number {
  if (configuration.mode !== "gated") return slice.durationSeconds;
  return Math.min(slice.durationSeconds, configuration.gateDurationSeconds!);
}

export class TimelineSlicePlaybackEngine {
  private readonly plans = new Map<TimelineId, TimelineSlicePlaybackPlan>();
  private nextId = 1;

  constructor(private readonly now: () => Date = () => new Date()) {}

  schedule(input: {
    sliceMap: TimelineSliceMapRecord;
    sliceIds: TimelineId[];
    configuration?: Partial<TimelineSlicePlaybackConfiguration>;
    createdBy: TimelineUserId;
  }): TimelineSlicePlaybackResult {
    const issues: TimelineSlicePlaybackIssue[] = [];
    if (!input.sliceMap?.id?.trim()) {
      issues.push({ code: "slice-map-required", message: "A slice map is required." });
    }
    if (!input.sliceIds?.length) {
      issues.push({ code: "selection-required", message: "Select at least one slice." });
    }
    const configuration = normalizedConfiguration(input.configuration);
    if (!configuration) {
      issues.push({
        code: "configuration-invalid",
        message: "Playback configuration is invalid.",
      });
    }
    const sliceIndex = new Map(
      (input.sliceMap?.slices ?? []).map((slice) => [slice.id, slice]),
    );
    const selected: TimelineAudioSlice[] = [];
    for (const sliceId of input.sliceIds ?? []) {
      const slice = sliceIndex.get(sliceId);
      if (!slice) {
        issues.push({ code: "slice-not-found", message: `Slice ${sliceId} was not found.` });
        continue;
      }
      const invalid = validateSlice(slice, input.sliceMap.frameCount);
      if (invalid) {
        issues.push({ code: "slice-invalid", message: invalid });
        continue;
      }
      selected.push(slice);
    }
    if (
      configuration?.mode === "gated" &&
      selected.some((slice) =>
        configuration.gateDurationSeconds! <
        1 / input.sliceMap.sampleRate
      )
    ) {
      issues.push({
        code: "gate-too-short",
        message: "Gate duration must be at least one source sample.",
      });
    }
    if (issues.length || !configuration) {
      return { accepted: false, plan: null, issues };
    }

    const instructions: TimelineSlicePlaybackInstruction[] = [];
    let cursor = configuration.startAtSeconds;
    const repetitions = configuration.mode === "one-shot"
      ? 1
      : configuration.repetitions;
    for (let repetition = 0; repetition < repetitions; repetition += 1) {
      for (const slice of selected) {
        const duration = playbackDuration(slice, configuration);
        const maximumFade = duration / 2;
        const fadeIn = Math.min(
          configuration.fadeInMilliseconds / 1_000,
          maximumFade,
        );
        const fadeOut = Math.min(
          configuration.fadeOutMilliseconds / 1_000,
          maximumFade,
        );
        instructions.push({
          id: `timeline-slice-playback-${this.nextId}-instruction-${instructions.length + 1}`,
          sliceId: slice.id,
          repetition,
          sourceStartFrame: slice.startFrame,
          sourceEndFrame: Math.min(
            slice.endFrame,
            slice.startFrame + Math.round(duration * input.sliceMap.sampleRate),
          ),
          sourceStartSeconds: slice.startSeconds,
          sourceEndSeconds: round(slice.startSeconds + duration),
          timelineStartSeconds: round(cursor),
          timelineEndSeconds: round(cursor + duration),
          durationSeconds: round(duration),
          gain: configuration.gain,
          fadeInSeconds: round(fadeIn),
          fadeOutSeconds: round(fadeOut),
        });
        cursor += duration;
      }
    }
    const plan: TimelineSlicePlaybackPlan = {
      id: `timeline-slice-playback-${this.nextId}`,
      sourceArtifactId: input.sliceMap.sourceArtifactId,
      sourceFingerprint: input.sliceMap.sourceFingerprint,
      sliceMapId: input.sliceMap.id,
      configuration,
      sliceIds: [...input.sliceIds],
      instructions,
      totalDurationSeconds: round(cursor - configuration.startAtSeconds),
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.nextId += 1;
    this.plans.set(plan.id, clone(plan));
    return { accepted: true, plan: clone(plan), issues: [] };
  }

  get(id: TimelineId): TimelineSlicePlaybackPlan | null {
    const value = this.plans.get(id);
    return value ? clone(value) : null;
  }

  list(sourceArtifactId?: TimelineId): TimelineSlicePlaybackPlan[] {
    return [...this.plans.values()]
      .filter((value) => !sourceArtifactId || value.sourceArtifactId === sourceArtifactId)
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  exportArchive(): TimelineSlicePlaybackArchive {
    return { plans: this.list() };
  }

  restoreArchive(archive: TimelineSlicePlaybackArchive): void {
    const restored = new Map<TimelineId, TimelineSlicePlaybackPlan>();
    let maximumId = 0;
    for (const plan of archive.plans) {
      if (restored.has(plan.id)) throw new Error(`Duplicate playback plan id: ${plan.id}`);
      restored.set(plan.id, clone(plan));
      const match = /^timeline-slice-playback-(\d+)$/.exec(plan.id);
      if (match) maximumId = Math.max(maximumId, Number(match[1]));
    }
    this.plans.clear();
    for (const [id, plan] of restored) this.plans.set(id, plan);
    this.nextId = maximumId + 1;
  }
}
