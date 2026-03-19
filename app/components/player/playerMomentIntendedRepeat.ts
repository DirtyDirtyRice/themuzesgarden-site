import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";

export type IntendedRepeatPlacementStatus = "present" | "missing" | "near";

export type IntendedRepeatPlacement = {
  familyId: string;
  expectedAt: number;
  nearestMomentId: string | null;
  nearestActualStart: number | null;
  deltaFromExpected: number | null;
  status: IntendedRepeatPlacementStatus;
  confidence: number;
};

export type IntendedRepeatFamilyPlan = {
  familyId: string;
  anchorMomentId: string;
  memberCount: number;
  strongestScore: number;
  averageScore: number;
  repeatInterval: number | null;
  intendedStart: number | null;
  intendedEnd: number | null;
  expectedPlacements: IntendedRepeatPlacement[];
  presentCount: number;
  nearCount: number;
  missingCount: number;
};

export type IntendedRepeatMetadataResult = {
  plans: IntendedRepeatFamilyPlan[];
  plansByFamilyId: Record<string, IntendedRepeatFamilyPlan>;
};

type FamilyMemberLike = {
  momentId: string;
  similarityToAnchor: number;
};

type MomentLookup = {
  momentId: string;
  startTime: number | null;
};

type MemberStart = {
  momentId: string;
  startTime: number;
};

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function normalizeMomentId(value: unknown): string {
  return String(value ?? "").trim();
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle] ?? 0;
  }

  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function buildMomentLookupMap(
  lookups: MomentLookup[]
): Record<string, MomentLookup> {
  const map: Record<string, MomentLookup> = {};

  for (const lookup of lookups) {
    const id = normalizeMomentId(lookup.momentId);
    if (!id) continue;

    map[id] = {
      momentId: id,
      startTime: toNumber(lookup.startTime),
    };
  }

  return map;
}

function getFamilyMembers(family: MomentFamilyEngineFamily): FamilyMemberLike[] {
  return Array.isArray(family.members) ? (family.members as FamilyMemberLike[]) : [];
}

function getMemberStarts(
  family: MomentFamilyEngineFamily,
  momentLookupMap: Record<string, MomentLookup>
): MemberStart[] {
  const rows: MemberStart[] = [];
  const seen = new Set<string>();

  for (const member of getFamilyMembers(family)) {
    const id = normalizeMomentId(member.momentId);
    if (!id || seen.has(id)) continue;

    const lookup = momentLookupMap[id];
    const startTime = toNumber(lookup?.startTime);
    if (startTime === null || startTime < 0) continue;

    rows.push({ momentId: id, startTime });
    seen.add(id);
  }

  rows.sort((a, b) => a.startTime - b.startTime);
  return rows;
}

function getRepeatInterval(
  family: MomentFamilyEngineFamily,
  starts: MemberStart[]
): number | null {
  const direct = toNumber(family.repeatIntervalHint);
  if (direct !== null && direct > 0) return Number(direct.toFixed(2));

  if (starts.length < 2) return null;

  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i += 1) {
    const gap = starts[i]!.startTime - starts[i - 1]!.startTime;
    if (gap > 0) gaps.push(gap);
  }

  if (!gaps.length) return null;

  const medianGap = median(gaps);
  const averageGap = average(gaps);
  const interval = medianGap > 0 ? medianGap : averageGap;

  if (!Number.isFinite(interval) || interval <= 0) return null;

  return Number(interval.toFixed(2));
}

function getTolerance(interval: number): number {
  return Math.max(0.35, interval * 0.18);
}

function getNearestOverallPlacement(
  expectedAt: number,
  starts: MemberStart[]
): {
  nearestMomentId: string | null;
  nearestActualStart: number | null;
  deltaFromExpected: number | null;
} {
  let best: { momentId: string; startTime: number; delta: number } | null = null;

  for (const row of starts) {
    const delta = Math.abs(row.startTime - expectedAt);
    if (!best || delta < best.delta) {
      best = {
        momentId: row.momentId,
        startTime: row.startTime,
        delta,
      };
    }
  }

  if (!best) {
    return {
      nearestMomentId: null,
      nearestActualStart: null,
      deltaFromExpected: null,
    };
  }

  return {
    nearestMomentId: best.momentId,
    nearestActualStart: best.startTime,
    deltaFromExpected: Number(best.delta.toFixed(2)),
  };
}

function getNearestUnusedPlacement(params: {
  expectedAt: number;
  starts: MemberStart[];
  usedMomentIds: Set<string>;
  tolerance: number;
}): {
  nearestMomentId: string | null;
  nearestActualStart: number | null;
  deltaFromExpected: number | null;
  status: IntendedRepeatPlacementStatus;
} {
  const { expectedAt, starts, usedMomentIds, tolerance } = params;

  let bestUnused: { momentId: string; startTime: number; delta: number } | null = null;

  for (const row of starts) {
    if (usedMomentIds.has(row.momentId)) continue;

    const delta = Math.abs(row.startTime - expectedAt);
    if (!bestUnused || delta < bestUnused.delta) {
      bestUnused = {
        momentId: row.momentId,
        startTime: row.startTime,
        delta,
      };
    }
  }

  if (!bestUnused) {
    const fallback = getNearestOverallPlacement(expectedAt, starts);
    return {
      nearestMomentId: fallback.nearestMomentId,
      nearestActualStart: fallback.nearestActualStart,
      deltaFromExpected: fallback.deltaFromExpected,
      status: "missing",
    };
  }

  if (bestUnused.delta <= tolerance * 0.45) {
    usedMomentIds.add(bestUnused.momentId);
    return {
      nearestMomentId: bestUnused.momentId,
      nearestActualStart: bestUnused.startTime,
      deltaFromExpected: Number(bestUnused.delta.toFixed(2)),
      status: "present",
    };
  }

  if (bestUnused.delta <= tolerance) {
    usedMomentIds.add(bestUnused.momentId);
    return {
      nearestMomentId: bestUnused.momentId,
      nearestActualStart: bestUnused.startTime,
      deltaFromExpected: Number(bestUnused.delta.toFixed(2)),
      status: "near",
    };
  }

  const fallback = getNearestOverallPlacement(expectedAt, starts);
  return {
    nearestMomentId: fallback.nearestMomentId,
    nearestActualStart: fallback.nearestActualStart,
    deltaFromExpected: fallback.deltaFromExpected,
    status: "missing",
  };
}

