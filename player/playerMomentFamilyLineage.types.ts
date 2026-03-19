import type {
  FamilyTrustLevel,
  FamilyTrustReason,
  FamilyTrustStateResult,
} from "./playerMomentFamilyTrustState.types";

export type FamilyLineageDirection =
  | "improving"
  | "declining"
  | "flat"
  | "volatile"
  | "insufficient-data";

export type FamilyLineageSnapshot = {
  familyId: string;
  revisionId: string;
  orderIndex: number;
  trustScore: number;
  trustLevel: FamilyTrustLevel;
  recoveryScore: number;
  volatilityScore: number;
  repairOpportunityScore: number;
  strongestReason: FamilyTrustReason | null;
  sourceTrustState: FamilyTrustStateResult;
};

export type FamilyLineageTransition = {
  familyId: string;
  fromRevisionId: string;
  toRevisionId: string;
  fromOrderIndex: number;
  toOrderIndex: number;
  trustDelta: number;
  recoveryDelta: number;
  volatilityDelta: number;
  repairOpportunityDelta: number;
  changed: boolean;
  direction: FamilyLineageDirection;
};

export type FamilyLineageResult = {
  familyId: string;
  snapshotCount: number;
  direction: FamilyLineageDirection;
  latestSnapshot: FamilyLineageSnapshot | null;
  previousSnapshot: FamilyLineageSnapshot | null;
  totalTrustDelta: number;
  totalRecoveryDelta: number;
  totalVolatilityDelta: number;
  totalRepairOpportunityDelta: number;
  transitions: FamilyLineageTransition[];
  snapshots: FamilyLineageSnapshot[];
};

export type BuildFamilyLineageSnapshotParams = {
  revisionId: string;
  orderIndex: number;
  trustState: FamilyTrustStateResult;
};

export type BuildFamilyLineageParams = {
  familyId: string;
  snapshots: FamilyLineageSnapshot[];
};