import type { ComparableMoment } from "./playerMomentSimilarityTypes";
import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";
import type {
  PhraseDriftFamilyResult,
  PhraseDriftLabel,
  PhraseDriftMemberResult,
  PhraseDriftSeverity,
} from "./playerMomentPhraseDrift.types";

export function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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

export function getMomentId(moment: ComparableMoment | null | undefined): string {
  return String(moment?.id ?? "").trim();
}

export function getMomentStart(
  moment: ComparableMoment | null | undefined
): number | null {
  const direct = toNumber((moment as { startTime?: unknown } | null)?.startTime);
  if (direct !== null) return direct;

  const alt = toNumber((moment as { start?: unknown } | null)?.start);
  if (alt !== null) return alt;

  return null;
}

export function getMomentEnd(
  moment: ComparableMoment | null | undefined
): number | null {
  const direct = toNumber((moment as { endTime?: unknown } | null)?.endTime);
  if (direct !== null) return direct;

  const alt = toNumber((moment as { end?: unknown } | null)?.end);
  if (alt !== null) return alt;

  return null;
}

export function getMomentDuration(
  moment: ComparableMoment | null | undefined
): number | null {
  const direct = toNumber((moment as { duration?: unknown } | null)?.duration);
  if (direct !== null && direct >= 0) return direct;

  const start = getMomentStart(moment);
  const end = getMomentEnd(moment);

  if (start !== null && end !== null && end >= start) {
    return round3(end - start);
  }

  return null;
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function maxAbs(values: Array<number | null | undefined>): number {
  let best = 0;

  for (const value of values) {
    const n = Math.abs(Number(value ?? 0));
    if (Number.isFinite(n) && n > best) {
      best = n;
    }
  }

  return best;
}

export function getSeverityRank(severity: PhraseDriftSeverity): number {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  if (severity === "low") return 1;
  return 0;
}

export function getDominantLabel(
  rows: PhraseDriftMemberResult[]
): PhraseDriftLabel {
  if (!rows.length) return "stable";

  const counts = new Map<PhraseDriftLabel, number>();

  for (const row of rows) {
    counts.set(row.driftLabel, (counts.get(row.driftLabel) ?? 0) + 1);
  }

  const ordered: PhraseDriftLabel[] = [
    "mixed",
    "late",
    "early",
    "stretched",
    "compressed",
    "stable",
  ];

  return ordered.reduce((best, current) => {
    const currentCount = counts.get(current) ?? 0;
    const bestCount = counts.get(best) ?? 0;
    if (currentCount > bestCount) return current;
    return best;
  }, "stable" as PhraseDriftLabel);
}

export function getHighestSeverity(
  rows: PhraseDriftMemberResult[]
): PhraseDriftSeverity {
  let best: PhraseDriftSeverity = "none";

  for (const row of rows) {
    if (getSeverityRank(row.driftSeverity) > getSeverityRank(best)) {
      best = row.driftSeverity;
    }
  }

  return best;
}

export function getValidRepeatIntervalHint(
  family: MomentFamilyEngineFamily
): number | null {
  const value = toNumber(family.repeatIntervalHint);
  if (value === null || value <= 0) return null;
  return round3(value);
}

export function buildObservedIntervals(
  orderedMembers: ComparableMoment[]
): number[] {
  const values: number[] = [];

  for (let i = 1; i < orderedMembers.length; i += 1) {
    const prevStart = getMomentStart(orderedMembers[i - 1]);
    const currentStart = getMomentStart(orderedMembers[i]);

    if (
      prevStart !== null &&
      currentStart !== null &&
      currentStart >= prevStart
    ) {
      values.push(round3(currentStart - prevStart));
    }
  }

  return values;
}

export function buildFallbackRepeatInterval(
  orderedMembers: ComparableMoment[]
): number | null {
  const observed = buildObservedIntervals(orderedMembers);
  const avgObserved = average(observed);

  if (avgObserved === null || avgObserved <= 0) return null;
  return round3(avgObserved);
}

export function sortFamilyMembers(
  family: MomentFamilyEngineFamily,
  momentsById: Map<string, ComparableMoment>
): ComparableMoment[] {
  return family.members
    .map((member) => momentsById.get(String(member.momentId ?? "").trim()))
    .filter((moment): moment is ComparableMoment => Boolean(moment))
    .sort((a, b) => {
      const startA = getMomentStart(a);
      const startB = getMomentStart(b);

      if (startA !== null && startB !== null && startA !== startB) {
        return startA - startB;
      }

      if (startA !== null && startB === null) return -1;
      if (startA === null && startB !== null) return 1;

      return getMomentId(a).localeCompare(getMomentId(b));
    });
}

export function buildAverageAbsolute(
  values: Array<number | null | undefined>
): number | null {
  const filtered = values
    .filter((value): value is number => value !== null && value !== undefined)
    .map((value) => Math.abs(value));

  const avg = average(filtered);
  return avg === null ? null : round3(avg);
}

export function comparePhraseDriftFamilies(
  a: PhraseDriftFamilyResult,
  b: PhraseDriftFamilyResult
): number {
  const aSeverity = getSeverityRank(a.highestSeverity);
  const bSeverity = getSeverityRank(b.highestSeverity);

  if (aSeverity !== bSeverity) {
    return bSeverity - aSeverity;
  }

  if (a.unstableCount !== b.unstableCount) {
    return b.unstableCount - a.unstableCount;
  }

  const aTiming = maxAbs([a.averageAbsoluteTimingOffset]);
  const bTiming = maxAbs([b.averageAbsoluteTimingOffset]);

  if (aTiming !== bTiming) {
    return bTiming - aTiming;
  }

  const aDuration = maxAbs([a.averageAbsoluteDurationDrift]);
  const bDuration = maxAbs([b.averageAbsoluteDurationDrift]);

  if (aDuration !== bDuration) {
    return bDuration - aDuration;
  }

  return a.familyId.localeCompare(b.familyId);
}