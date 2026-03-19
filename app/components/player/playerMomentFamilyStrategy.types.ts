import type { FamilyPortfolioResult } from "./playerMomentFamilyPortfolio.types";

export type FamilyStrategyAction =
  | "archive-strategically"
  | "monitor-lightly"
  | "develop-gradually"
  | "mine-for-reuse"
  | "push-now"
  | "protect-and-hold";

export type FamilyStrategyHorizon =
  | "deferred"
  | "near-term"
  | "active"
  | "priority"
  | "long-term-anchor";

export type FamilyStrategyReason =
  | "signature-anchor-present"
  | "core-pool-strong"
  | "active-pipeline-healthy"
  | "reuse-potential-high"
  | "strategy-priority-high"
  | "portfolio-health-strong"
  | "watch-pool-heavy"
  | "archive-load-high"
  | "proof-base-thin"
  | "development-surface-open";

export type FamilyStrategyItem = {
  familyId: string;
  strategyScore: number;
  leverageScore: number;
  protectionScore: number;
  timingScore: number;
  reuseProgramScore: number;
  strategyAction: FamilyStrategyAction;
  strongestReason: FamilyStrategyReason | null;
  reasons: FamilyStrategyReason[];
};

export type FamilyStrategyResult = {
  familyCount: number;
  strategyScore: number;
  leverageScore: number;
  protectionScore: number;
  timingScore: number;
  reuseProgramScore: number;
  strategyAction: FamilyStrategyAction;
  strategyHorizon: FamilyStrategyHorizon;
  strongestReason: FamilyStrategyReason | null;
  reasons: FamilyStrategyReason[];
  portfolioResult: FamilyPortfolioResult | null;
  topPriorityFamilyIds: string[];
  protectedFamilyIds: string[];
  reuseCandidateFamilyIds: string[];
  archiveCandidateFamilyIds: string[];
  items: FamilyStrategyItem[];
};

export type BuildFamilyStrategyParams = {
  portfolioResult?: FamilyPortfolioResult | null;
};