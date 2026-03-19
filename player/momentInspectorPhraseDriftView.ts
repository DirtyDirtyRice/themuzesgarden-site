import type {
  PhraseDriftEngineResult,
  PhraseDriftFamilyResult,
  PhraseDriftLabel,
  PhraseDriftMemberResult,
  PhraseDriftSeverity,
} from "./playerMomentPhraseDrift";

export type InspectorPhraseDriftFamilyRow = {
  familyId: string;
  anchorMomentId: string;
  repeatIntervalHint: number | null;
  comparedMemberCount: number;
  stableCount: number;
  unstableCount: number;
  dominantDriftLabel: PhraseDriftLabel;
  highestSeverity: PhraseDriftSeverity;
  averageAbsoluteTimingOffset: number | null;
  averageAbsoluteDurationDrift: number | null;
  driftHealthScore: number;
};

export type InspectorPhraseDriftMemberRow = {
  familyId: string;
  anchorMomentId: string;
  momentId: string;
  memberIndex: number;
  expectedStartTime: number | null;
  actualStartTime: number | null;
  timingOffset: number | null;
  durationDrift: number | null;
  driftLabel: PhraseDriftLabel;
  driftSeverity: PhraseDriftSeverity;
  confidenceScore: number;
};

export type InspectorPhraseDriftView = {
  familyRows: InspectorPhraseDriftFamilyRow[];
  membersByFamily: Record<string, InspectorPhraseDriftMemberRow[]>;
  byFamilyId: Record<string, InspectorPhraseDriftFamilyRow>;
};

function toNumberOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function clamp100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function clampCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

