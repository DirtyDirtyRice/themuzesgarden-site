export type MultiTrackKeeperReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackKeeperStrength =
  | "keeper"
  | "strong"
  | "maybe"
  | "weak"
  | "reject";

export type MultiTrackKeeperSourceKind =
  | "suno-version"
  | "original-idea"
  | "manual-upload"
  | "riff-group"
  | "pattern-genome"
  | "variation-engine"
  | "survivor-analysis"
  | "seed";

export type MultiTrackKeeperReasonCode =
  | "strong-hook"
  | "clear-lineage"
  | "repeatable-riff"
  | "best-mutation"
  | "arrangement-ready"
  | "edit-ready"
  | "render-ready"
  | "needs-human-review"
  | "missing-audio"
  | "missing-metadata"
  | "seed-placeholder";

export type MultiTrackKeeperPromotionTarget =
  | "extract"
  | "duplicate"
  | "edit-lane"
  | "arrangement"
  | "render-queue"
  | "archive"
  | "review";

export type MultiTrackKeeperColor =
  | "white"
  | "blue"
  | "green"
  | "gold"
  | "purple"
  | "red";

export type MultiTrackKeeperSignal = {
  id: string;
  label: string;
  value: number;
  maxValue: number;
  detail: string;
};

export type MultiTrackKeeperCandidate = {
  id: string;
  title: string;
  sourceKind: MultiTrackKeeperSourceKind;
  versionLabel: string;
  ideaFamilyId: string;
  lineageId: string;
  mutationCount: number;
  survivorRank: number;
  strength: MultiTrackKeeperStrength;
  readinessStatus: MultiTrackKeeperReadinessStatus;
  color: MultiTrackKeeperColor;
  reasonCodes: MultiTrackKeeperReasonCode[];
  promotionTargets: MultiTrackKeeperPromotionTarget[];
  signals: MultiTrackKeeperSignal[];
  notes: string[];
};

export type MultiTrackKeeperPathStep = {
  id: string;
  label: string;
  candidateId: string;
  order: number;
  color: MultiTrackKeeperColor;
  detail: string;
};

export type MultiTrackKeeperPath = {
  id: string;
  title: string;
  ideaFamilyId: string;
  color: MultiTrackKeeperColor;
  steps: MultiTrackKeeperPathStep[];
  summary: string;
};

export type MultiTrackKeeperQueueItem = {
  id: string;
  candidateId: string;
  target: MultiTrackKeeperPromotionTarget;
  label: string;
  readinessStatus: MultiTrackKeeperReadinessStatus;
  detail: string;
};

export type MultiTrackKeeperEngineWorkspaceState = {
  id: string;
  title: string;
  description: string;
  readinessStatus: MultiTrackKeeperReadinessStatus;
  candidates: MultiTrackKeeperCandidate[];
  keeperPaths: MultiTrackKeeperPath[];
  promotionQueue: MultiTrackKeeperQueueItem[];
  notes: string[];
};