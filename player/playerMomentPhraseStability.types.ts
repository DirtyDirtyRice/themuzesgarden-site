import type { IntendedRepeatResult } from "./playerMomentIntendedRepeat";
import type {
  PhraseDriftEngineResult,
  PhraseDriftSeverity,
} from "./playerMomentPhraseDrift";

export type PhraseStabilityLabel = "solid" | "good" | "fragile" | "unstable";

export type PhraseStabilityIssueFlag =
  | "missing-repeats"
  | "near-repeats"
  | "timing-drift"
  | "duration-drift"
  | "high-severity-drift"
  | "low-confidence";

export type PhraseStabilityFamilyResult = {
  familyId: string;
  anchorMomentId: string;
  stabilityScore: number;
  stabilityLabel: PhraseStabilityLabel;
  timingConsistency: number;
  durationConsistency: number;
  repeatCoverage: number;
  structuralConfidence: number;
  highestDriftSeverity: PhraseDriftSeverity;
  issueFlags: PhraseStabilityIssueFlag[];
};

export type PhraseStabilityEngineResult = {
  families: PhraseStabilityFamilyResult[];
  byFamilyId: Record<string, PhraseStabilityFamilyResult>;
};

export type PhraseStabilityEngineInput = {
  phraseDriftResult: PhraseDriftEngineResult;
  intendedRepeatMetadata: IntendedRepeatResult;
};
