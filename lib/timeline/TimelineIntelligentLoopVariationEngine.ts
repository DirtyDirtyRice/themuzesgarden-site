import type {
  TimelineLoopSequenceRecord,
  TimelineLoopSequenceStep,
} from "./TimelineLoopSequencingEngine";
import type { TimelineId, TimelineUserId } from "./TimelineTypes";

export type TimelineLoopVariationGoal = "subtle" | "balanced" | "bold";

export type TimelineLoopVariationConfiguration = {
  variationCount: number;
  seed: number;
  goal: TimelineLoopVariationGoal;
  preserveDownbeats: boolean;
  maximumChangedSteps: number;
};

export type TimelineLoopVariationChange = {
  step: number;
  kind: "slice" | "probability" | "accent" | "repeat";
  before: string | number | null;
  after: string | number | null;
  reason: string;
};

export type TimelineLoopVariationCandidate = {
  id: TimelineId;
  rank: number;
  seed: number;
  pattern: TimelineLoopSequenceStep[];
  changes: TimelineLoopVariationChange[];
  changedStepCount: number;
  continuityScore: number;
  noveltyScore: number;
  confidence: number;
};

export type TimelineIntelligentLoopVariationRecord = {
  id: TimelineId;
  sourceSequenceId: TimelineId;
  sourceArtifactId: TimelineId;
  sourceFingerprint: string;
  sliceMapId: TimelineId;
  configuration: TimelineLoopVariationConfiguration;
  candidates: TimelineLoopVariationCandidate[];
  createdAt: string;
  createdBy: TimelineUserId;
};

export type TimelineIntelligentLoopVariationIssue = {
  code:
    | "sequence-required"
    | "sequence-invalid"
    | "configuration-invalid"
    | "variation-impossible";
  message: string;
};

export type TimelineIntelligentLoopVariationResult = {
  accepted: boolean;
  variation: TimelineIntelligentLoopVariationRecord | null;
  issues: TimelineIntelligentLoopVariationIssue[];
};

export type TimelineIntelligentLoopVariationArchive = {
  variations: TimelineIntelligentLoopVariationRecord[];
};

const DEFAULT_CONFIGURATION: TimelineLoopVariationConfiguration = {
  variationCount: 4,
  seed: 1,
  goal: "balanced",
  preserveDownbeats: true,
  maximumChangedSteps: 8,
};
const clone = <T>(value: T): T => structuredClone(value);
const round = (value: number): number =>
  Math.round(value * 1_000_000) / 1_000_000;

function normalizeConfiguration(
  input: Partial<TimelineLoopVariationConfiguration> | undefined,
  stepCount: number,
): TimelineLoopVariationConfiguration | null {
  const value = { ...DEFAULT_CONFIGURATION, ...input };
  if (
    !Number.isInteger(value.variationCount) ||
    value.variationCount < 1 ||
    value.variationCount > 128 ||
    !Number.isInteger(value.seed) ||
    value.seed < 0 ||
    value.seed > 0x7fffffff ||
    !["subtle", "balanced", "bold"].includes(value.goal) ||
    typeof value.preserveDownbeats !== "boolean" ||
    !Number.isInteger(value.maximumChangedSteps) ||
    value.maximumChangedSteps < 1 ||
    value.maximumChangedSteps > stepCount
  ) return null;
  return value;
}

function validateSequence(sequence: TimelineLoopSequenceRecord): string | null {
  const expectedSteps =
    sequence.configuration.beatsPerBar *
    sequence.configuration.subdivisionsPerBeat *
    sequence.configuration.bars;
  if (
    !sequence.id?.trim() ||
    !sequence.sourceArtifactId?.trim() ||
    !sequence.sourceFingerprint?.trim() ||
    !sequence.sliceMapId?.trim() ||
    sequence.steps.length !== expectedSteps ||
    sequence.steps.some((step, index) =>
      step.step !== index ||
      !Number.isFinite(step.probability) ||
      step.probability < 0 ||
      step.probability > 1 ||
      !Number.isFinite(step.accent) ||
      step.accent < 0 ||
      step.accent > 4 ||
      !Number.isInteger(step.repeat) ||
      step.repeat < 1 ||
      step.repeat > 128
    )
  ) return "The source sequence is malformed or incomplete.";
  return null;
}

function random(seed: number, index: number): number {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 0x100000000;
}

