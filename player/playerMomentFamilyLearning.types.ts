export type FamilyLearningSignals = {
  reinforceStrategy: boolean;
  reinforceStructure: boolean;
  reinforceRepeat: boolean;
  adjustPlanning: boolean;
  avoidStrategy: boolean;
};

export type FamilyLearningTrustImpact = {
  trustAcceleration: number | null;
  trustPenalty: number | null;
};

export type FamilyLearningResult = {
  familyId: string;

  learningScore: number | null;

  signals: FamilyLearningSignals;

  trustImpact: FamilyLearningTrustImpact;

  learningLabel:
    | "strong-learning"
    | "positive-learning"
    | "neutral-learning"
    | "negative-learning"
    | null;

  reasons: string[];
};

export type BuildFamilyLearningParams = {
  familyId: string;

  outcomeScore?: number | null;

  outcomeLabel?: string | null;

  signalConfirmed?: boolean;

  driftCorrected?: boolean;

  repeatReinforced?: boolean;

  structureReinforced?: boolean;

  trustDelta?: number | null;
};