function clampNonNegativeInt(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function getPhraseDriftLabelUi(label: PhraseDriftLabel): string {
  if (label === "stable") return "STABLE";
  if (label === "early") return "EARLY";
  if (label === "late") return "LATE";
  if (label === "stretched") return "STRETCHED";
  if (label === "compressed") return "COMPRESSED";
  return "MIXED";
}

export function getPhraseDriftSeverityUi(severity: PhraseDriftSeverity): string {
  if (severity === "none") return "NONE";
  if (severity === "low") return "LOW";
  if (severity === "medium") return "MEDIUM";
  return "HIGH";
}

export function getPhraseDriftSeverityRank(severity: PhraseDriftSeverity): number {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  if (severity === "low") return 1;
  return 0;
}

export function getPhraseDriftLabelRank(label: PhraseDriftLabel): number {
  if (label === "mixed") return 5;
  if (label === "late") return 4;
  if (label === "early") return 3;
  if (label === "stretched") return 2;
  if (label === "compressed") return 1;
  return 0;
}

function getMemberInstabilityRatio(family: PhraseDriftFamilyResult): number {
  const compared = Math.max(1, clampCount(family.comparedMemberCount));
  const unstable = clampCount(family.unstableCount);
  return unstable / compared;
}

function buildDriftHealthScore(family: PhraseDriftFamilyResult): number {
  const unstableRatio = getMemberInstabilityRatio(family);

  const timingPenalty = Math.min(
    0.3,
    Math.abs(Number(family.averageAbsoluteTimingOffset ?? 0)) * 0.18
  );

  const durationPenalty = Math.min(
    0.24,
    Math.abs(Number(family.averageAbsoluteDurationDrift ?? 0)) * 0.22
  );

  const severityPenalty =
    family.highestSeverity === "high"
      ? 0.22
      : family.highestSeverity === "medium"
        ? 0.12
        : family.highestSeverity === "low"
          ? 0.05
          : 0;

  const dominantLabelPenalty =
    family.dominantDriftLabel === "mixed"
      ? 0.08
      : family.dominantDriftLabel === "late" || family.dominantDriftLabel === "early"
        ? 0.04
        : 0;

  const raw =
    1 -
    unstableRatio * 0.46 -
    timingPenalty -
    durationPenalty -
    severityPenalty -
    dominantLabelPenalty;

  return Number(clamp100(clamp01(raw) * 100).toFixed(1));
}

function buildFamilyRow(
  family: PhraseDriftFamilyResult
): InspectorPhraseDriftFamilyRow {
  return {
    familyId: normalizeText(family.familyId),
    anchorMomentId: normalizeText(family.anchorMomentId),
    repeatIntervalHint: toNumberOrNull(family.repeatIntervalHint),
    comparedMemberCount: clampCount(family.comparedMemberCount),
    stableCount: clampCount(family.stableCount),
    unstableCount: clampCount(family.unstableCount),
    dominantDriftLabel: family.dominantDriftLabel,
    highestSeverity: family.highestSeverity,
    averageAbsoluteTimingOffset: toNumberOrNull(
      family.averageAbsoluteTimingOffset
    ),
    averageAbsoluteDurationDrift: toNumberOrNull(
      family.averageAbsoluteDurationDrift
    ),
    driftHealthScore: buildDriftHealthScore(family),
  };
}

function buildMemberRow(
  member: PhraseDriftMemberResult
): InspectorPhraseDriftMemberRow {
  return {
    familyId: normalizeText(member.familyId),
    anchorMomentId: normalizeText(member.anchorMomentId),
    momentId: normalizeText(member.momentId),
    memberIndex: clampNonNegativeInt(member.memberIndex),
    expectedStartTime: toNumberOrNull(member.expectedStartTime),
    actualStartTime: toNumberOrNull(member.actualStartTime),
    timingOffset: toNumberOrNull(member.timingOffset),
    durationDrift: toNumberOrNull(member.durationDrift),
    driftLabel: member.driftLabel,
    driftSeverity: member.driftSeverity,
    confidenceScore: Number(clamp01(Number(member.confidenceScore)).toFixed(3)),
  };
}

function compareFamilyRows(
  a: InspectorPhraseDriftFamilyRow,
  b: InspectorPhraseDriftFamilyRow
): number {
  const severityCompare =
    getPhraseDriftSeverityRank(b.highestSeverity) -
    getPhraseDriftSeverityRank(a.highestSeverity);

  if (severityCompare !== 0) return severityCompare;

  if (a.unstableCount !== b.unstableCount) {
    return b.unstableCount - a.unstableCount;
  }

  if (a.driftHealthScore !== b.driftHealthScore) {
    return a.driftHealthScore - b.driftHealthScore;
  }

  const labelCompare =
    getPhraseDriftLabelRank(b.dominantDriftLabel) -
    getPhraseDriftLabelRank(a.dominantDriftLabel);

  if (labelCompare !== 0) return labelCompare;

  const timingA = Math.abs(a.averageAbsoluteTimingOffset ?? 0);
  const timingB = Math.abs(b.averageAbsoluteTimingOffset ?? 0);

  if (timingA !== timingB) return timingB - timingA;

  const durationA = Math.abs(a.averageAbsoluteDurationDrift ?? 0);
  const durationB = Math.abs(b.averageAbsoluteDurationDrift ?? 0);

  if (durationA !== durationB) return durationB - durationA;

  return a.familyId.localeCompare(b.familyId);
}

function compareMemberRows(
  a: InspectorPhraseDriftMemberRow,
  b: InspectorPhraseDriftMemberRow
): number {
  const severityCompare =
    getPhraseDriftSeverityRank(b.driftSeverity) -
    getPhraseDriftSeverityRank(a.driftSeverity);

  if (severityCompare !== 0) return severityCompare;

  const labelCompare =
    getPhraseDriftLabelRank(b.driftLabel) -
    getPhraseDriftLabelRank(a.driftLabel);

  if (labelCompare !== 0) return labelCompare;

  const timingA = Math.abs(a.timingOffset ?? 0);
  const timingB = Math.abs(b.timingOffset ?? 0);

  if (timingA !== timingB) return timingB - timingA;

  const durationA = Math.abs(a.durationDrift ?? 0);
  const durationB = Math.abs(b.durationDrift ?? 0);

  if (durationA !== durationB) return durationB - durationA;

  if (a.confidenceScore !== b.confidenceScore) {
    return a.confidenceScore - b.confidenceScore;
  }

  return a.memberIndex - b.memberIndex;
}

export function buildInspectorPhraseDriftView(
  driftResult: PhraseDriftEngineResult | null | undefined
): InspectorPhraseDriftView {
  const familyRows: InspectorPhraseDriftFamilyRow[] = [];
  const membersByFamily: Record<string, InspectorPhraseDriftMemberRow[]> = {};
  const byFamilyId: Record<string, InspectorPhraseDriftFamilyRow> = {};

  for (const family of driftResult?.families ?? []) {
    const familyRow = buildFamilyRow(family);
    if (!familyRow.familyId) continue;

    familyRows.push(familyRow);
    byFamilyId[familyRow.familyId] = familyRow;

    membersByFamily[familyRow.familyId] = (family.members ?? [])
      .map(buildMemberRow)
      .filter((member) => Boolean(member.momentId))
      .sort(compareMemberRows);
  }

  familyRows.sort(compareFamilyRows);

  return {
    familyRows,
    membersByFamily,
    byFamilyId,
  };
}