import type { MomentFamilyEngineFamily } from "./playerMomentFamilyEngine";
import type {
  PhraseDriftFamilyResult,
  PhraseDriftLabel,
  PhraseDriftMemberResult,
  PhraseDriftSeverity,
} from "./playerMomentPhraseDrift.types";

import {
  clamp01,
  getDominantLabel,
  getHighestSeverity,
  getMomentDuration,
  getMomentId,
  getMomentStart,
  round3,
  buildAverageAbsolute,
  buildFallbackRepeatInterval,
  getValidRepeatIntervalHint,
} from "./playerMomentPhraseDrift.shared";

type ComparableMoment = {
  id?: string;
  sectionId?: string;
  startTime?: number | null;
  endTime?: number | null;
  duration?: number | null;
  label?: string;
  description?: string;
  tags?: string[];
  trackId?: string;
  [key: string]: any;
};

export function buildExpectedStartTime(params: {
  anchorStart: number | null;
  repeatIntervalHint: number | null;
  fallbackRepeatInterval: number | null;
  memberIndex: number;
  actualStart: number | null;
}): number | null {
  const {
    anchorStart,
    repeatIntervalHint,
    fallbackRepeatInterval,
    memberIndex,
    actualStart,
  } = params;

  const interval = repeatIntervalHint ?? fallbackRepeatInterval;

  if (anchorStart !== null && interval !== null && interval > 0) {
    return round3(anchorStart + interval * memberIndex);
  }

  return actualStart;
}

export function buildTimingOffset(
  expectedStart: number | null,
  actualStart: number | null
): number | null {
  if (expectedStart === null || actualStart === null) return null;
  return round3(actualStart - expectedStart);
}

export function buildDurationDrift(
  anchorDuration: number | null,
  actualDuration: number | null
): number | null {
  if (anchorDuration === null || actualDuration === null) return null;
  return round3(actualDuration - anchorDuration);
}

export function buildDriftLabel(params: {
  timingOffset: number | null;
  durationDrift: number | null;
  earlyLateTolerance: number;
  durationTolerance: number;
}): PhraseDriftLabel {
  const {
    timingOffset,
    durationDrift,
    earlyLateTolerance,
    durationTolerance,
  } = params;

  const timingState =
    timingOffset === null
      ? "none"
      : timingOffset <= -earlyLateTolerance
        ? "early"
        : timingOffset >= earlyLateTolerance
          ? "late"
          : "stable";

  const durationState =
    durationDrift === null
      ? "none"
      : durationDrift >= durationTolerance
        ? "stretched"
        : durationDrift <= -durationTolerance
          ? "compressed"
          : "stable";

  const timingChanged = timingState === "early" || timingState === "late";
  const durationChanged =
    durationState === "stretched" || durationState === "compressed";

  if (!timingChanged && !durationChanged) return "stable";

  if (
    (timingState === "early" && durationState === "stretched") ||
    (timingState === "late" && durationState === "compressed")
  ) {
    return "mixed";
  }

  if (timingChanged && durationChanged) {
    return "mixed";
  }

  if (timingState === "early") return "early";
  if (timingState === "late") return "late";
  if (durationState === "stretched") return "stretched";
  if (durationState === "compressed") return "compressed";

  return "stable";
}

export function buildDriftSeverity(params: {
  timingOffset: number | null;
  durationDrift: number | null;
  mediumTimingThreshold: number;
  highTimingThreshold: number;
  mediumDurationThreshold: number;
  highDurationThreshold: number;
}): PhraseDriftSeverity {
  const {
    timingOffset,
    durationDrift,
    mediumTimingThreshold,
    highTimingThreshold,
    mediumDurationThreshold,
    highDurationThreshold,
  } = params;

  const absTiming = Math.abs(timingOffset ?? 0);
  const absDuration = Math.abs(durationDrift ?? 0);

  if (absTiming >= highTimingThreshold || absDuration >= highDurationThreshold) {
    return "high";
  }

  if (
    absTiming >= mediumTimingThreshold ||
    absDuration >= mediumDurationThreshold
  ) {
    return "medium";
  }

  if (absTiming > 0 || absDuration > 0) {
    return "low";
  }

  return "none";
}

