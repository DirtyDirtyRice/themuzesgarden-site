import type {
  BuildFamilyLineageParams,
  BuildFamilyLineageSnapshotParams,
  FamilyLineageDirection,
  FamilyLineageResult,
  FamilyLineageSnapshot,
  FamilyLineageTransition,
} from "./playerMomentFamilyLineage.types";

import {
  delta,
  normalizeText,
  round1,
  safeNumber,
  sortSnapshots,
  getOverallDirection,
} from "./playerMomentFamilyLineage.shared";

function normalizeOrderIndex(value: unknown): number {
  const n = safeNumber(value);
  if (n < 0) return 0;
  return Math.floor(n);
}

function hasMeaningfulChange(values: number[]): boolean {
  return values.some((value) => Math.abs(safeNumber(value)) >= 0.1);
}

function getTransitionDirection(params: {
  trustDelta: number;
  recoveryDelta: number;
  volatilityDelta: number;
}): FamilyLineageDirection {
  const trustDelta = safeNumber(params.trustDelta);
  const recoveryDelta = safeNumber(params.recoveryDelta);
  const volatilityDelta = safeNumber(params.volatilityDelta);

  if (
    Math.abs(volatilityDelta) > 20 ||
    (Math.abs(trustDelta) > 20 && Math.abs(volatilityDelta) > 10)
  ) {
    return "volatile";
  }

  if (trustDelta > 4 && volatilityDelta <= 8) {
    return "improving";
  }

  if (trustDelta < -4) {
    return "declining";
  }

  if (recoveryDelta > 6 && trustDelta >= 0 && volatilityDelta <= 12) {
    return "improving";
  }

  return "flat";
}

export function buildFamilyLineageSnapshot(
  params: BuildFamilyLineageSnapshotParams
): FamilyLineageSnapshot {
  const trustState = params.trustState;
  const familyId = normalizeText(trustState.familyId);

  return {
    familyId,
    revisionId: normalizeText(params.revisionId),
    orderIndex: normalizeOrderIndex(params.orderIndex),
    trustScore: round1(safeNumber(trustState.trustScore)),
    trustLevel: trustState.trustLevel,
    recoveryScore: round1(safeNumber(trustState.recoveryScore)),
    volatilityScore: round1(safeNumber(trustState.volatilityScore)),
    repairOpportunityScore: round1(safeNumber(trustState.repairOpportunityScore)),
    strongestReason: trustState.strongestReason,
    sourceTrustState: trustState,
  };
}

function buildTransition(
  previous: FamilyLineageSnapshot,
  next: FamilyLineageSnapshot
): FamilyLineageTransition {
  const trustDelta = delta(previous.trustScore, next.trustScore);
  const recoveryDelta = delta(previous.recoveryScore, next.recoveryScore);
  const volatilityDelta = delta(previous.volatilityScore, next.volatilityScore);
  const repairOpportunityDelta = delta(
    previous.repairOpportunityScore,
    next.repairOpportunityScore
  );

  const changed = hasMeaningfulChange([
    trustDelta,
    recoveryDelta,
    volatilityDelta,
    repairOpportunityDelta,
  ]);

  const direction = getTransitionDirection({
    trustDelta,
    recoveryDelta,
    volatilityDelta,
  });

  return {
    familyId: previous.familyId,
    fromRevisionId: previous.revisionId,
    toRevisionId: next.revisionId,
    fromOrderIndex: previous.orderIndex,
    toOrderIndex: next.orderIndex,
    trustDelta,
    recoveryDelta,
    volatilityDelta,
    repairOpportunityDelta,
    changed,
    direction,
  };
}

export function buildFamilyLineage(
  params: BuildFamilyLineageParams
): FamilyLineageResult {
  const familyId = normalizeText(params.familyId);
  const snapshots = sortSnapshots(params.snapshots ?? []);
  const transitions: FamilyLineageTransition[] = [];

  for (let i = 1; i < snapshots.length; i++) {
    const previous = snapshots[i - 1];
    const next = snapshots[i];

    transitions.push(buildTransition(previous, next));
  }

  const latestSnapshot = snapshots[snapshots.length - 1] ?? null;
  const previousSnapshot = snapshots[snapshots.length - 2] ?? null;
  const firstSnapshot = snapshots[0] ?? null;

  const totalTrustDelta =
    firstSnapshot && latestSnapshot
      ? delta(firstSnapshot.trustScore, latestSnapshot.trustScore)
      : 0;

  const totalRecoveryDelta =
    firstSnapshot && latestSnapshot
      ? delta(firstSnapshot.recoveryScore, latestSnapshot.recoveryScore)
      : 0;

  const totalVolatilityDelta =
    firstSnapshot && latestSnapshot
      ? delta(firstSnapshot.volatilityScore, latestSnapshot.volatilityScore)
      : 0;

  const totalRepairOpportunityDelta =
    firstSnapshot && latestSnapshot
      ? delta(
          firstSnapshot.repairOpportunityScore,
          latestSnapshot.repairOpportunityScore
        )
      : 0;

  const direction = getOverallDirection({
    trustDelta: totalTrustDelta,
    volatilityDelta: totalVolatilityDelta,
    snapshotCount: snapshots.length,
  });

  return {
    familyId,
    snapshotCount: snapshots.length,
    direction,
    latestSnapshot,
    previousSnapshot,
    totalTrustDelta,
    totalRecoveryDelta,
    totalVolatilityDelta,
    totalRepairOpportunityDelta,
    transitions,
    snapshots,
  };
}