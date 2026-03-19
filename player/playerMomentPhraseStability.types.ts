import type { PhraseDriftSeverity } from "./playerMomentPhraseDrift";

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
    .sort((a, b) => {
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
    });

  const byFamilyId: Record<string, PhraseStabilityFamilyResult> = {};

  for (const family of families) {
    byFamilyId[family.familyId] = family;
  }

  return {
    families,
    byFamilyId,
  };
}