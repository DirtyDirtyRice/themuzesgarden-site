import type { FamilyStrategyResult } from "./playerMomentFamilyStrategy.types";

export type FamilyPlanningAction =
  | "protect-now"
  | "push-now"
  | "prepare-reuse"
  | "develop-next"
  | "monitor-later"
  | "archive-intentionally";

export type FamilyPlanningHorizon =
  | "immediate"
  | "next-up"
  | "queued"
  | "backlog"
  | "hold";

export type FamilyPlanningReason =
  | "signature-needs-protection"
  | "strategy-priority-confirmed"
  | "reuse-path-open"
  | "development-queue-worthy"
  | "timing-window-open"
  | "portfolio-support-strong"
  | "proof-still-thin"
  | "watch-not-ready"
  | "archive-load-confirmed"
  | "top-priority-family";

export type FamilyPlanningItem = {
  familyId: string;
  planScore: number;
  urgencyScore: number;
  readinessScore: number;
  protectionNeedScore: number;
  executionValueScore: number;
  planningAction: FamilyPlanningAction;
  planningHorizon: FamilyPlanningHorizon;
  strongestReason: FamilyPlanningReason | null;
  reasons: FamilyPlanningReason[];
};

export type FamilyPlanningResult = {
  familyCount: number;
  planScore: number;
  urgencyScore: number;
  readinessScore: number;
  protectionNeedScore: number;
  executionValueScore: number;
  strongestReason: FamilyPlanningReason | null;
  reasons: FamilyPlanningReason[];
  strategyResult: FamilyStrategyResult | null;
  immediateFamilyIds: string[];
  nextFamilyIds: string[];
  queuedFamilyIds: string[];
  backlogFamilyIds: string[];
  holdFamilyIds: string[];
  items: FamilyPlanningItem[];
};

export type BuildFamilyPlanningParams = {
  strategyResult?: FamilyStrategyResult | null;
};