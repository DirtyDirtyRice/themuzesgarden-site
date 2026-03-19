import type {
  MomentFamily,
  MomentFamilyMember,
  MomentSimilarityBreakdown,
  MomentSimilarityComparable,
  MomentSimilarityResult,
  SimilarityMatchKind,
} from "./playerMomentSimilarityTypes";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean))
  );
}

function tokenize(value: unknown): string[] {
  return uniqueStrings(
    normalizeText(value)
      .split(/[^a-z0-9]+/i)
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

function jaccardScore(a: string[], b: string[]): number {
  const aa = uniqueStrings(a);
  const bb = uniqueStrings(b);

  if (!aa.length && !bb.length) return 1;
  if (!aa.length || !bb.length) return 0;

  const aSet = new Set(aa);
  const bSet = new Set(bb);

  let intersection = 0;
  for (const value of aSet) {
    if (bSet.has(value)) intersection += 1;
  }

  const union = new Set([...aa, ...bb]).size;
  if (!union) return 0;

  return intersection / union;
}

function getDurationSeconds(moment: MomentSimilarityComparable): number {
  const endTime = Number(moment.endTime);
  const startTime = Number(moment.startTime);

  if (!Number.isFinite(startTime)) return 0;
  if (!Number.isFinite(endTime)) return 0;
  if (endTime <= startTime) return 0;

  return endTime - startTime;
}

function scoreDurationSimilarity(
  a: MomentSimilarityComparable,
  b: MomentSimilarityComparable
): number {
  const aDuration = getDurationSeconds(a);
  const bDuration = getDurationSeconds(b);

  if (!aDuration && !bDuration) return 0.5;
  if (!aDuration || !bDuration) return 0.25;

  const maxDuration = Math.max(aDuration, bDuration);
  const diff = Math.abs(aDuration - bDuration);

  return clamp01(1 - diff / maxDuration);
}

function scoreTimingSimilarity(
  a: MomentSimilarityComparable,
  b: MomentSimilarityComparable
): number {
  const aStart = Number(a.startTime);
  const bStart = Number(b.startTime);

  if (!Number.isFinite(aStart) || !Number.isFinite(bStart)) return 0;

  const diff = Math.abs(aStart - bStart);

  if (diff <= 0.25) return 1;
  if (diff <= 1) return 0.85;
  if (diff <= 2) return 0.65;
  if (diff <= 4) return 0.45;
  return 0.2;
}

function scoreLabelSimilarity(
  a: MomentSimilarityComparable,
  b: MomentSimilarityComparable
): number {
  const aLabel = normalizeText(a.label);
  const bLabel = normalizeText(b.label);

  if (!aLabel && !bLabel) return 0;
  if (aLabel === bLabel) return 1;

  if (aLabel && bLabel && (aLabel.includes(bLabel) || bLabel.includes(aLabel))) {
    return 0.8;
  }

  return jaccardScore(tokenize(aLabel), tokenize(bLabel));
}

function scoreTagSimilarity(
  a: MomentSimilarityComparable,
  b: MomentSimilarityComparable
): number {
  return jaccardScore(a.tags ?? [], b.tags ?? []);
}

function buildMomentSearchText(moment: MomentSimilarityComparable): string {
  return [moment.label, moment.description ?? "", ...(moment.tags ?? [])].join(" ");
}

function scoreTextSimilarity(
  a: MomentSimilarityComparable,
  b: MomentSimilarityComparable
): number {
  const aText = tokenize(buildMomentSearchText(a));
  const bText = tokenize(buildMomentSearchText(b));
  return jaccardScore(aText, bText);
}

function compareSimilarityResults(
  a: MomentSimilarityResult,
  b: MomentSimilarityResult
): number {
  if (b.similarityScore !== a.similarityScore) {
    return b.similarityScore - a.similarityScore;
  }

  if (a.candidate.startTime !== b.candidate.startTime) {
    return a.candidate.startTime - b.candidate.startTime;
  }

  return a.candidate.sectionId.localeCompare(b.candidate.sectionId);
}

function compareFamilyMembers(
  a: MomentFamilyMember,
  b: MomentFamilyMember
): number {
  if (a.moment.startTime !== b.moment.startTime) {
    return a.moment.startTime - b.moment.startTime;
  }

  return a.moment.sectionId.localeCompare(b.moment.sectionId);
}

export function classifySimilarityMatch(score: number): SimilarityMatchKind {
  if (score >= 0.98) return "exact";
  if (score >= 0.9) return "near";
  if (score >= 0.75) return "loose";
  return "different";
}

export function scoreMomentSimilarity(
  reference: MomentSimilarityComparable,
  candidate: MomentSimilarityComparable
): MomentSimilarityResult {
  const breakdown: MomentSimilarityBreakdown = {
    labelScore: scoreLabelSimilarity(reference, candidate),
    tagScore: scoreTagSimilarity(reference, candidate),
    durationScore: scoreDurationSimilarity(reference, candidate),
    timingScore: scoreTimingSimilarity(reference, candidate),
    textScore: scoreTextSimilarity(reference, candidate),
  };

  const similarityScore =
    breakdown.labelScore * 0.28 +
    breakdown.tagScore * 0.24 +
    breakdown.durationScore * 0.18 +
    breakdown.timingScore * 0.1 +
    breakdown.textScore * 0.2;

  const clampedScore = clamp01(similarityScore);
  const differencePercent = Math.round((1 - clampedScore) * 100);
  const matchKind = classifySimilarityMatch(clampedScore);

  return {
    reference,
    candidate,
    similarityScore: clampedScore,
    differencePercent,
    matchKind,
    breakdown,
  };
}

export function findSimilarMoments(params: {
  reference: MomentSimilarityComparable;
  candidates: MomentSimilarityComparable[];
  minSimilarityScore?: number;
  maxResults?: number;
  sameTrackOnly?: boolean;
}): MomentSimilarityResult[] {
  const {
    reference,
    candidates,
    minSimilarityScore = 0.75,
    maxResults = 24,
    sameTrackOnly = false,
  } = params;

  return candidates
    .filter((candidate) => {
      if (candidate.sectionId === reference.sectionId) return false;
      if (sameTrackOnly && candidate.trackId !== reference.trackId) return false;
      return true;
    })
    .map((candidate) => scoreMomentSimilarity(reference, candidate))
    .filter((result) => result.similarityScore >= minSimilarityScore)
    .sort(compareSimilarityResults)
    .slice(0, maxResults);
}

function buildFamilyId(reference: MomentSimilarityComparable, index: number): string {
  const baseTrack = normalizeText(reference.trackId).replace(/[^a-z0-9]+/g, "-");
  const baseSection = normalizeText(reference.sectionId).replace(/[^a-z0-9]+/g, "-");
  return `family-${baseTrack || "track"}-${baseSection || "section"}-${index + 1}`;
}

export function groupMomentsIntoFamilies(params: {
  moments: MomentSimilarityComparable[];
  minSimilarityScore?: number;
}): MomentFamily[] {
  const { moments, minSimilarityScore = 0.9 } = params;

  const remaining = [...moments];
  const families: MomentFamily[] = [];

  while (remaining.length > 0) {
    const reference = remaining.shift()!;
    const matches = findSimilarMoments({
      reference,
      candidates: remaining,
      minSimilarityScore,
      maxResults: remaining.length,
      sameTrackOnly: true,
    });

    const matchedSectionIds = new Set(
      matches.map((match) => match.candidate.sectionId)
    );

    const members: MomentFamilyMember[] = [
      {
        moment: reference,
        similarityScoreToReference: 1,
        differencePercentToReference: 0,
        matchKind: "exact",
      },
      ...matches.map((match) => ({
        moment: match.candidate,
        similarityScoreToReference: match.similarityScore,
        differencePercentToReference: match.differencePercent,
        matchKind: match.matchKind,
      })),
    ];

    const averageSimilarityScore =
      members.reduce((sum, member) => sum + member.similarityScoreToReference, 0) /
      members.length;

    const averageDifferencePercent =
      members.reduce((sum, member) => sum + member.differencePercentToReference, 0) /
      members.length;

    families.push({
      familyId: buildFamilyId(reference, families.length),
      reference,
      members: members.sort(compareFamilyMembers),
      averageSimilarityScore,
      averageDifferencePercent,
      repeatRule: null,
    });

    for (let i = remaining.length - 1; i >= 0; i -= 1) {
      if (matchedSectionIds.has(remaining[i]!.sectionId)) {
        remaining.splice(i, 1);
      }
    }
  }

  return families;
}