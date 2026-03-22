import { buildFamilyResult } from "./playerMomentPhraseStability.builders";
import { getSeveritySortRank } from "./playerMomentPhraseStability.shared";

import type { PhraseDriftSeverity } from "./playerMomentPhraseDrift";
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

function normalizePhraseDriftSeverity(value: unknown): PhraseDriftSeverity {
  if (value === "high") return "high";
  if (value === "medium") return "medium";
  if (value === "low") return "low";
  return "none";
}

function comparePhraseStabilityFamilies(
  a: PhraseStabilityFamilyResult,
  b: PhraseStabilityFamilyResult
): number {
  if (a.stabilityScore !== b.stabilityScore) {
    return a.stabilityScore - b.stabilityScore;
  }

  const aSeverity = normalizePhraseDriftSeverity(a.highestDriftSeverity);
  const bSeverity = normalizePhraseDriftSeverity(b.highestDriftSeverity);

  if (aSeverity !== bSeverity) {
    return getSeveritySortRank(aSeverity) - getSeveritySortRank(bSeverity);
  }

  if (a.structuralConfidence !== b.structuralConfidence) {
    return a.structuralConfidence - b.structuralConfidence;
  }

  return a.familyId.localeCompare(b.familyId);
}

export function buildMomentPhraseStability(
  input: PhraseStabilityEngineInput
): PhraseStabilityEngineResult {
  const sourceFamilies: unknown[] = Array.isArray(input.phraseDriftResult?.families)
    ? input.phraseDriftResult.families
    : [];

  const families = sourceFamilies
    .map((family: unknown) =>
      buildFamilyResult({
        family: family as any,
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