function intensity(goal: TimelineLoopVariationGoal): number {
  if (goal === "subtle") return 0.25;
  if (goal === "bold") return 0.8;
  return 0.5;
}

function eligibleIndices(
  sequence: TimelineLoopSequenceRecord,
  preserveDownbeats: boolean,
): number[] {
  return sequence.steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) =>
      !preserveDownbeats ||
      step.subdivision !== 0 ||
      step.beat !== 1
    )
    .map(({ index }) => index);
}

function addChange(
  changes: TimelineLoopVariationChange[],
  step: number,
  kind: TimelineLoopVariationChange["kind"],
  before: TimelineLoopVariationChange["before"],
  after: TimelineLoopVariationChange["after"],
  reason: string,
): void {
  if (before === after) return;
  changes.push({ step, kind, before, after, reason });
}

export class TimelineIntelligentLoopVariationEngine {
  private readonly variations =
    new Map<TimelineId, TimelineIntelligentLoopVariationRecord>();
  private nextId = 1;

  constructor(private readonly now: () => Date = () => new Date()) {}

  create(input: {
    sequence: TimelineLoopSequenceRecord;
    configuration?: Partial<TimelineLoopVariationConfiguration>;
    createdBy: TimelineUserId;
  }): TimelineIntelligentLoopVariationResult {
    const issues: TimelineIntelligentLoopVariationIssue[] = [];
    if (!input.sequence?.id?.trim()) {
      issues.push({
        code: "sequence-required",
        message: "A source loop sequence is required.",
      });
    }
    const sequenceIssue = input.sequence
      ? validateSequence(input.sequence)
      : null;
    if (sequenceIssue) {
      issues.push({ code: "sequence-invalid", message: sequenceIssue });
    }
    const configuration = input.sequence
      ? normalizeConfiguration(input.configuration, input.sequence.steps.length)
      : null;
    if (!configuration) {
      issues.push({
        code: "configuration-invalid",
        message: "Variation configuration is invalid.",
      });
    }
    const eligible = input.sequence && configuration
      ? eligibleIndices(input.sequence, configuration.preserveDownbeats)
      : [];
    const slicePool = input.sequence
      ? [...new Set(
          input.sequence.steps
            .map((step) => step.sliceId)
            .filter((id): id is TimelineId => id !== null),
        )]
      : [];
    if (
      input.sequence &&
      configuration &&
      (!eligible.length || !slicePool.length)
    ) {
      issues.push({
        code: "variation-impossible",
        message: "The loop has no eligible steps or playable slices to vary.",
      });
    }
    if (issues.length || !configuration) {
      return { accepted: false, variation: null, issues };
    }

    const candidates: TimelineLoopVariationCandidate[] = [];
    const strength = intensity(configuration.goal);
    for (
      let candidateIndex = 0;
      candidateIndex < configuration.variationCount;
      candidateIndex += 1
    ) {
      const candidateSeed =
        (configuration.seed + Math.imul(candidateIndex + 1, 104_729)) &
        0x7fffffff;
      const pattern = clone(input.sequence.steps);
      const changes: TimelineLoopVariationChange[] = [];
      const desiredChanges = Math.max(
        1,
        Math.min(
          configuration.maximumChangedSteps,
          eligible.length,
          Math.round(
            eligible.length * strength *
            (0.75 + random(candidateSeed, 0) * 0.5),
          ),
        ),
      );
      const selected = [...eligible]
        .sort((left, right) =>
          random(candidateSeed, left + 1) -
          random(candidateSeed, right + 1)
        )
        .slice(0, desiredChanges);

      selected.forEach((stepIndex, selectionIndex) => {
        const step = pattern[stepIndex];
        const choice = Math.floor(
          random(candidateSeed, stepIndex + selectionIndex + 10_000) * 4,
        );
        if (choice === 0) {
          const before = step.sliceId;
          const poolIndex = Math.floor(
            random(candidateSeed, stepIndex + 20_000) * slicePool.length,
          );
          let after: TimelineId | null = slicePool[poolIndex] ?? before;
          if (after === before && slicePool.length > 1) {
            after = slicePool[(poolIndex + 1) % slicePool.length];
          } else if (after === before && configuration.goal === "bold") {
            after = null;
          }
          step.sliceId = after;
          addChange(
            changes,
            stepIndex,
            "slice",
            before,
            after,
            "Revoiced the step using the loop's proven slice vocabulary.",
          );
        } else if (choice === 1) {
          const before = step.probability;
          const direction = random(candidateSeed, stepIndex + 30_000) > 0.5
            ? 1
            : -1;
          step.probability = round(Math.max(
            0.1,
            Math.min(1, before + direction * strength * 0.35),
          ));
          addChange(
            changes,
            stepIndex,
            "probability",
            before,
            step.probability,
            "Adjusted event certainty to create a repeatable evolving pattern.",
          );
        } else if (choice === 2) {
          const before = step.accent;
          const movement =
            (random(candidateSeed, stepIndex + 40_000) * 2 - 1) *
            strength;
          step.accent = round(Math.max(0, Math.min(4, before + movement)));
          addChange(
            changes,
            stepIndex,
            "accent",
            before,
            step.accent,
            "Reshaped dynamics while retaining the source groove timing.",
          );
        } else {
          const before = step.repeat;
          const direction = random(candidateSeed, stepIndex + 50_000) > 0.5
            ? 1
            : -1;
          step.repeat = Math.max(
            1,
            Math.min(8, before + direction),
          );
          addChange(
            changes,
            stepIndex,
            "repeat",
            before,
            step.repeat,
            "Changed retrigger density without altering source audio.",
          );
        }
      });

      if (!changes.length) {
        const stepIndex = selected[0];
        const step = pattern[stepIndex];
        const before = step.accent;
        step.accent = round(before === 4
          ? Math.max(0, before - 0.1)
          : Math.min(4, before + 0.1));
        addChange(
          changes,
          stepIndex,
          "accent",
          before,
          step.accent,
          "Applied a minimal deterministic accent variation.",
        );
      }

      const changedSteps = new Set(changes.map((change) => change.step)).size;
      const noveltyScore = round(changedSteps / input.sequence.steps.length);
      const continuityScore = round(1 - noveltyScore);
      const targetNovelty = strength;
      const confidence = round(Math.max(
        0,
        1 - Math.abs(noveltyScore - targetNovelty),
      ));
      candidates.push({
        id: `timeline-loop-variation-${this.nextId}-candidate-${candidateIndex + 1}`,
        rank: 0,
        seed: candidateSeed,
        pattern,
        changes,
        changedStepCount: changedSteps,
        continuityScore,
        noveltyScore,
        confidence,
      });
    }
    candidates.sort((left, right) =>
      right.confidence - left.confidence ||
      right.noveltyScore - left.noveltyScore ||
      left.id.localeCompare(right.id)
    );
    candidates.forEach((candidate, index) => {
      candidate.rank = index + 1;
    });

    const variation: TimelineIntelligentLoopVariationRecord = {
      id: `timeline-loop-variation-${this.nextId}`,
      sourceSequenceId: input.sequence.id,
      sourceArtifactId: input.sequence.sourceArtifactId,
      sourceFingerprint: input.sequence.sourceFingerprint,
      sliceMapId: input.sequence.sliceMapId,
      configuration,
      candidates,
      createdAt: this.now().toISOString(),
      createdBy: input.createdBy,
    };
    this.nextId += 1;
    this.variations.set(variation.id, clone(variation));
    return { accepted: true, variation: clone(variation), issues: [] };
  }

  get(id: TimelineId): TimelineIntelligentLoopVariationRecord | null {
    const value = this.variations.get(id);
    return value ? clone(value) : null;
  }

  list(sourceSequenceId?: TimelineId): TimelineIntelligentLoopVariationRecord[] {
    return [...this.variations.values()]
      .filter((value) =>
        !sourceSequenceId || value.sourceSequenceId === sourceSequenceId
      )
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(clone);
  }

  exportArchive(): TimelineIntelligentLoopVariationArchive {
    return { variations: this.list() };
  }

  restoreArchive(archive: TimelineIntelligentLoopVariationArchive): void {
    const restored =
      new Map<TimelineId, TimelineIntelligentLoopVariationRecord>();
    let maximumId = 0;
    for (const variation of archive.variations) {
      if (restored.has(variation.id)) {
        throw new Error(`Duplicate loop variation id: ${variation.id}`);
      }
      restored.set(variation.id, clone(variation));
      const match = /^timeline-loop-variation-(\d+)$/.exec(variation.id);
      if (match) maximumId = Math.max(maximumId, Number(match[1]));
    }
    this.variations.clear();
    for (const [id, variation] of restored) {
      this.variations.set(id, variation);
    }
    this.nextId = maximumId + 1;
  }
}
