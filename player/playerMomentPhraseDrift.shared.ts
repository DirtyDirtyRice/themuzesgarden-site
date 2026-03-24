import type { MomentSimilarityComparable } from "./playerMomentSimilarityTypes";
import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";
import type {
  PhraseDriftFamilyResult,
  PhraseDriftLabel,
  PhraseDriftMemberResult,
  PhraseDriftSeverity,
} from "./playerMomentPhraseDrift.types";

export function clamp01(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function round3(value: number): number {
  return Number(value.toFixed(3));
}

export function getMomentId(moment: MomentSimilarityComparable): string {
  return String((moment as { momentId?: unknown }).momentId ?? moment.sectionId ?? "").trim();
}

export function getMomentStart(moment: MomentSimilarityComparable): number | null {
  const n = Number(moment.startTime);
  return Number.isFinite(n) ? round3(n) : null;
}

export function getMomentDuration(moment: MomentSimilarityComparable): number | null {
  const durationLike = moment as { duration?: unknown; endTime?: unknown; startTime?: unknown };

  const explicitDuration = Number(durationLike.duration);
  if (Number.isFinite(explicitDuration) && explicitDuration >= 0) {
    return round3(explicitDuration);
  }

  const start = Number(durationLike.startTime);
  const end = Number(durationLike.endTime);

  if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
    return round3(end - start);
  }

  return null;
}

export function buildAverageAbsolute(
  values: Array<number | null | undefined>
): number | null {
  const clean = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.abs(value));

  if (!clean.length) return null;

  const average = clean.reduce((sum, value) => sum + value, 0) / clean.length;
  return round3(average);
}

export function buildFallbackRepeatInterval(
  orderedMembers: MomentSimilarityComparable[]
): number | null {
  if (orderedMembers.length < 2) return null;

  const starts = orderedMembers
    .map((moment) => getMomentStart(moment))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  if (starts.length < 2) return null;

  const gaps: number[] = [];

  for (let i = 1; i < starts.length; i += 1) {
    const gap = starts[i]! - starts[i - 1]!;
    if (gap > 0) gaps.push(gap);
  }

  if (!gaps.length) return null;

  const averageGap = gaps.reduce((sum, value) => sum + value, 0) / gaps.length;
  return round3(averageGap);
}

export function getValidRepeatIntervalHint(
  family: MomentFamilyEngineFamily
): number | null {
  const n = Number(family.repeatIntervalHint);
  return Number.isFinite(n) && n > 0 ? round3(n) : null;
}

export function getDominantLabel(
  members: PhraseDriftMemberResult[]
): PhraseDriftLabel {
  if (!members.length) return "stable";

  const counts = new Map<PhraseDriftLabel, number>();

  for (const member of members) {
    const label = member.driftLabel;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  let bestLabel: PhraseDriftLabel = "stable";
  let bestCount = -1;

  for (const [label, count] of counts.entries()) {
    if (count > bestCount) {
      bestLabel = label;
      bestCount = count;
    }
  }

  return bestLabel;
}

function getSeverityRank(severity: PhraseDriftSeverity): number {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  if (severity === "low") return 1;
  return 0;
}

export function getHighestSeverity(
  members: PhraseDriftMemberResult[]
): PhraseDriftSeverity {
  let highest: PhraseDriftSeverity = "none";

  for (const member of members) {
    if (getSeverityRank(member.driftSeverity) > getSeverityRank(highest)) {
      highest = member.driftSeverity;
    }
  }

  return highest;
}

export function buildFamilyConfidenceScore(
  family: PhraseDriftFamilyResult | null | undefined
): number {
  if (!family?.members?.length) return 0;

  const avg =
    family.members.reduce(
      (sum, member) => sum + clamp01(member.confidenceScore),
      0
    ) / family.members.length;

  return round3(clamp01(avg));
}
