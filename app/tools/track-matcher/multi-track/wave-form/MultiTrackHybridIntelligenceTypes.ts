export type MultiTrackHybridSourceId = "track-a" | "track-b";

export type MultiTrackHybridReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackHybridConfidenceLevel =
  | "high"
  | "medium"
  | "low"
  | "manual-required";

export type MultiTrackHybridAssetType =
  | "hook"
  | "verse"
  | "chorus"
  | "bridge"
  | "intro"
  | "outro"
  | "drums"
  | "bass"
  | "harmony"
  | "melody"
  | "vocal"
  | "texture"
  | "transition";

export type MultiTrackHybridMergeLane =
  | "stem-merge"
  | "hook-merge"
  | "section-swap"
  | "tempo-key"
  | "confirmation"
  | "builder-ownership";

export type MultiTrackHybridDecisionOwner =
  | "user"
  | "future-ai"
  | "future-builder"
  | "manual-review";

export type MultiTrackHybridCompatibilitySignal = {
  id: string;
  label: string;
  status: MultiTrackHybridReadinessStatus;
  confidence: MultiTrackHybridConfidenceLevel;
  detail: string;
  userRule: string;
};

export type MultiTrackHybridAssetCandidate = {
  id: string;
  sourceId: MultiTrackHybridSourceId;
  assetType: MultiTrackHybridAssetType;
  label: string;
  usableFor: string[];
  status: MultiTrackHybridReadinessStatus;
  confidence: MultiTrackHybridConfidenceLevel;
  reason: string;
  requiredConfirmation: string;
};

export type MultiTrackHybridMergePlan = {
  id: string;
  lane: MultiTrackHybridMergeLane;
  title: string;
  status: MultiTrackHybridReadinessStatus;
  confidence: MultiTrackHybridConfidenceLevel;
  trackAPurpose: string;
  trackBPurpose: string;
  plannedOutcome: string;
  blockedUntil: string;
};

export type MultiTrackHybridUserConfirmationRule = {
  id: string;
  label: string;
  owner: MultiTrackHybridDecisionOwner;
  requiredBefore: string;
  rule: string;
};

export type MultiTrackHybridBuilderOwnershipItem = {
  id: string;
  owner: MultiTrackHybridDecisionOwner;
  label: string;
  currentScope: string;
  futureScope: string;
  status: MultiTrackHybridReadinessStatus;
};

export type MultiTrackHybridWorkspaceState = {
  title: string;
  description: string;
  compatibilitySignals: MultiTrackHybridCompatibilitySignal[];
  assetCandidates: MultiTrackHybridAssetCandidate[];
  mergePlans: MultiTrackHybridMergePlan[];
  confirmationRules: MultiTrackHybridUserConfirmationRule[];
  builderOwnership: MultiTrackHybridBuilderOwnershipItem[];
};