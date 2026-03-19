import type {
  FamilyLineageDirection,
  FamilyLineageSnapshot,
} from "./playerMomentFamilyLineage.types";

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export function round1(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

export function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function delta(a: number, b: number): number {
  return round1(safeNumber(b) - safeNumber(a));
}

export function sortSnapshots(
  snapshots: FamilyLineageSnapshot[]
): FamilyLineageSnapshot[] {
  return [...snapshots].sort((a, b) => {
    const orderDelta = safeNumber(a.orderIndex) - safeNumber(b.orderIndex);
    if (orderDelta !== 0) return orderDelta;

    const revisionDelta = normalizeText(a.revisionId).localeCompare(
      normalizeText(b.revisionId)
    );
    if (revisionDelta !== 0) return revisionDelta;

    return normalizeText(a.familyId).localeCompare(normalizeText(b.familyId));
  });
}

export function getDirectionFromDelta(value: number): FamilyLineageDirection {
  const n = safeNumber(value, Number.NaN);

  if (!Number.isFinite(n)) return "insufficient-data";
  if (n > 4) return "improving";
  if (n < -4) return "declining";
  return "flat";
}

export function getOverallDirection(params: {
  trustDelta: number;
  volatilityDelta: number;
  snapshotCount: number;
}): FamilyLineageDirection {
  const trustDelta = safeNumber(params.trustDelta);
  const volatilityDelta = safeNumber(params.volatilityDelta);
  const snapshotCount = Math.max(0, Math.floor(safeNumber(params.snapshotCount)));

  if (snapshotCount < 2) return "insufficient-data";

  const trustSwing = Math.abs(trustDelta);
  const volatilitySwing = Math.abs(volatilityDelta);

  if (volatilitySwing > 20) return "volatile";
  if (trustSwing > 30 && volatilitySwing > 10) return "volatile";

  return getDirectionFromDelta(trustDelta);
}