import type { PhraseDriftSeverity } from "./playerMomentPhraseDrift";

export type PhraseStabilityLabel =
  | "stable"
  | "watch"
  | "repair"
  | "blocked";

export type PhraseStabilityIssueFlag =
  | "missing-intended-repeat"
  | "weak-structure"
  | "timing-drift"
  | "duration-drift"
  | "severity-spike"
  | "unstable-family"
  | string;

export type PhraseStabilityFamilyResult = {
  familyId: string;
  stabilityScore: number;
  structuralConfidence: number;
  highestDriftSeverity: PhraseDriftSeverity | string;
  label: PhraseStabilityLabel | string;
  issueFlags: PhraseStabilityIssueFlag[];
  notes?: string[];
  sourceFamily?: any;
};

export type PhraseStabilityEngineInput = {
  phraseDriftResult?: {
    families?: any[];
    [key: string]: any;
  } | null;
  intendedRepeatMetadata?: any;
};

export type PhraseStabilityEngineResult = {
  families: PhraseStabilityFamilyResult[];
  byFamilyId: Record<string, PhraseStabilityFamilyResult>;
};
