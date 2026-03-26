import type { AnyTrack, TrackSection } from "./playerTypes";
import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";
import type {
  IntendedActionPlan,
  IntendedActionResult,
} from "./playerMomentIntendedActions";
import type {
  IntendedRepeatFamilyPlan,
  IntendedRepeatResult,
} from "./playerMomentIntendedRepeat";
import type {
  PhraseDriftEngineResult,
  PhraseDriftFamilyResult,
} from "./playerMomentPhraseDrift";
import type {
  MomentFamily,
  MomentSimilarityComparable,
  RepeatPlan,
} from "./playerMomentSimilarityTypes";

import { buildRepeatPlan } from "./playerMomentRepeatPlanner";

import type {
  BuildMomentInspectorSimilarityResult,
  InspectorComparableMoment,
} from "./momentInspectorSimilarity.types";

type PhraseStabilityLabel = "solid" | "good" | "fragile" | "unstable";

type PhraseStabilityIssueFlag =
  | "missing-repeats"
  | "near-repeats"
  | "timing-drift"
  | "duration-drift"
  | "high-severity-drift"
  | "low-confidence";

type PhraseStabilityFamilyResult = {
  familyId: string;
  anchorMomentId: string;
  stabilityScore: number;
  stabilityLabel: PhraseStabilityLabel;
  timingConsistency: number;
  durationConsistency: number;
  repeatCoverage: number;
  structuralConfidence: number;
  highestDriftSeverity: "none" | "low" | "medium" | "high";
  issueFlags: PhraseStabilityIssueFlag[];
};

type PhraseStabilityEngineResult = {
  families: PhraseStabilityFamilyResult[];
  byFamilyId: Record<string, PhraseStabilityFamilyResult>;
};

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function round3(value: number): number {
  return Number(value.toFixed(3));
}

export function normalizeStart(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function normalizeEnd(section: TrackSection): number | null {
  const end = Number((section as { end?: unknown })?.end);
  if (Number.isFinite(end) && end >= 0) return end;

  const duration = Number((section as { duration?: unknown })?.duration);
  const start = normalizeStart(section.start);
  if (Number.isFinite(duration) && duration > 0) return start + duration;

  return null;
}

export function getDuration(section: TrackSection): number | null {
  const start = normalizeStart(section.start);
  const end = normalizeEnd(section);
  if (end === null || end < start) return null;
  return round3(end - start);
}

export function getTagList(section: TrackSection): string[] {
  return Array.isArray(section?.tags)
    ? section.tags.map((tag) => normalizeText(tag)).filter(Boolean)
    : [];
}

export function buildStructuralStrength(section: TrackSection): number {
  const description = normalizeText(section?.description);
  const tags = getTagList(section);
  const start = Number.isFinite(Number(section?.start));
  const duration = getDuration(section);

  let score = 0.2;
  if (description) score += 0.3;
  if (tags.length > 0) score += Math.min(0.3, tags.length * 0.08);
  if (start) score += 0.1;
  if (duration !== null && duration > 0) score += 0.1;

  return round3(clamp01(score));
}

export function buildTimingClusterKey(startTime: number): string {
  return `cluster-${Math.floor(startTime / 4)}`;
}

export function toComparableMoment(
  track: AnyTrack,
  section: TrackSection
): InspectorComparableMoment {
  const tags = getTagList(section);
  const description = normalizeText(section?.description);
  const startTime = normalizeStart(section?.start);
  const duration = getDuration(section);
  const sectionId = normalizeText(section?.id);

  return {
    trackId: normalizeText(track?.id),
    sectionId,
    startTime,
    endTime: normalizeEnd(section),
    label: description || sectionId || "Moment",
    tags,
    description: description || null,
    momentId: sectionId,
    duration,
    hasDescription: Boolean(description),
    tagCount: tags.length,
    structuralStrength: buildStructuralStrength(section),
    repeatCandidate: tags.length > 0 || Boolean(description),
    timingClusterKey: buildTimingClusterKey(startTime),
  };
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getMomentId(moment: MomentSimilarityComparable): string {
  return normalizeText(moment.sectionId);
}

function buildPositiveGaps(starts: number[]): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i += 1) {
    const gap = starts[i]! - starts[i - 1]!;
    if (gap > 0) gaps.push(gap);
  }
  return gaps;
}

