import type { FamilyLineageSnapshot } from "./playerMomentFamilyLineage.types";
import type {
  FamilyTrustLevel,
  FamilyTrustReason,
} from "./playerMomentFamilyTrustState.types";

export type ConfidenceHistoryTrend =
  | "improving"
  | "declining"
  | "flat"
  | "volatile"
  | "insufficient-data";

export type ConfidenceHistoryPoint = {
  familyId: string;
  revisionId: string;
  orderIndex: number;
  trustScore: number;
  trustLevel: FamilyTrustLevel;
  recoveryScore: number;
  volatilityScore: number;
  repairOpportunityScore: number;
  strongestReason: FamilyTrustReason | null;
  reliabilityScore: number;
  sourceSnapshot: FamilyLineageSnapshot;
};

export type ConfidenceHistoryResult = {
  familyId: string;
  pointCount: number;
  trustTrend: ConfidenceHistoryTrend;
  recoveryTrend: ConfidenceHistoryTrend;
  volatilityTrend: ConfidenceHistoryTrend;
  reliabilityTrend: ConfidenceHistoryTrend;
  latestPoint: ConfidenceHistoryPoint | null;
  previousPoint: ConfidenceHistoryPoint | null;
  averageTrustScore: number;
  averageRecoveryScore: number;
  averageVolatilityScore: number;
  averageReliabilityScore: number;
  totalTrustDelta: number;
  totalRecoveryDelta: number;
  totalVolatilityDelta: number;
  totalReliabilityDelta: number;
  points: ConfidenceHistoryPoint[];
};

export type BuildConfidenceHistoryPointParams = {
  snapshot: FamilyLineageSnapshot;
};

export type BuildConfidenceHistoryParams = {
  familyId: string;
  snapshots: FamilyLineageSnapshot[];
};