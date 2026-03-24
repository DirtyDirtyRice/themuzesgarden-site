import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";

type MomentFamilyMember = MomentFamilyEngineFamily["members"][number];

export type InspectorSimilarityFamilySummary = {
  familyId: string;
  memberCount: number;
  averageSimilarity: number;
  strongestSimilarity: number;
  earliestStart: number | null;
  latestStart: number | null;
  spreadSeconds: number | null;
};

export type InspectorSimilarityDebugRow = {
  familyId: string;
  memberCount: number;
  averageSimilarity: number;
  strongestSimilarity: number;
  earliestStart: number | null;
  latestStart: number | null;
  spreadSeconds: number | null;
};

export type InspectorRepeatDiagnosticRow = {
  familyId: string;
  memberCount: number;
  repeatCoverage: number;
  spreadSeconds: number | null;
  status: "strong" | "partial" | "weak";
};

export type InspectorStableFamilyDiagnosticRow = {
  familyId: string;
  memberCount: number;
  averageSimilarity: number;
  strongestSimilarity: number;
  spreadSeconds: number | null;
  isStable: boolean;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toFiniteNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round3(value: number): number {
  return Number(value.toFixed(3));
}

function getMemberSimilarity(member: MomentFamilyMember): number {
  const candidate = member as MomentFamilyMember & {
    similarityToAnchor?: unknown;
    similarity?: unknown;
    score?: unknown;
    moment?: {
      similarityToAnchor?: unknown;
      similarity?: unknown;
      score?: unknown;
    } | null;
  };

  return toFiniteNumber(
    candidate.similarityToAnchor ??
      candidate.similarity ??
      candidate.score ??
      candidate.moment?.similarityToAnchor ??
      candidate.moment?.similarity ??
      candidate.moment?.score ??
      0,
    0
  );
}

function getMemberStart(member: MomentFamilyMember): number | null {
  const candidate = member as MomentFamilyMember & {
    startTime?: unknown;
    start?: unknown;
    actualStartTime?: unknown;
    expectedStartTime?: unknown;
    moment?: {
      startTime?: unknown;
      start?: unknown;
      actualStartTime?: unknown;
      expectedStartTime?: unknown;
    } | null;
  };

  return toFiniteNumberOrNull(
    candidate.startTime ??
      candidate.start ??
      candidate.actualStartTime ??
      candidate.expectedStartTime ??
      candidate.moment?.startTime ??
      candidate.moment?.start ??
      candidate.moment?.actualStartTime ??
      candidate.moment?.expectedStartTime
  );
}

function getFamilyId(family: MomentFamilyEngineFamily): string {
  const candidate = family as MomentFamilyEngineFamily & {
    familyId?: unknown;
    id?: unknown;
  };

  return normalizeText(candidate.familyId ?? candidate.id ?? "");
}

function buildFamilySummary(
  family: MomentFamilyEngineFamily
): InspectorSimilarityFamilySummary {
  const similarities = family.members
    .map((member) => getMemberSimilarity(member))
    .filter((value) => Number.isFinite(value));

  const starts = family.members
    .map((member) => getMemberStart(member))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  const averageSimilarity =
    similarities.length > 0
      ? round3(
          similarities.reduce((sum, value) => sum + value, 0) / similarities.length
        )
      : 0;

  const strongestSimilarity =
    similarities.length > 0 ? round3(Math.max(...similarities)) : 0;

  const earliestStart = starts.length > 0 ? round3(starts[0]) : null;
  const latestStart = starts.length > 0 ? round3(starts[starts.length - 1]) : null;
  const spreadSeconds =
    starts.length > 1 ? round3(starts[starts.length - 1] - starts[0]) : null;

  return {
    familyId: getFamilyId(family),
    memberCount: family.members.length,
    averageSimilarity,
    strongestSimilarity,
    earliestStart,
    latestStart,
    spreadSeconds,
  };
}

function compareFamilySummary(
  a: InspectorSimilarityFamilySummary,
  b: InspectorSimilarityFamilySummary
): number {
  if (b.strongestSimilarity !== a.strongestSimilarity) {
    return b.strongestSimilarity - a.strongestSimilarity;
  }

  if (b.averageSimilarity !== a.averageSimilarity) {
    return b.averageSimilarity - a.averageSimilarity;
  }

  if (b.memberCount !== a.memberCount) {
    return b.memberCount - a.memberCount;
  }

  return a.familyId.localeCompare(b.familyId);
}

export function buildInspectorSimilarityFamilySummaries(
  stableFamilies: MomentFamilyEngineFamily[]
): InspectorSimilarityFamilySummary[] {
  return stableFamilies
    .map((family) => buildFamilySummary(family))
    .filter((family) => Boolean(family.familyId))
    .sort(compareFamilySummary);
}

export function buildSimilarityDebugRows(
  stableFamilies: MomentFamilyEngineFamily[]
): InspectorSimilarityDebugRow[] {
  return buildInspectorSimilarityFamilySummaries(stableFamilies).map((family) => ({
    familyId: family.familyId,
    memberCount: family.memberCount,
    averageSimilarity: family.averageSimilarity,
    strongestSimilarity: family.strongestSimilarity,
    earliestStart: family.earliestStart,
    latestStart: family.latestStart,
    spreadSeconds: family.spreadSeconds,
  }));
}

export function buildRepeatDiagnostics(
  stableFamilies: MomentFamilyEngineFamily[]
): InspectorRepeatDiagnosticRow[] {
  return buildInspectorSimilarityFamilySummaries(stableFamilies).map((family) => {
    const repeatCoverage =
      family.memberCount <= 1
        ? 0
        : Math.min(
            100,
            Number(
              ((family.memberCount / Math.max(2, family.memberCount)) * 100).toFixed(1)
            )
          );

    let status: "strong" | "partial" | "weak" = "weak";
    if (family.memberCount >= 4 && family.averageSimilarity >= 0.75) status = "strong";
    else if (family.memberCount >= 2 && family.averageSimilarity >= 0.5) {
      status = "partial";
    }

    return {
      familyId: family.familyId,
      memberCount: family.memberCount,
      repeatCoverage,
      spreadSeconds: family.spreadSeconds,
      status,
    };
  });
}

export function buildStableFamilyDiagnostics(
  stableFamilies: MomentFamilyEngineFamily[]
): InspectorStableFamilyDiagnosticRow[] {
  return buildInspectorSimilarityFamilySummaries(stableFamilies).map((family) => ({
    familyId: family.familyId,
    memberCount: family.memberCount,
    averageSimilarity: family.averageSimilarity,
    strongestSimilarity: family.strongestSimilarity,
    spreadSeconds: family.spreadSeconds,
    isStable:
      family.memberCount >= 2 &&
      family.averageSimilarity >= 0.5 &&
      family.strongestSimilarity >= 0.65,
  }));
}