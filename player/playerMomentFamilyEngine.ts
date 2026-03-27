import type {
  MomentFamily,
  MomentFamilyMember,
  MomentSimilarityComparable,
  MomentSimilarityResult,
} from "./playerMomentSimilarityTypes";
import {
  findSimilarMoments,
  scoreMomentSimilarity,
} from "./playerMomentSimilarity";

type ComparableMoment = MomentSimilarityComparable & {
  id?: unknown;
  sectionId?: unknown;
  startTime?: unknown;
  start?: unknown;
  label?: unknown;
  title?: unknown;
  trackId?: unknown;
  sourceTrackId?: unknown;
};

export type MomentFamilyEngineInput = {
  moments: ComparableMoment[];
  similarityThreshold?: number;
  maxMatchesPerMoment?: number;
};

export type MomentFamilyEngineFamily = MomentFamily & {
  id: string;
  size: number;
  averageScore: number;
  strongestScore: number;
  repeatIntervalHint: number | null;
  anchorMomentId: string;
  members: MomentFamilyMember[];
};

export type MomentFamilyEngineResult = {
  families: MomentFamilyEngineFamily[];
  familyByMomentId: Record<string, string>;
  ungroupedMomentIds: string[];
};

type InternalFamily = {
  memberIds: Set<string>;
  scores: number[];
};

type PairMatch = {
  id: string;
  score: number;
};

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function getMomentId(moment: ComparableMoment): string {
  const directId = String(moment?.id ?? "").trim();
  if (directId) return directId;

  const sectionId = String(moment?.sectionId ?? "").trim();
  if (sectionId) return sectionId;

  return "";
}

function getMomentStart(moment: ComparableMoment): number | null {
  const direct = toNumber(moment.startTime);
  if (direct !== null) return direct;

  const alt = toNumber(moment.start);
  if (alt !== null) return alt;

  return null;
}

function getMomentLabel(moment: ComparableMoment): string {
  const direct = normalizeText(moment.label);
  if (direct) return direct;

  const alt = normalizeText(moment.title);
  if (alt) return alt;

  return getMomentId(moment);
}

function getTrackId(moment: ComparableMoment): string {
  const direct = normalizeText(moment.trackId);
  if (direct) return direct;

  const alt = normalizeText(moment.sourceTrackId);
  if (alt) return alt;

  return "track";
}

function toMomentSimilarityComparable(
  moment: ComparableMoment
): MomentSimilarityComparable {
  return {
    ...moment,
    sectionId: String(moment.sectionId ?? moment.id ?? "").trim(),
  };
}

function compareOrderedMoments(
  a: ComparableMoment,
  b: ComparableMoment
): number {
  const trackCompare = getTrackId(a).localeCompare(getTrackId(b));
  if (trackCompare !== 0) return trackCompare;

  const startA = getMomentStart(a);
  const startB = getMomentStart(b);

  if (startA !== null && startB !== null && startA !== startB) {
    return startA - startB;
  }

  return getMomentLabel(a).localeCompare(getMomentLabel(b));
}

function compareFamilyMoments(
  a: ComparableMoment,
  b: ComparableMoment
): number {
  const trackCompare = getTrackId(a).localeCompare(getTrackId(b));
  if (trackCompare !== 0) return trackCompare;

  const startA = getMomentStart(a) ?? Number.MAX_SAFE_INTEGER;
  const startB = getMomentStart(b) ?? Number.MAX_SAFE_INTEGER;

  if (startA !== startB) return startA - startB;
  return getMomentId(a).localeCompare(getMomentId(b));
}

function getOrderedMoments(moments: ComparableMoment[]): ComparableMoment[] {
  return [...moments]
    .filter((moment) => Boolean(getMomentId(moment)))
    .sort(compareOrderedMoments);
}

function makeStableFamilySeed(members: ComparableMoment[]): string {
  const parts = members
    .map((moment) => {
      const id = getMomentId(moment);
      const trackId = getTrackId(moment);
      const label = getMomentLabel(moment);
      const start = getMomentStart(moment);
      return `${trackId}|${label}|${start ?? "na"}|${id}`;
    })
    .sort();

  return parts.join("::");
}

function hashString(input: string): string {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0).toString(36);
}

