import type { IntendedRepeatResult } from "./playerMomentIntendedRepeat";
import type {
  PhraseDriftFamilyResult,
} from "./playerMomentPhraseDrift";
import type {
  PhraseStabilityFamilyResult,
  PhraseStabilityIssueFlag,
} from "./playerMomentPhraseStability.types";

import {
  average,
  clamp100,
  getSeverityPenalty,
  getStabilityLabel,
  round1,
  round3,
} from "./playerMomentPhraseStability.shared";

function getFamilyMemberCount(family: PhraseDriftFamilyResult): number {
  return Array.isArray(family.members) ? family.members.length : 0;
}

function buildFamilyEvidenceConfidence(family: PhraseDriftFamilyResult): number {
  const count = getFamilyMemberCount(family);

  if (count >= 5) return 1;
  if (count === 4) return 0.95;
  if (count === 3) return 0.88;
  if (count === 2) return 0.78;
  if (count === 1) return 0.62;
  return 0.55;
}

export function buildTimingConsistency(family: PhraseDriftFamilyResult): number {
  const values = family.members
    .map((member) => member.timingOffset)
    .filter((value): value is number => value !== null)
    .map((value) => Math.abs(value));

  if (!values.length) {
    return round3(0.72);
  }

  const avgOffset = average(values);
  const maxOffset = Math.max(...values);
  const offsetPenalty = avgOffset / 2;
  const spikePenalty = maxOffset / 4;
  const score = 1 - offsetPenalty * 0.75 - spikePenalty * 0.25;

  return round3(score);
}

export function buildDurationConsistency(family: PhraseDriftFamilyResult): number {
  const values = family.members
    .map((member) => member.durationDrift)
    .filter((value): value is number => value !== null)
    .map((value) => Math.abs(value));

  if (!values.length) {
    return round3(0.72);
  }

  const avgDrift = average(values);
  const maxDrift = Math.max(...values);
  const driftPenalty = avgDrift / 1.5;
  const spikePenalty = maxDrift / 3;
  const score = 1 - driftPenalty * 0.75 - spikePenalty * 0.25;

  return round3(score);
}

export function buildRepeatCoverage(params: {
  familyId: string;
  intendedRepeatMetadata?: IntendedRepeatResult | null;
  family: PhraseDriftFamilyResult;
}): number {
  const plan = params.intendedRepeatMetadata?.byFamilyId?.[params.familyId];
  const memberCount = getFamilyMemberCount(params.family);

  if (!plan) {
    if (memberCount >= 4) return 0.82;
    if (memberCount === 3) return 0.78;
    if (memberCount === 2) return 0.74;
    return 0.68;
  }

  const total = plan.presentCount + plan.nearCount + plan.missingCount;
  if (total <= 0) {
    if (memberCount >= 4) return 0.8;
    if (memberCount === 3) return 0.76;
    if (memberCount === 2) return 0.72;
    return 0.66;
  }

  const weighted =
    plan.presentCount * 1 +
    plan.nearCount * 0.6 +
    plan.missingCount * 0;

  return round3(weighted / total);
}

export function buildStructuralConfidence(
  family: PhraseDriftFamilyResult
): number {
  const values = family.members
    .map((member) => member.confidenceScore)
    .filter((value): value is number => Number.isFinite(value));

  const evidenceConfidence = buildFamilyEvidenceConfidence(family);

  if (!values.length) {
    return round3(0.62 * evidenceConfidence);
  }

  const avgConfidence = average(values);
  const minConfidence = Math.min(...values);
  const blended = avgConfidence * 0.85 + minConfidence * 0.15;

  return round3(blended * evidenceConfidence);
}

export function buildIssueFlags(params: {
  family: PhraseDriftFamilyResult;
  intendedRepeatMetadata?: IntendedRepeatResult | null;
  timingConsistency: number;
  durationConsistency: number;
  repeatCoverage: number;
  structuralConfidence: number;
}): PhraseStabilityIssueFlag[] {
  const flags = new Set<PhraseStabilityIssueFlag>();
  const plan = params.intendedRepeatMetadata?.byFamilyId?.[params.family.familyId];

  if ((plan?.missingCount ?? 0) > 0 || params.repeatCoverage < 0.6) {
    flags.add("missing-repeats");
  }

  if (
    (plan?.nearCount ?? 0) > 0 ||
    (params.repeatCoverage >= 0.6 && params.repeatCoverage < 0.8)
  ) {
    flags.add("near-repeats");
  }

  if (params.timingConsistency < 0.78) {
    flags.add("timing-drift");
  }

  if (params.durationConsistency < 0.78) {
    flags.add("duration-drift");
  }

  if (
    params.family.highestSeverity === "high" ||
    params.timingConsistency < 0.6 ||
    params.durationConsistency < 0.6
  ) {
    flags.add("high-severity-drift");
  }

  if (params.structuralConfidence < 0.68) {
    flags.add("low-confidence");
  }

  return Array.from(flags);
}

export function buildFamilyResult(params: {
  family: PhraseDriftFamilyResult;
  intendedRepeatMetadata?: IntendedRepeatResult | null;
}): PhraseStabilityFamilyResult {
  const { family, intendedRepeatMetadata } = params;

  const timingConsistency = buildTimingConsistency(family);
  const durationConsistency = buildDurationConsistency(family);
  const repeatCoverage = buildRepeatCoverage({
    familyId: family.familyId,
    intendedRepeatMetadata,
    family,
  });
  const structuralConfidence = buildStructuralConfidence(family);

  const severityPenalty = getSeverityPenalty(family.highestSeverity);

  const weightedCore =
    timingConsistency * 0.28 +
    durationConsistency * 0.22 +
    repeatCoverage * 0.28 +
    structuralConfidence * 0.22;

  const stabilityScore = round1(clamp100((weightedCore - severityPenalty) * 100));
  const stabilityLabel = getStabilityLabel(stabilityScore);

  const issueFlags = buildIssueFlags({
    family,
    intendedRepeatMetadata,
    timingConsistency,
    durationConsistency,
    repeatCoverage,
    structuralConfidence,
  });

  return {
    familyId: family.familyId,
    anchorMomentId: family.anchorMomentId,
    stabilityScore,
    stabilityLabel,
    timingConsistency: round1(timingConsistency * 100),
    durationConsistency: round1(durationConsistency * 100),
    repeatCoverage: round1(repeatCoverage * 100),
    structuralConfidence: round1(structuralConfidence * 100),
    highestDriftSeverity: family.highestSeverity,
    issueFlags,
  };
}
