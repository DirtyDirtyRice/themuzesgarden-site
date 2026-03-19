import { buildFamilyResult } from "./playerMomentPhraseStability.builders";
import { getSeveritySortRank } from "./playerMomentPhraseStability.shared";

import type {
  PhraseStabilityEngineInput,
  PhraseStabilityEngineResult,
  PhraseStabilityFamilyResult,
  PhraseStabilityIssueFlag,
  PhraseStabilityLabel,
} from "./playerMomentPhraseStability.types";

export type {
  PhraseStabilityEngineInput,
  PhraseStabilityEngineResult,
  PhraseStabilityFamilyResult,
  PhraseStabilityIssueFlag,
  PhraseStabilityLabel,
} from "./playerMomentPhraseStability.types";

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function comparePhraseStabilityFamilies(
  a: PhraseStabilityFamilyResult,
  b: PhraseStabilityFamilyResult
): number {
  if (a.stabilityScore !== b.stabilityScore) {
    return a.stabilityScore - b.stabilityScore;
  }

  if (a.highestDriftSeverity !== b.highestDriftSeverity) {
    return (
      getSeveritySortRank(a.highestDriftSeverity) -
      getSeveritySortRank(b.highestDriftSeverity)
    );
  }

  if (a.structuralConfidence !== b.structuralConfidence) {
    return a.structuralConfidence - b.structuralConfidence;
  }

  return a.familyId.localeCompare(b.familyId);
}

export function buildMomentPhraseStability(
  input: PhraseStabilityEngineInput
): PhraseStabilityEngineResult {
  const sourceFamilies = Array.isArray(input.phraseDriftResult?.families)
    ? input.phraseDriftResult.families
    : [];

  const families = sourceFamilies
    .map((family) =>
      buildFamilyResult({
        family,
        intendedRepeatMetadata: input.intendedRepeatMetadata,
      })
    )
    .filter(
      (family): family is PhraseStabilityFamilyResult =>
        Boolean(family) && Boolean(normalizeText(family.familyId))
    )
    .sort(comparePhraseStabilityFamilies);

  const byFamilyId: Record<string, PhraseStabilityFamilyResult> = {};

  for (const family of families) {
    const familyId = normalizeText(family.familyId);
    if (!familyId) continue;
    byFamilyId[familyId] = family;
  }

  return {
    families,
    byFamilyId,
  };
}