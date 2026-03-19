import type {
  ExpectedRepeatPlacement,
  MomentFamily,
  RepeatPlan,
  RepeatRule,
} from "./playerMomentSimilarityTypes";

type PlacementMatch = {
  key: string;
  nearestActualStart: number | null;
  matchedSectionId: string | null;
  bestDiff: number;
};

function toFixed3(value: number): number {
  return Number(value.toFixed(3));
}

function getUnitSeconds(unit: RepeatRule["unit"], tempoBpm?: number | null): number {
  if (unit === "seconds") return 1;

  const safeTempo = Number.isFinite(tempoBpm) && tempoBpm! > 0 ? tempoBpm! : 120;
  const beatSeconds = 60 / safeTempo;

  if (unit === "beats") return beatSeconds;
  return beatSeconds * 4;
}

function getIntervalSeconds(rule: RepeatRule, tempoBpm?: number | null): number {
  const seconds = rule.every * getUnitSeconds(rule.unit, tempoBpm);
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return seconds;
}

function getMaxDifferenceSeconds(rule: RepeatRule, tempoBpm?: number | null): number {
  const intervalSeconds = getIntervalSeconds(rule, tempoBpm);

  if (
    Number.isFinite(rule.maxDifferencePercent) &&
    rule.maxDifferencePercent! >= 0 &&
    intervalSeconds > 0
  ) {
    return intervalSeconds * (rule.maxDifferencePercent! / 100);
  }

  return Math.max(0.25, intervalSeconds * 0.05);
}

function getPlanEndAt(family: MomentFamily, rule: RepeatRule): number {
  if (Number.isFinite(rule.endAt)) {
    return Number(rule.endAt);
  }

  return family.members.at(-1)?.moment.startTime ?? rule.startAt;
}

function buildMemberKey(sectionId: string | null | undefined, actualStart: number): string {
  return `${String(sectionId ?? "").trim()}|${toFixed3(actualStart)}`;
}

function findNearestUnusedPlacementMatch(params: {
  family: MomentFamily;
  expectedAt: number;
  usedKeys: Set<string>;
  maxDifferenceSeconds: number;
}): PlacementMatch {
  const { family, expectedAt, usedKeys, maxDifferenceSeconds } = params;

  let bestUnused: PlacementMatch | null = null;
  let bestOverall: PlacementMatch | null = null;

  for (const member of family.members) {
    const actualStart = member.moment.startTime;
    const matchedSectionId = member.moment.sectionId;
    const key = buildMemberKey(matchedSectionId, actualStart);
    const bestDiff = Math.abs(actualStart - expectedAt);

    const candidate: PlacementMatch = {
      key,
      nearestActualStart: actualStart,
      matchedSectionId,
      bestDiff,
    };

    if (!bestOverall || candidate.bestDiff < bestOverall.bestDiff) {
      bestOverall = candidate;
    }

    if (usedKeys.has(key)) continue;

    if (!bestUnused || candidate.bestDiff < bestUnused.bestDiff) {
      bestUnused = candidate;
    }
  }

  if (bestUnused) {
    if (bestUnused.bestDiff <= maxDifferenceSeconds) {
      usedKeys.add(bestUnused.key);
    }
    return bestUnused;
  }

  return (
    bestOverall ?? {
      key: "",
      nearestActualStart: null,
      matchedSectionId: null,
      bestDiff: Number.POSITIVE_INFINITY,
    }
  );
}

function getPlacementStatus(params: {
  nearestActualStart: number | null;
  bestDiff: number;
  maxDifferenceSeconds: number;
}): "matched" | "near" | "missing" {
  const { nearestActualStart, bestDiff, maxDifferenceSeconds } = params;

  if (nearestActualStart == null) return "missing";
  if (bestDiff <= Math.max(0.2, maxDifferenceSeconds * 0.35)) return "matched";
  if (bestDiff <= maxDifferenceSeconds) return "near";
  return "missing";
}

function buildPlacement(params: {
  familyId: string;
  expectedAt: number;
  nearestActualStart: number | null;
  matchedSectionId: string | null;
  status: "matched" | "near" | "missing";
}): ExpectedRepeatPlacement {
  const {
    familyId,
    expectedAt,
    nearestActualStart,
    matchedSectionId,
    status,
  } = params;

  return {
    familyId,
    expectedAt: toFixed3(expectedAt),
    nearestActualStart:
      nearestActualStart == null ? null : toFixed3(nearestActualStart),
    matchedSectionId,
    differenceSeconds:
      nearestActualStart == null ? null : toFixed3(Math.abs(nearestActualStart - expectedAt)),
    status,
  };
}

export function buildRepeatPlan(params: {
  family: MomentFamily;
  rule: RepeatRule;
  tempoBpm?: number | null;
}): RepeatPlan {
  const { family, rule, tempoBpm } = params;

  const intervalSeconds = getIntervalSeconds(rule, tempoBpm);
  const endAt = getPlanEndAt(family, rule);
  const maxDifferenceSeconds = getMaxDifferenceSeconds(rule, tempoBpm);

  const placements: ExpectedRepeatPlacement[] = [];

  if (!Number.isFinite(rule.startAt) || !Number.isFinite(endAt) || intervalSeconds <= 0) {
    return {
      familyId: family.familyId,
      rule,
      placements,
    };
  }

  const usedKeys = new Set<string>();

  for (
    let expectedAt = rule.startAt;
    expectedAt <= endAt + 0.0001;
    expectedAt += intervalSeconds
  ) {
    const nearest = findNearestUnusedPlacementMatch({
      family,
      expectedAt,
      usedKeys,
      maxDifferenceSeconds,
    });

    const status = getPlacementStatus({
      nearestActualStart: nearest.nearestActualStart,
      bestDiff: nearest.bestDiff,
      maxDifferenceSeconds,
    });

    placements.push(
      buildPlacement({
        familyId: family.familyId,
        expectedAt,
        nearestActualStart: nearest.nearestActualStart,
        matchedSectionId: nearest.matchedSectionId,
        status,
      })
    );

    if (placements.length > 256) break;
  }

  return {
    familyId: family.familyId,
    rule,
    placements,
  };
}