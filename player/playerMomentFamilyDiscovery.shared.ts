import type {
  FamilyDiscoveryRank,
  FamilyDiscoveryReason,
  FamilyKeeperStatus,
  FamilySurfaceStatus,
} from "./playerMomentFamilyDiscovery.types";

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
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

export function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function average(values: Array<number | null | undefined>): number {
  const clean = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!clean.length) return 0;

  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

export function dedupeReasons(
  reasons: FamilyDiscoveryReason[]
): FamilyDiscoveryReason[] {
  const seen = new Set<FamilyDiscoveryReason>();
  const result: FamilyDiscoveryReason[] = [];

  for (const reason of reasons) {
    if (!seen.has(reason)) {
      seen.add(reason);
      result.push(reason);
    }
  }

  return result;
}

export function getDiscoveryRank(score: number): FamilyDiscoveryRank {
  const s = clamp100(score);

  if (s < 25) return "discard";
  if (s < 45) return "low";
  if (s < 70) return "medium";
  if (s < 85) return "high";
  return "priority";
}

export function getKeeperStatus(score: number): FamilyKeeperStatus {
  const s = clamp100(score);

  if (s < 30) return "ignore";
  if (s < 55) return "monitor";
  if (s < 82) return "keeper";
  return "signature";
}

export function getSurfaceStatus(score: number): FamilySurfaceStatus {
  const s = clamp100(score);

  if (s < 30) return "hidden";
  if (s < 55) return "watch";
  if (s < 78) return "candidate";
  return "surface-now";
}