function getPlacementConfidence(
  family: MomentFamilyEngineFamily,
  status: IntendedRepeatPlacementStatus,
  deltaFromExpected: number | null,
  tolerance: number
): number {
  const familyStrength = average([
    clamp01(toNumber(family.strongestScore) ?? 0),
    clamp01(toNumber(family.averageScore) ?? 0),
  ]);

  if (status === "missing") {
    return Number((familyStrength * 0.5).toFixed(3));
  }

  if (deltaFromExpected === null || tolerance <= 0) {
    return Number(familyStrength.toFixed(3));
  }

  const fit = clamp01(1 - deltaFromExpected / tolerance);
  const statusBoost = status === "present" ? 1 : 0.82;

  return Number((familyStrength * fit * statusBoost).toFixed(3));
}

function buildExpectedTimeline(
  startTime: number,
  endTime: number,
  interval: number
): number[] {
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    !Number.isFinite(interval)
  ) {
    return [];
  }

  if (interval <= 0 || endTime < startTime) return [];

  const values: number[] = [];
  let current = startTime;

  while (current <= endTime + 0.0001) {
    values.push(Number(current.toFixed(2)));
    current += interval;

    if (values.length > 256) break;
  }

  return values;
}

function buildPlacementCounts(placements: IntendedRepeatPlacement[]): {
  presentCount: number;
  nearCount: number;
  missingCount: number;
} {
  let presentCount = 0;
  let nearCount = 0;
  let missingCount = 0;

  for (const placement of placements) {
    if (placement.status === "present") {
      presentCount += 1;
      continue;
    }

    if (placement.status === "near") {
      nearCount += 1;
      continue;
    }

    if (placement.status === "missing") {
      missingCount += 1;
    }
  }

  return {
    presentCount,
    nearCount,
    missingCount,
  };
}

function comparePlans(
  a: IntendedRepeatFamilyPlan,
  b: IntendedRepeatFamilyPlan
): number {
  if (b.missingCount !== a.missingCount) return b.missingCount - a.missingCount;
  if (b.nearCount !== a.nearCount) return b.nearCount - a.nearCount;
  if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
  if (b.strongestScore !== a.strongestScore) {
    return b.strongestScore - a.strongestScore;
  }
  return a.familyId.localeCompare(b.familyId);
}

export function buildIntendedRepeatMetadata(params: {
  families: MomentFamilyEngineFamily[];
  momentLookups: MomentLookup[];
  minFamilySize?: number;
}): IntendedRepeatMetadataResult {
  const minFamilySize = Math.max(2, Math.floor(params.minFamilySize ?? 2));
  const momentLookupMap = buildMomentLookupMap(params.momentLookups);
  const plans: IntendedRepeatFamilyPlan[] = [];

  for (const family of params.families) {
    if (!family || family.size < minFamilySize) continue;

    const familyId = normalizeMomentId(family.id);
    if (!familyId) continue;

    const starts = getMemberStarts(family, momentLookupMap);
    if (starts.length < 2) continue;

    const repeatInterval = getRepeatInterval(family, starts);
    if (repeatInterval === null || repeatInterval <= 0) continue;

    const intendedStart = starts[0]?.startTime ?? null;
    const intendedEnd = starts[starts.length - 1]?.startTime ?? null;

    if (intendedStart === null || intendedEnd === null) continue;

    const tolerance = getTolerance(repeatInterval);
    const expectedTimeline = buildExpectedTimeline(
      intendedStart,
      intendedEnd,
      repeatInterval
    );

    const usedMomentIds = new Set<string>();

    const expectedPlacements: IntendedRepeatPlacement[] = expectedTimeline.map(
      (expectedAt) => {
        const nearest = getNearestUnusedPlacement({
          expectedAt,
          starts,
          usedMomentIds,
          tolerance,
        });

        const confidence = getPlacementConfidence(
          family,
          nearest.status,
          nearest.deltaFromExpected,
          tolerance
        );

        return {
          familyId,
          expectedAt,
          nearestMomentId: nearest.nearestMomentId,
          nearestActualStart: nearest.nearestActualStart,
          deltaFromExpected: nearest.deltaFromExpected,
          status: nearest.status,
          confidence,
        };
      }
    );

    const counts = buildPlacementCounts(expectedPlacements);

    plans.push({
      familyId,
      anchorMomentId: normalizeMomentId(family.anchorMomentId),
      memberCount: family.size,
      strongestScore: clamp01(toNumber(family.strongestScore) ?? 0),
      averageScore: clamp01(toNumber(family.averageScore) ?? 0),
      repeatInterval,
      intendedStart,
      intendedEnd,
      expectedPlacements,
      presentCount: counts.presentCount,
      nearCount: counts.nearCount,
      missingCount: counts.missingCount,
    });
  }

  plans.sort(comparePlans);

  const plansByFamilyId: Record<string, IntendedRepeatFamilyPlan> = {};
  for (const plan of plans) {
    plansByFamilyId[plan.familyId] = plan;
  }

  return {
    plans,
    plansByFamilyId,
  };
}