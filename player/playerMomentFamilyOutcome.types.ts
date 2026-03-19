export type FamilyOutcomeSignal = {
  signalConfirmed: boolean;
  driftCorrected: boolean;
  repeatReinforced: boolean;
  structureReinforced: boolean;
};

export type FamilyOutcomeExecution = {
  familyId: string;
  executed: boolean;
  success: boolean;
  timestamp: number | null;
};

export type FamilyOutcomeTrustChange = {
  previousTrust: number | null;
  newTrust: number | null;
  trustDelta: number | null;
};

export type FamilyOutcomeResult = {
  familyId: string;

  execution: FamilyOutcomeExecution;

  signals: FamilyOutcomeSignal;

  trust: FamilyOutcomeTrustChange;

  outcomeScore: number | null;

  outcomeLabel:
    | "strong-positive"
    | "positive"
    | "neutral"
    | "negative"
    | "failure"
    | null;

  reasons: string[];
};

export type BuildFamilyOutcomeParams = {
  familyId: string;

  executed?: boolean;

  executionSuccess?: boolean;

  signalConfirmed?: boolean;

  driftCorrected?: boolean;

  repeatReinforced?: boolean;

  structureReinforced?: boolean;

  previousTrust?: number | null;

  newTrust?: number | null;

  timestamp?: number | null;
};