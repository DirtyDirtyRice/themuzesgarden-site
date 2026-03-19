import type {
  FamilyTrustLevel,
  FamilyTrustReason,
} from "./playerMomentFamilyTrustState.types";

export function clamp01(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

export function clamp100(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
}

export function round1(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

export function average(values: Array<number | null | undefined>): number {
  const valid: number[] = [];

  for (const v of values) {
    const n = Number(v);
    if (Number.isFinite(n)) {
      valid.push(n);
    }
  }

  if (!valid.length) return 0;

  const sum = valid.reduce((a, b) => a + b, 0);
  return sum / valid.length;
}

export function dedupeReasons(
  reasons: FamilyTrustReason[]
): FamilyTrustReason[] {
  const seen = new Set<FamilyTrustReason>();
  const result: FamilyTrustReason[] = [];

  for (const reason of reasons) {
    if (!seen.has(reason)) {
      seen.add(reason);
      result.push(reason);
    }
  }

  return result;
}

export function getTrustLevel(score: number): FamilyTrustLevel {
  const s = clamp100(score);

  if (s < 30) return "broken";
  if (s < 50) return "fragile";
  if (s < 70) return "watch";
  if (s < 85) return "stable";
  return "strong";
}