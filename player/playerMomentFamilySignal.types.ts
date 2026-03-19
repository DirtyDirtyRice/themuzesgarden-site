import type { ConfidenceHistoryResult } from "./playerMomentConfidenceHistory.types";
import type { FamilyLineageResult } from "./playerMomentFamilyLineage.types";
import type { FamilyTrustStateResult } from "./playerMomentFamilyTrustState.types";

export type FamilySignalStrength =
  | "weak"
  | "emerging"
  | "promising"
  | "strong"
  | "anchor";

export type FamilyReuseReadiness =
  | "not-ready"
  | "watch"
  | "candidate"
  | "ready"
  | "high-priority";

export type FamilySignalReason =
  | "strong-trust-foundation"
  | "healthy-confidence-history"
  | "lineage-improving"
  | "low-volatility-pattern"
  | "high-reuse-readiness"
  | "trust-fragile"
  | "lineage-declining"
  | "confidence-volatile"
  | "repair-pressure-high"
  | "insufficient-history";

export type FamilySignalResult = {
  familyId: string;
  signalScore: number;
  signalStrength: FamilySignalStrength;
  maturityScore: number;
  reuseReadinessScore: number;
  discoveryScore: number;
  stabilityIndex: number;
  momentumScore: number;
  confidenceScore: number;
  strongestReason: FamilySignalReason | null;
  reasons: FamilySignalReason[];
  reuseReadiness: FamilyReuseReadiness;
  trustState: FamilyTrustStateResult | null;
  lineageResult: FamilyLineageResult | null;
  confidenceHistoryResult: ConfidenceHistoryResult | null;
};

export type BuildFamilySignalParams = {
  familyId: string;
  trustState?: FamilyTrustStateResult | null;
  lineageResult?: FamilyLineageResult | null;
  confidenceHistoryResult?: ConfidenceHistoryResult | null;
};