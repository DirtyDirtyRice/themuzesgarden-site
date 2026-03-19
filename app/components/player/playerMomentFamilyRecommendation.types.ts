import type { FamilyDiscoveryResult } from "./playerMomentFamilyDiscovery.types";

export type FamilyRecommendationAction =
  | "archive"
  | "monitor"
  | "develop"
  | "reuse"
  | "promote"
  | "protect-signature";

export type FamilyRecommendationPriority =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type FamilyRecommendationReason =
  | "signature-family"
  | "keeper-worthy"
  | "surface-immediately"
  | "reuse-opportunity-high"
  | "strong-discovery-rank"
  | "high-confidence-pattern"
  | "development-candidate"
  | "volatile-but-interesting"
  | "insufficient-proof"
  | "archive-for-later";

export type FamilyRecommendationResult = {
  familyId: string;
  recommendationScore: number;
  actionScore: number;
  preserveScore: number;
  investmentScore: number;
  urgencyScore: number;
  recommendationAction: FamilyRecommendationAction;
  recommendationPriority: FamilyRecommendationPriority;
  strongestReason: FamilyRecommendationReason | null;
  reasons: FamilyRecommendationReason[];
  discoveryResult: FamilyDiscoveryResult | null;
};

export type BuildFamilyRecommendationParams = {
  familyId: string;
  discoveryResult?: FamilyDiscoveryResult | null;
};