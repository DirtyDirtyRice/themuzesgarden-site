import type {
  FamilyReuseReadiness,
  FamilySignalReason,
  FamilySignalStrength,
} from "./playerMomentFamilySignal.types";

export function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

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
  reasons: FamilySignalReason[]
): FamilySignalReason[] {
  const seen = new Set<FamilySignalReason>();
  const result: FamilySignalReason[] = [];

  for (const reason of reasons) {
    if (!seen.has(reason)) {
      seen.add(reason);
      result.push(reason);
    }
  }

  return result;
}

export function getSignalStrength(score: number): FamilySignalStrength {
  const s = clamp100(score);

  if (s < 30) return "weak";
  if (s < 50) return "emerging";
  if (s < 70) return "promising";
  if (s < 85) return "strong";
  return "anchor";
}

export function getReuseReadiness(score: number): FamilyReuseReadiness {
  const s = clamp100(score);

  if (s < 30) return "not-ready";
  if (s < 50) return "watch";
  if (s < 70) return "candidate";
  if (s < 85) return "ready";
  return "high-priority";
}