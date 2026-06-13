export type MultiTrackSurvivorPromotionLane =
  | "version-alignment"
  | "phrase-match"
  | "riff-color"
  | "idea-cluster"
  | "survivor-score"
  | "keeper-promotion";

export type MultiTrackSurvivorPromotionSignalKind =
  | "repeated-phrase"
  | "stable-riff"
  | "cluster-anchor"
  | "strong-section"
  | "lineage-survivor"
  | "manual-favorite"
  | "render-candidate"
  | "needs-human-review";

export type MultiTrackSurvivorPromotionRiskKind =
  | "missing-version-audio"
  | "weak-alignment"
  | "low-phrase-confidence"
  | "unverified-riff-color"
  | "cluster-too-small"
  | "duplicate-survivor"
  | "manual-review-required";

export type MultiTrackSurvivorPromotionDecision =
  | "promote"
  | "hold"
  | "review"
  | "reject"
  | "future";

export type MultiTrackSurvivorPromotionEvidence = {
  id: string;
  label: string;
  detail: string;
  lane: MultiTrackSurvivorPromotionLane;
  signalKind: MultiTrackSurvivorPromotionSignalKind;
  strength: number;
  confidence: number;
};

export type MultiTrackSurvivorPromotionRisk = {
  id: string;
  label: string;
  detail: string;
  riskKind: MultiTrackSurvivorPromotionRiskKind;
  severity: number;
  canAutoResolve: boolean;
};

export type MultiTrackSurvivorPromotionCandidate = {
  id: string;
  title: string;
  sourceVersionIds: string[];
  sourceClusterId: string;
  phraseMatchIds: string[];
  riffColorIds: string[];
  sectionLabel: string;
  startBar: number;
  endBar: number;
  score: number;
  confidence: number;
  decision: MultiTrackSurvivorPromotionDecision;
  readiness: "ready" | "needs-review" | "blocked" | "future";
  evidence: MultiTrackSurvivorPromotionEvidence[];
  risks: MultiTrackSurvivorPromotionRisk[];
  notes: string[];
};

export type MultiTrackSurvivorPromotionKeeperBankSlot = {
  id: string;
  label: string;
  description: string;
  acceptedCandidateIds: string[];
  pendingCandidateIds: string[];
  readiness: "ready" | "needs-review" | "blocked" | "future";
};

export type MultiTrackSurvivorPromotionWorkspaceState = {
  engineId: string;
  engineTitle: string;
  enginePurpose: string;
  readiness: "ready" | "needs-review" | "blocked" | "future";
  candidates: MultiTrackSurvivorPromotionCandidate[];
  keeperBankSlots: MultiTrackSurvivorPromotionKeeperBankSlot[];
  nextActions: string[];
};