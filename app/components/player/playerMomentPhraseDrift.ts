import { buildPhraseDriftFamilyResult } from "./playerMomentPhraseDrift.builders";
import {
  comparePhraseDriftFamilies,
  getMomentId,
  sortFamilyMembers,
} from "./playerMomentPhraseDrift.shared";

import type {
  PhraseDriftEngineInput,
  PhraseDriftEngineResult,
  PhraseDriftFamilyResult,
  PhraseDriftLabel,
  PhraseDriftMemberResult,
  PhraseDriftSeverity,
} from "./playerMomentPhraseDrift.types";

export type {
  PhraseDriftEngineInput,
  PhraseDriftEngineResult,
  PhraseDriftFamilyResult,
  PhraseDriftLabel,
  PhraseDriftMemberResult,
  PhraseDriftSeverity,
} from "./playerMomentPhraseDrift.types";

type NormalizedPhraseDriftThresholds = {
  earlyLateTolerance: number;
  durationTolerance: number;
  mediumTimingThreshold: number;
  highTimingThreshold: number;
  mediumDurationThreshold: number;
  highDurationThreshold: number;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeThresholds(
  input: PhraseDriftEngineInput
): NormalizedPhraseDriftThresholds {
  const earlyLateTolerance = Math.max(0, input.earlyLateTolerance ?? 0.35);
  const durationTolerance = Math.max(0, input.durationTolerance ?? 0.25);
  const mediumTimingThreshold = Math.max(
    earlyLateTolerance,
    input.mediumTimingThreshold ?? 0.75
  );
  const highTimingThreshold = Math.max(
    mediumTimingThreshold,
    input.highTimingThreshold ?? 1.5
  );
  const mediumDurationThreshold = Math.max(
    durationTolerance,
    input.mediumDurationThreshold ?? 0.5
  );
  const highDurationThreshold = Math.max(
    mediumDurationThreshold,
    input.highDurationThreshold ?? 1
  );

  return {
    earlyLateTolerance,
    durationTolerance,
    mediumTimingThreshold,
    highTimingThreshold,
    mediumDurationThreshold,
    highDurationThreshold,
  };
}

export function buildMomentPhraseDrift(
  input: PhraseDriftEngineInput
): PhraseDriftEngineResult {
  const thresholds = normalizeThresholds(input);

  const momentsById = new Map(
    (input.moments ?? [])
      .filter((moment) => getMomentId(moment))
      .map((moment) => [getMomentId(moment), moment] as const)
  );

  const families: PhraseDriftFamilyResult[] = [];
  const byFamilyId: Record<string, PhraseDriftFamilyResult> = {};
  const byMomentId: Record<string, PhraseDriftMemberResult> = {};

  for (const family of input.families ?? []) {
    const familyId = normalizeText(family?.id);
    if (!familyId) continue;

    const orderedMembers = sortFamilyMembers(family, momentsById);

    const familyResult = buildPhraseDriftFamilyResult({
      family,
      orderedMembers,
      byMomentId,
      ...thresholds,
    });

    if (!familyResult) continue;

    families.push(familyResult);
    byFamilyId[familyId] = familyResult;
  }

  families.sort(comparePhraseDriftFamilies);

  return {
    families,
    byFamilyId,
    byMomentId,
  };
}