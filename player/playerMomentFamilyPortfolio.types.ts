import type { FamilyRecommendationResult } from "./playerMomentFamilyRecommendation.types";

export type FamilyPortfolioTier =
  | "archive"
  | "watch"
  | "active"
  | "core"
  | "signature";

export type FamilyPortfolioHealth =
  | "weak"
  | "mixed"
  | "healthy"
  | "strong";

export type FamilyPortfolioReason =
  | "signature-protected"
  | "core-family"
  | "active-development"
  | "watch-candidate"
  | "archive-candidate"
  | "high-recommendation"
  | "strong-discovery-support"
  | "reuse-value-high"
  | "proof-too-thin"
  | "portfolio-anchor";

export type FamilyPortfolioItem = {
  familyId: string;
  portfolioScore: number;
  tierScore: number;
  resilienceScore: number;
  strategicValueScore: number;
  sustainabilityScore: number;
  tier: FamilyPortfolioTier;
  strongestReason: FamilyPortfolioReason | null;
  reasons: FamilyPortfolioReason[];
  recommendationResult: FamilyRecommendationResult | null;
};

export type FamilyPortfolioResult = {
  familyCount: number;
  averagePortfolioScore: number;
  averageResilienceScore: number;
  averageStrategicValueScore: number;
  averageSustainabilityScore: number;
  portfolioHealth: FamilyPortfolioHealth;
  signatureCount: number;
  coreCount: number;
  activeCount: number;
  watchCount: number;
  archiveCount: number;
  topFamilyIds: string[];
  items: FamilyPortfolioItem[];
};

export type BuildFamilyPortfolioItemParams = {
  familyId: string;
  recommendationResult?: FamilyRecommendationResult | null;
};

export type BuildFamilyPortfolioParams = {
  items: BuildFamilyPortfolioItemParams[];
};