function makeStableFamilyId(members: ComparableMoment[]): string {
  return `family_${hashString(makeStableFamilySeed(members))}`;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function strongest(values: number[]): number {
  if (!values.length) return 0;
  return Math.max(...values);
}

function buildRepeatIntervalHint(members: ComparableMoment[]): number | null {
  const starts = members
    .map((moment) => getMomentStart(moment))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  if (starts.length < 2) return null;

  const gaps: number[] = [];

  for (let i = 1; i < starts.length; i += 1) {
    const gap = starts[i] - starts[i - 1];
    if (gap > 0) gaps.push(gap);
  }

  if (!gaps.length) return null;

  return Number(average(gaps).toFixed(2));
}

function createInternalFamily(rootId: string): InternalFamily {
  return {
    memberIds: new Set([rootId]),
    scores: [],
  };
}

function mergeFamilies(target: InternalFamily, source: InternalFamily): void {
  source.memberIds.forEach((id) => target.memberIds.add(id));
  target.scores.push(...source.scores);
}

function readResultField(
  result: MomentSimilarityResult,
  key: string
): unknown {
  return (result as Record<string, unknown>)[key];
}

function getSimilarityScore(result: MomentSimilarityResult): number {
  const similarityScore = toNumber(readResultField(result, "similarityScore"));
  if (similarityScore !== null) {
    return clamp01(similarityScore);
  }

  const similarity = toNumber(readResultField(result, "similarity"));
  if (similarity !== null) {
    return clamp01(similarity);
  }

  const percent = toNumber(readResultField(result, "similarityPercent"));
  if (percent !== null) {
    return clamp01(percent / 100);
  }

  return 0;
}

function getDifferencePercent(result: MomentSimilarityResult): number {
  const direct = toNumber(readResultField(result, "differencePercent"));
  if (direct !== null) return direct;

  const differenceScore = toNumber(readResultField(result, "differenceScore"));
  if (differenceScore !== null) {
    return Number((clamp01(differenceScore) * 100).toFixed(2));
  }

  return Number(((1 - getSimilarityScore(result)) * 100).toFixed(2));
}
function getMomentSimilarityResult(
  a: ComparableMoment,
  b: ComparableMoment
): MomentSimilarityResult {
  return scoreMomentSimilarity(
    toMomentSimilarityComparable(a),
    toMomentSimilarityComparable(b)
  );
}

function getMomentSimilarityScore(
  a: ComparableMoment,
  b: ComparableMoment
): number {
  return getSimilarityScore(getMomentSimilarityResult(a, b));
}

function buildMomentFamilyMember(
  referenceMoment: ComparableMoment,
  moment: ComparableMoment
): MomentFamilyMember {
  const similarityResult = getMomentSimilarityResult(referenceMoment, moment);

  return {
    moment: toMomentSimilarityComparable(moment),
    similarityScoreToReference: clamp01(getSimilarityScore(similarityResult)),
    differencePercentToReference: getDifferencePercent(similarityResult),
  matchKind:
  getMomentId(referenceMoment) === getMomentId(moment)
    ? "exact"
    : "near",
  };
}

function getMemberSimilarityScore(member: MomentFamilyMember): number {
  return clamp01(toNumber(member.similarityScoreToReference) ?? 0);
}

function getMemberDifferencePercent(member: MomentFamilyMember): number {
  return toNumber(member.differencePercentToReference) ?? 100;
}

function collectPairMatches(
  orderedMoments: ComparableMoment[],
  similarityThreshold: number,
  maxMatchesPerMoment: number
): Map<string, PairMatch[]> {
  const pairMap = new Map<string, PairMatch[]>();

  const comparableCandidates = orderedMoments.map((item) =>
    toMomentSimilarityComparable(item)
  );

  for (const moment of orderedMoments) {
    const momentId = getMomentId(moment);

    const matches = findSimilarMoments({
      reference: toMomentSimilarityComparable(moment),
      candidates: comparableCandidates,
      minSimilarityScore: similarityThreshold,
      maxResults: maxMatchesPerMoment,
      sameTrackOnly: false,
    })
      .map((result) => ({
        id: getMomentId(result.candidate as ComparableMoment),
        score: getSimilarityScore(result),
      }))
      .filter((result) => {
        if (!result.id || result.id === momentId) return false;
     return result.score >= similarityThreshold;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxMatchesPerMoment);

    pairMap.set(momentId, matches);
  }

  return pairMap;
}

function compareBuiltFamilies(
  a: MomentFamilyEngineFamily,
  b: MomentFamilyEngineFamily
): number {
  if (b.size !== a.size) return b.size - a.size;
  if (b.strongestScore !== a.strongestScore) {
    return b.strongestScore - a.strongestScore;
  }
  return a.id.localeCompare(b.id);
}

export function buildMomentFamilies(
  input: MomentFamilyEngineInput
): MomentFamilyEngineResult {
  const similarityThreshold = clamp01(input.similarityThreshold ?? 0.72);
  const maxMatchesPerMoment = Math.max(
    1,
    Math.floor(input.maxMatchesPerMoment ?? 6)
  );

  const orderedMoments = getOrderedMoments(input.moments ?? []);
  const byId = new Map(
    orderedMoments.map((moment) => [getMomentId(moment), moment] as const)
  );
  const pairMap = collectPairMatches(
    orderedMoments,
    similarityThreshold,
    maxMatchesPerMoment
  );

  const familyMap = new Map<string, InternalFamily>();

  for (const moment of orderedMoments) {
    const momentId = getMomentId(moment);

    if (!familyMap.has(momentId)) {
      familyMap.set(momentId, createInternalFamily(momentId));
    }

    const currentFamily = familyMap.get(momentId)!;
    const matches = pairMap.get(momentId) ?? [];

    for (const match of matches) {
      const otherId = match.id;
      const otherMoment = byId.get(otherId);
      if (!otherMoment) continue;

      const reverseValue = getMomentSimilarityScore(otherMoment, moment);
      const effectiveScore = Math.max(match.score, reverseValue);

      if (effectiveScore < similarityThreshold) continue;

      if (!familyMap.has(otherId)) {
        familyMap.set(otherId, createInternalFamily(otherId));
      }

      const otherFamily = familyMap.get(otherId)!;

      if (currentFamily !== otherFamily) {
        currentFamily.scores.push(effectiveScore);
        otherFamily.scores.push(effectiveScore);
        mergeFamilies(currentFamily, otherFamily);

        for (const memberId of otherFamily.memberIds) {
          familyMap.set(memberId, currentFamily);
        }
      } else {
        currentFamily.scores.push(effectiveScore);
      }
    }
  }

  const uniqueFamilies = Array.from(new Set(familyMap.values()));
  const families: MomentFamilyEngineFamily[] = [];
  const familyByMomentId: Record<string, string> = {};
  const ungroupedMomentIds: string[] = [];

  for (const family of uniqueFamilies) {
    const members = Array.from(family.memberIds)
      .map((id) => byId.get(id))
      .filter((moment): moment is ComparableMoment => Boolean(moment))
      .sort(compareFamilyMoments);

    if (!members.length) continue;

    if (members.length === 1) {
      ungroupedMomentIds.push(getMomentId(members[0]));
      continue;
    }

    const anchorMoment = members[0];
    const id = makeStableFamilyId(members);

    const memberRows: MomentFamilyMember[] = members.map((moment) =>
      buildMomentFamilyMember(anchorMoment, moment)
    );

    const averageSimilarityScore = Number(
      average(
        memberRows.map((member) => getMemberSimilarityScore(member))
      ).toFixed(3)
    );

    const averageDifferencePercent = Number(
      average(
        memberRows.map((member) => getMemberDifferencePercent(member))
      ).toFixed(2)
    );

    const builtFamily: MomentFamilyEngineFamily = {
      id,
      familyId: id,
      reference: toMomentSimilarityComparable(anchorMoment),
      size: members.length,
      anchorMomentId: getMomentId(anchorMoment),
      averageScore: Number(average(family.scores).toFixed(3)),
      strongestScore: Number(strongest(family.scores).toFixed(3)),
      averageSimilarityScore,
      averageDifferencePercent,
      repeatIntervalHint: buildRepeatIntervalHint(members),
      members: memberRows,
    };

    families.push(builtFamily);

    for (const member of members) {
      familyByMomentId[getMomentId(member)] = id;
    }
  }

  families.sort(compareBuiltFamilies);

  return {
    families,
    familyByMomentId,
    ungroupedMomentIds: ungroupedMomentIds.sort(),
  };
}