export function getEstimatedRepeatPlan(family: MomentFamily): RepeatPlan | null {
  if (!family || family.members.length < 3) return null;

  const starts = family.members
    .map((member) => member.moment.startTime)
    .sort((a, b) => a - b);

  const gaps = buildPositiveGaps(starts);
  if (!gaps.length) return null;

  const avgGap = average(gaps);
  if (!Number.isFinite(avgGap) || avgGap <= 0) return null;

  return buildRepeatPlan({
    family,
    rule: {
      every: avgGap,
      unit: "seconds",
      startAt: starts[0]!,
      endAt: starts[starts.length - 1]!,
      maxDifferencePercent: 8,
    },
  });
}

export function toEngineMomentFamilyMap(
  families: MomentFamilyEngineFamily[]
): Record<string, MomentFamilyEngineFamily> {
  return Object.fromEntries(families.map((family) => [family.id, family]));
}

export function getSelectedEngineFamily(
  selectedMoment: MomentSimilarityComparable | null,
  familyByMomentId: Record<string, string>,
  engineFamiliesById: Record<string, MomentFamilyEngineFamily>
): MomentFamilyEngineFamily | null {
  if (!selectedMoment) return null;

  const familyId = familyByMomentId[getMomentId(selectedMoment)];
  if (!familyId) return null;

  return engineFamiliesById[familyId] ?? null;
}

export function buildMomentLookups(moments: MomentSimilarityComparable[]) {
  return moments.map((moment) => ({
    momentId: getMomentId(moment),
    startTime: moment.startTime,
  }));
}

export function getSelectedIntendedPlan(
  stableSelectedFamily: MomentFamilyEngineFamily | null,
  intendedRepeatMetadata: IntendedRepeatResult
): IntendedRepeatFamilyPlan | null {
  if (!stableSelectedFamily) return null;
  return intendedRepeatMetadata.byFamilyId[stableSelectedFamily.id] ?? null;
}

export function getSelectedIntendedActionPlan(
  stableSelectedFamily: MomentFamilyEngineFamily | null,
  intendedActionResult: IntendedActionResult
): IntendedActionPlan | null {
  if (!stableSelectedFamily) return null;

  return (
    intendedActionResult.plans.find(
      (plan) => plan.familyId === stableSelectedFamily.id
    ) ?? null
  );
}

export function getEmptyDriftResult(): PhraseDriftEngineResult {
  return {
    families: [],
    byFamilyId: {},
    byMomentId: {},
  };
}

export function getEmptyStabilityResult(): PhraseStabilityEngineResult {
  return {
    families: [],
    byFamilyId: {},
  };
}

export function getSelectedPhraseDriftFamily(
  stableSelectedFamily: MomentFamilyEngineFamily | null,
  phraseDriftResult: PhraseDriftEngineResult
): PhraseDriftFamilyResult | null {
  if (!stableSelectedFamily) return null;
  return phraseDriftResult.byFamilyId[stableSelectedFamily.id] ?? null;
}

export function getSelectedPhraseStabilityFamily(
  stableSelectedFamily: MomentFamilyEngineFamily | null,
  phraseStabilityResult: PhraseStabilityEngineResult
): PhraseStabilityFamilyResult | null {
  if (!stableSelectedFamily) return null;
  return phraseStabilityResult.byFamilyId[stableSelectedFamily.id] ?? null;
}

export function buildEmptyMomentInspectorSimilarityResult(params: {
  moments?: InspectorComparableMoment[];
  selectedMoment?: InspectorComparableMoment | null;
  ungroupedMomentIds?: string[];
}): BuildMomentInspectorSimilarityResult {
  const safeSelectedMoment = params.selectedMoment ?? null;

  return {
    moments: params.moments ?? [],
    selectedMoment: safeSelectedMoment,
    similarMoments: [],
    similarityDebugRows: [],
    families: [],
    selectedFamily: null,
    repeatPlan: null,
    stableFamilies: [],
    stableSelectedFamily: null,
    familyByMomentId: {},
    ungroupedMomentIds: params.ungroupedMomentIds ?? [],
    stableFamilyDiagnostics: [],
    repeatDiagnostics: [],
    intendedRepeatMetadata: {
      plans: [],
      byFamilyId: {},
    },
    selectedIntendedPlan: null,
    intendedActionResult: {
      plans: [],
      actionsByFamilyId: {},
    },
    selectedIntendedActionPlan: null,
    phraseDriftResult: getEmptyDriftResult(),
    selectedPhraseDriftFamily: null,
    phraseStabilityResult: getEmptyStabilityResult(),
    selectedPhraseStabilityFamily: null,
  };
}
