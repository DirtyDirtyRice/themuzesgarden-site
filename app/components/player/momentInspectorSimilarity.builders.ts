import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";
import type {
  MomentFamily,
  MomentSimilarityResult,
} from "./playerMomentSimilarityTypes";

import type {
  InspectorComparableMoment,
  InspectorRepeatDiagnostics,
  InspectorSimilarityDebugRow,
  InspectorStableFamilyDiagnostics,
} from "./momentInspectorSimilarity.types";

import {
  average,
  clamp01,
  getMomentId,
  normalizeText,
  round3,
} from "./momentInspectorSimilarity.shared";

function buildNormalizedTagSet(tags: unknown): Set<string> {
  if (!Array.isArray(tags)) return new Set<string>();
  return new Set(tags.map((tag) => normalizeText(tag)).filter(Boolean));
}

function getTagOverlapScore(selectedTags: Set<string>, matchTags: Set<string>): number {
  const overlappingTags = Array.from(selectedTags).filter((tag) => matchTags.has(tag)).length;
  const tagUnion = new Set([...Array.from(selectedTags), ...Array.from(matchTags)]).size;
  return tagUnion > 0 ? overlappingTags / tagUnion : 0;
}

function getDescriptionOverlapScore(
  selectedDescription: string,
  matchDescription: string
): number {
  if (!selectedDescription || !matchDescription) return 0;
  if (selectedDescription === matchDescription) return 1;
  if (
    selectedDescription.includes(matchDescription) ||
    matchDescription.includes(selectedDescription)
  ) {
    return 0.65;
  }
  return 0;
}

function getTimingSpread(starts: number[]): number {
  if (starts.length < 2) return 0;
  return round3(starts[starts.length - 1]! - starts[0]!);
}

export function buildSimilarityDebugRows(params: {
  selectedMoment: InspectorComparableMoment | null;
  similarMoments: MomentSimilarityResult[];
  momentsById: Record<string, InspectorComparableMoment>;
}): InspectorSimilarityDebugRow[] {
  const { selectedMoment, similarMoments, momentsById } = params;
  if (!selectedMoment) return [];

  const selectedTags = buildNormalizedTagSet(selectedMoment.tags ?? []);
  const selectedDescription = normalizeText(selectedMoment.description);

  return similarMoments.map((row) => {
    const match =
      momentsById[getMomentId(row.candidate)] ??
      (row.candidate as InspectorComparableMoment);

    const matchTags = buildNormalizedTagSet(match.tags ?? []);
    const tagOverlap = getTagOverlapScore(selectedTags, matchTags);

    const matchDescription = normalizeText(match.description);
    const descriptionOverlap = getDescriptionOverlapScore(
      selectedDescription,
      matchDescription
    );

    const timingDistance = Math.abs(match.startTime - selectedMoment.startTime);

    const structuralConfidence = average([
      clamp01(row.similarityScore ?? 0),
      clamp01(match.structuralStrength ?? 0),
      clamp01(tagOverlap),
      clamp01(descriptionOverlap),
    ]);

    return {
      momentId: getMomentId(match),
      similarityScore: round3(clamp01(row.similarityScore ?? 0)),
      timingDistance: round3(timingDistance),
      tagOverlap: round3(tagOverlap),
      descriptionOverlap: round3(descriptionOverlap),
      structuralConfidence: round3(structuralConfidence),
      repeatCandidate: Boolean(match.repeatCandidate),
    };
  });
}

export function buildStableFamilyDiagnostics(params: {
  stableFamilies: MomentFamilyEngineFamily[];
  familyByMomentId: Record<string, string>;
  ungroupedMomentIds: string[];
}): InspectorStableFamilyDiagnostics[] {
  const { stableFamilies, familyByMomentId, ungroupedMomentIds } = params;
  const totalGrouped = Object.keys(familyByMomentId).length;
  const totalUngrouped = ungroupedMomentIds.length;
  const totalMoments = totalGrouped + totalUngrouped;
  const groupedShare = totalMoments > 0 ? totalGrouped / totalMoments : 1;
  const ungroupedRisk = round3(clamp01(totalUngrouped / Math.max(1, totalMoments)));

  return stableFamilies.map((family) => {
    const similarities = family.members
      .map((member) => Number(member.similarityToAnchor ?? 0))
      .filter((value) => Number.isFinite(value));

    const starts = family.members
      .map((member) => Number((member as { startTime?: unknown }).startTime ?? 0))
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    const avgSimilarity = round3(clamp01(average(similarities)));
    const familySize = family.members.length;
    const timingSpread = getTimingSpread(starts);

    const familyConfidence = round3(
      clamp01(
        avgSimilarity * 0.55 +
          Math.min(1, familySize / 5) * 0.3 +
          groupedShare * 0.15
      )
    );

    return {
      familyId: family.id,
      familySize,
      avgSimilarity,
      timingSpread,
      familyConfidence,
      familyAnchorMomentId: normalizeText(family.anchorMomentId),
      ungroupedRisk,
    };
  });
}

export function buildRepeatDiagnostics(
  families: MomentFamily[]
): InspectorRepeatDiagnostics[] {
  return families.map((family) => {
    const starts = family.members
      .map((member) => member.moment.startTime)
      .sort((a, b) => a - b);

    const gaps: number[] = [];
    for (let i = 1; i < starts.length; i += 1) {
      const gap = starts[i]! - starts[i - 1]!;
      if (gap > 0) gaps.push(gap);
    }

    const avgGap = gaps.length ? average(gaps) : 0;
    const gapSpread = gaps.length >= 2 ? Math.max(...gaps) - Math.min(...gaps) : 0;

    const repeatConfidence =
      gaps.length > 0
        ? clamp01(
            (1 - Math.min(1, gapSpread / Math.max(1, avgGap))) * 0.7 +
              Math.min(1, family.members.length / 5) * 0.3
          )
        : 0;

    return {
      familyId: family.familyId,
      estimatedInterval: gaps.length ? round3(avgGap) : null,
      observedGapCount: gaps.length,
      repeatConfidence: round3(repeatConfidence),
    };
  });
}