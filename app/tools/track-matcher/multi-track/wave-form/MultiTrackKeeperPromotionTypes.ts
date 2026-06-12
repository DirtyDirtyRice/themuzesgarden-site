export type MultiTrackKeeperPromotionReadinessStatus =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export type MultiTrackKeeperPromotionStage =
  | "candidate"
  | "approved"
  | "prepared"
  | "queued"
  | "promoted"
  | "archived";

export type MultiTrackKeeperPromotionTarget =
  | "keeper-bank"
  | "extract-lane"
  | "edit-lane"
  | "duplicate-lane"
  | "arrangement-lane"
  | "render-queue"
  | "archive-bin";

export type MultiTrackKeeperPromotionPriority =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "parking-lot";

export type MultiTrackKeeperPromotionReason =
  | "best-survivor"
  | "strong-hook"
  | "closest-original"
  | "useful-mutation"
  | "arrangement-ready"
  | "extraction-ready"
  | "render-ready"
  | "manual-keeper"
  | "archive-drift"
  | "seed-placeholder";

export type MultiTrackKeeperPromotionCheckKind =
  | "lineage"
  | "hook"
  | "mutation"
  | "survivor"
  | "arrangement"
  | "extraction"
  | "render"
  | "human-review";

export type MultiTrackKeeperPromotionCheck = {
  id: string;
  kind: MultiTrackKeeperPromotionCheckKind;
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
};

export type MultiTrackKeeperPromotionItem = {
  id: string;
  title: string;
  versionLabel: string;
  sourceCandidateId: string;
  stage: MultiTrackKeeperPromotionStage;
  target: MultiTrackKeeperPromotionTarget;
  priority: MultiTrackKeeperPromotionPriority;
  readinessStatus: MultiTrackKeeperPromotionReadinessStatus;
  reasons: MultiTrackKeeperPromotionReason[];
  checks: MultiTrackKeeperPromotionCheck[];
  promotionScore: number;
  keeperPathColor: string;
  actionLabel: string;
  detail: string;
  notes: string[];
};

export type MultiTrackKeeperPromotionLane = {
  id: string;
  title: string;
  target: MultiTrackKeeperPromotionTarget;
  readinessStatus: MultiTrackKeeperPromotionReadinessStatus;
  itemIds: string[];
  description: string;
};

export type MultiTrackKeeperPromotionDecision = {
  id: string;
  itemId: string;
  label: string;
  stage: MultiTrackKeeperPromotionStage;
  approved: boolean;
  detail: string;
};

export type MultiTrackKeeperPromotionWorkspaceState = {
  id: string;
  title: string;
  description: string;
  readinessStatus: MultiTrackKeeperPromotionReadinessStatus;
  items: MultiTrackKeeperPromotionItem[];
  lanes: MultiTrackKeeperPromotionLane[];
  decisions: MultiTrackKeeperPromotionDecision[];
  notes: string[];
};