export function buildConfidenceScore(params: {
  expectedStartTime: number | null;
  actualStartTime: number | null;
  anchorDuration: number | null;
  actualDuration: number | null;
  driftSeverity: PhraseDriftSeverity;
  driftLabel: PhraseDriftLabel;
  timingOffset: number | null;
  durationDrift: number | null;
  mediumTimingThreshold: number;
  highTimingThreshold: number;
  mediumDurationThreshold: number;
  highDurationThreshold: number;
}): number {
  const {
    expectedStartTime,
    actualStartTime,
    anchorDuration,
    actualDuration,
    driftSeverity,
    driftLabel,
    timingOffset,
    durationDrift,
    mediumTimingThreshold,
    highTimingThreshold,
    mediumDurationThreshold,
    highDurationThreshold,
  } = params;

  let score = 1;

  if (expectedStartTime === null || actualStartTime === null) {
    score -= 0.22;
  }

  if (anchorDuration === null || actualDuration === null) {
    score -= 0.18;
  }

  if (driftLabel === "mixed") {
    score -= 0.12;
  }

  if (driftSeverity === "medium") {
    score -= 0.08;
  }

  if (driftSeverity === "high") {
    score -= 0.16;
  }

  const timingPressure =
    mediumTimingThreshold > 0
      ? clamp01(Math.abs(timingOffset ?? 0) / highTimingThreshold)
      : 0;

  const durationPressure =
    mediumDurationThreshold > 0
      ? clamp01(Math.abs(durationDrift ?? 0) / highDurationThreshold)
      : 0;

  score -= timingPressure * 0.12;
  score -= durationPressure * 0.12;

  return round3(clamp01(score));
}

export function buildPhraseDriftFamilyResult(params: {
  family: MomentFamilyEngineFamily;
  orderedMembers: ComparableMoment[];
  earlyLateTolerance: number;
  durationTolerance: number;
  mediumTimingThreshold: number;
  highTimingThreshold: number;
  mediumDurationThreshold: number;
  highDurationThreshold: number;
  byMomentId: Record<string, PhraseDriftMemberResult>;
}): PhraseDriftFamilyResult | null {
  const {
    family,
    orderedMembers,
    earlyLateTolerance,
    durationTolerance,
    mediumTimingThreshold,
    highTimingThreshold,
    mediumDurationThreshold,
    highDurationThreshold,
    byMomentId,
  } = params;

  if (orderedMembers.length < 2) return null;

  const anchor = orderedMembers[0];
  const anchorMomentId = getMomentId(anchor as any);
  const anchorStart = getMomentStart(anchor as any);
  const anchorDuration = getMomentDuration(anchor as any);
  const repeatIntervalHint = getValidRepeatIntervalHint(family);
  const fallbackRepeatInterval = buildFallbackRepeatInterval(orderedMembers as any);

  const memberRows: PhraseDriftMemberResult[] = [];

  for (let i = 1; i < orderedMembers.length; i += 1) {
    const moment = orderedMembers[i];
    const momentId = getMomentId(moment as any);
    const actualStartTime = getMomentStart(moment as any);
    const actualDuration = getMomentDuration(moment as any);

    const expectedStartTime = buildExpectedStartTime({
      anchorStart,
      repeatIntervalHint,
      fallbackRepeatInterval,
      memberIndex: i,
      actualStart: actualStartTime,
    });

    const timingOffset = buildTimingOffset(expectedStartTime, actualStartTime);
    const durationDrift = buildDurationDrift(anchorDuration, actualDuration);

    const driftLabel = buildDriftLabel({
      timingOffset,
      durationDrift,
      earlyLateTolerance,
      durationTolerance,
    });

    const driftSeverity = buildDriftSeverity({
      timingOffset,
      durationDrift,
      mediumTimingThreshold,
      highTimingThreshold,
      mediumDurationThreshold,
      highDurationThreshold,
    });

    const confidenceScore = buildConfidenceScore({
      expectedStartTime,
      actualStartTime,
      anchorDuration,
      actualDuration,
      driftSeverity,
      driftLabel,
      timingOffset,
      durationDrift,
      mediumTimingThreshold,
      highTimingThreshold,
      mediumDurationThreshold,
      highDurationThreshold,
    });

    const row: PhraseDriftMemberResult = {
      familyId: family.id,
      anchorMomentId,
      momentId,
      memberIndex: i,
      expectedStartTime,
      actualStartTime,
      timingOffset,
      durationDrift,
      driftLabel,
      driftSeverity,
      confidenceScore,
    };

    memberRows.push(row);
    byMomentId[momentId] = row;
  }

  const stableCount = memberRows.filter((row) => row.driftLabel === "stable").length;
  const unstableCount = memberRows.length - stableCount;

  return {
    familyId: family.id,
    anchorMomentId,
    repeatIntervalHint: repeatIntervalHint ?? fallbackRepeatInterval,
    comparedMemberCount: memberRows.length,
    stableCount,
    unstableCount,
    averageAbsoluteTimingOffset: buildAverageAbsolute(
      memberRows.map((row) => row.timingOffset)
    ),
    averageAbsoluteDurationDrift: buildAverageAbsolute(
      memberRows.map((row) => row.durationDrift)
    ),
    dominantDriftLabel: getDominantLabel(memberRows),
    highestSeverity: getHighestSeverity(memberRows),
    members: memberRows,
  };
}
