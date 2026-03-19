import type {
  FamilyExecutionQueueItem,
  FamilyExecutionReason,
} from "./playerMomentFamilyExecutionQueue.types";

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
  reasons: FamilyExecutionReason[]
): FamilyExecutionReason[] {
  const seen = new Set<FamilyExecutionReason>();
  const result: FamilyExecutionReason[] = [];

  for (const reason of reasons) {
    if (!seen.has(reason)) {
      seen.add(reason);
      result.push(reason);
    }
  }

  return result;
}

export function sortExecutionItems(
  items: FamilyExecutionQueueItem[]
): FamilyExecutionQueueItem[] {
  return [...items].sort((a, b) => {
    const stateRank = (state: string) =>
      state === "execute-now"
        ? 5
        : state === "protected"
          ? 4
          : state === "queued"
            ? 3
            : state === "blocked"
              ? 2
              : 1;

    const aStateRank = stateRank(a.executionState);
    const bStateRank = stateRank(b.executionState);

    if (bStateRank !== aStateRank) {
      return bStateRank - aStateRank;
    }

    if (b.queueScore !== a.queueScore) {
      return b.queueScore - a.queueScore;
    }

    if (b.executionPriorityScore !== a.executionPriorityScore) {
      return b.executionPriorityScore - a.executionPriorityScore;
    }

    return normalizeText(a.familyId).localeCompare(normalizeText(b.familyId));
  });
}