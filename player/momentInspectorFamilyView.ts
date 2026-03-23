import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";
import type {
  PhraseDriftEngineResult,
  PhraseDriftLabel,
  PhraseDriftSeverity,
} from "./playerMomentPhraseDrift";

export type InspectorFamilyRow = {
  familyId: string;
  size: number;
  strongestScore: number;
  averageScore: number;
  repeatIntervalHint: number | null;
  driftComparedMemberCount: number;
  driftStableCount: number;
  driftUnstableCount: number;
  dominantDriftLabel: PhraseDriftLabel | null;
  highestDriftSeverity: PhraseDriftSeverity | null;
  averageAbsoluteTimingOffset: number | null;
  averageAbsoluteDurationDrift: number | null;
};

export type InspectorFamilyMemberRow = {
  momentId: string;
  similarityToAnchor: number;
  driftLabel: PhraseDriftLabel | null;
  driftSeverity: PhraseDriftSeverity | null;
  timingOffset: number | null;
  durationDrift: number | null;
  confidenceScore: number | null;
  expectedStartTime: number | null;
  actualStartTime: number | null;
};

export type InspectorFamilyView = {
  rows: InspectorFamilyRow[];
  membersByFamily: Record<string, InspectorFamilyMemberRow[]>;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizePercent(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round3(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(3));
}

function normalizeDriftLabel(value: unknown): PhraseDriftLabel | null {
  if (
    value === "stable" ||
    value === "early" ||
    value === "late" ||
    value === "stretched" ||
    value === "compressed" ||
    value === "mixed"
  ) {
    return value;
  }

  return null;
}

function normalizeDriftSeverity(value: unknown): PhraseDriftSeverity | null {
  if (value === "none" || value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return null;
}

function getDriftSeverityRank(value: PhraseDriftSeverity | null): number {
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

function getDriftLabelRank(value: PhraseDriftLabel | null): number {
  if (value === "mixed") return 5;
  if (value === "late") return 4;
  if (value === "early") return 3;
  if (value === "stretched") return 2;
  if (value === "compressed") return 1;
  return 0;
}

function getMomentIdFromFamilyMember(member: unknown): string {
  if (!member || typeof member !== "object") return "";

  const candidate = member as {
    momentId?: unknown;
    id?: unknown;
    moment?: {
      id?: unknown;
      momentId?: unknown;
    } | null;
  };

  return normalizeText(
    candidate.moment?.id ??
      candidate.moment?.momentId ??
      candidate.momentId ??
      candidate.id ??
      ""
  );
}

function buildFamilyConfidence(params: {
  size: number;
  strongestScore: number;
  averageScore: number;
  driftUnstableCount: number;
  highestDriftSeverity: PhraseDriftSeverity | null;
}): number {
  const {
    size,
    strongestScore,
    averageScore,
    driftUnstableCount,
    highestDriftSeverity,
  } = params;

  const sizeBoost = Math.min(1, size / 5);
  const driftPenalty =
    driftUnstableCount * 0.08 + getDriftSeverityRank(highestDriftSeverity) * 0.07;

  const score =
    strongestScore * 0.35 + averageScore * 0.4 + sizeBoost * 0.25 - driftPenalty;

  return normalizePercent(score);
}

function buildTimingSpread(
  members: InspectorFamilyMemberRow[],
  repeatIntervalHint: number | null
): number | null {
  const actualStarts = members
    .map((member) => member.actualStartTime)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  if (actualStarts.length >= 2) {
    return round3(actualStarts[actualStarts.length - 1] - actualStarts[0]);
  }

  if (repeatIntervalHint !== null) {
    return round3(repeatIntervalHint);
  }

  return null;
}

export function buildInspectorFamilyView(
  families: MomentFamilyEngineFamily[],
  driftResult?: PhraseDriftEngineResult | null
): InspectorFamilyView {
  const rows: InspectorFamilyRow[] = [];
  const membersByFamily: Record<string, InspectorFamilyMemberRow[]> = {};

  for (const family of families) {
    const familyId = normalizeText(family.id);
    if (!familyId) continue;

    const driftFamily = driftResult?.byFamilyId?.[familyId] ?? null;

    const driftMembersByMomentId = new Map(
      (driftFamily?.members ?? []).map((member) => [normalizeText(member.momentId), member] as const)
    );

    const familyMembers: InspectorFamilyMemberRow[] = family.members
      .map((member) => {
        const momentId = getMomentIdFromFamilyMember(member);
        const driftMember = driftMembersByMomentId.get(momentId);

        return {
          momentId,
          similarityToAnchor: normalizePercent(member.similarityToAnchor),
          driftLabel: normalizeDriftLabel(driftMember?.driftLabel ?? null),
          driftSeverity: normalizeDriftSeverity(driftMember?.driftSeverity ?? null),
          timingOffset: round3(toNumberOrNull(driftMember?.timingOffset ?? null)),
          durationDrift: round3(toNumberOrNull(driftMember?.durationDrift ?? null)),
          confidenceScore: round3(toNumberOrNull(driftMember?.confidenceScore ?? null)),
          expectedStartTime: round3(toNumberOrNull(driftMember?.expectedStartTime ?? null)),
          actualStartTime: round3(toNumberOrNull(driftMember?.actualStartTime ?? null)),
        };
      })
      .sort((a, b) => {
        const severityCompare =
          getDriftSeverityRank(b.driftSeverity) - getDriftSeverityRank(a.driftSeverity);
        if (severityCompare !== 0) return severityCompare;

        if (b.similarityToAnchor !== a.similarityToAnchor) {
          return b.similarityToAnchor - a.similarityToAnchor;
        }

        const timingA = Math.abs(a.timingOffset ?? 0);
        const timingB = Math.abs(b.timingOffset ?? 0);
        if (timingB !== timingA) return timingB - timingA;

        return a.momentId.localeCompare(b.momentId);
      });

    membersByFamily[familyId] = familyMembers;

    const strongestScore = normalizePercent(family.strongestScore);
    const averageScore = normalizePercent(family.averageScore);
    const highestDriftSeverity = normalizeDriftSeverity(driftFamily?.highestSeverity ?? null);
    const driftUnstableCount = driftFamily?.unstableCount ?? 0;

    const row: InspectorFamilyRow = {
      familyId,
      size: family.size,
      strongestScore,
      averageScore,
      repeatIntervalHint: round3(toNumberOrNull(family.repeatIntervalHint ?? null)),
      driftComparedMemberCount: driftFamily?.comparedMemberCount ?? 0,
      driftStableCount: driftFamily?.stableCount ?? 0,
      driftUnstableCount,
      dominantDriftLabel: normalizeDriftLabel(driftFamily?.dominantDriftLabel ?? null),
      highestDriftSeverity,
      averageAbsoluteTimingOffset: round3(
        toNumberOrNull(driftFamily?.averageAbsoluteTimingOffset ?? null)
      ),
      averageAbsoluteDurationDrift: round3(
        toNumberOrNull(driftFamily?.averageAbsoluteDurationDrift ?? null)
      ),
    };

    const familyConfidence = buildFamilyConfidence({
      size: row.size,
      strongestScore: row.strongestScore,
      averageScore: row.averageScore,
      driftUnstableCount: row.driftUnstableCount,
      highestDriftSeverity: row.highestDriftSeverity,
    });

    const timingSpread = buildTimingSpread(familyMembers, row.repeatIntervalHint);

    rows.push({
      ...row,
      strongestScore: row.strongestScore,
      averageScore: Math.max(row.averageScore, familyConfidence * 0.98),
      repeatIntervalHint:
        row.repeatIntervalHint !== null ? row.repeatIntervalHint : timingSpread,
    });
  }

  rows.sort((a, b) => {
    const severityCompare =
      getDriftSeverityRank(b.highestDriftSeverity) - getDriftSeverityRank(a.highestDriftSeverity);
    if (severityCompare !== 0) return severityCompare;

    if (b.driftUnstableCount !== a.driftUnstableCount) {
      return b.driftUnstableCount - a.driftUnstableCount;
    }

    if (b.size !== a.size) return b.size - a.size;

    if (b.averageScore !== a.averageScore) {
      return b.averageScore - a.averageScore;
    }

    if (b.strongestScore !== a.strongestScore) {
      return b.strongestScore - a.strongestScore;
    }

    const labelCompare =
      getDriftLabelRank(b.dominantDriftLabel) - getDriftLabelRank(a.dominantDriftLabel);
    if (labelCompare !== 0) return labelCompare;

    return a.familyId.localeCompare(b.familyId);
  });

  return {
    rows,
    membersByFamily,
  };
}