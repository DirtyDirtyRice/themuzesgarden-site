import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";
import type { FindItSelectionMemoryEntry } from "./findItResultsMemory";

const FIND_IT_RESULTS_BRAIN_STORAGE_KEY = "muzes-garden-find-it-results-brain-v1";
const MAX_PERSISTED_MEMORY_ENTRIES = 80;
const MAX_PERSISTED_INTENT_EVENTS = 120;
const MAX_REINFORCEMENT_TARGETS = 80;

export const STORAGE_WRITE_DELAY_MS = 250;

export type PersistentIntentEvent = {
  id: string;
  searchValue: string;
  normalizedSearchValue: string;
  selectedNodeId: string;
  selectedLabel: string;
  selectedKind: string;
  selectedIndex: number;
  matchCount: number;
  confidenceLabel: string;
  createdAt: number;
};

export type PersistentReinforcementEntry = {
  nodeId: string;
  label: string;
  kind: string;
  score: number;
  selectionCount: number;
  lastSearchValue: string;
  lastSelectedIndex: number;
  lastMatchCount: number;
  lastSelectedAt: number;
};

export type PersistentResultsBrainState = {
  version: 1;
  savedAt: number;
  memoryEntries: FindItSelectionMemoryEntry[];
  intentHistory: PersistentIntentEvent[];
  reinforcement: Record<string, PersistentReinforcementEntry>;
};

export type LearningSummary = {
  hasPersistentMemory: boolean;
  persistentMemoryCount: number;
  intentHistoryCount: number;
  strongestNodeId: string | null;
  strongestLabel: string | null;
  strongestScore: number;
  searchPatternStrength: "none" | "new" | "familiar" | "reinforced";
  adaptiveConfidenceBoost: number;
  adaptiveConfidenceLabel: string;
  adaptiveConfidenceCopy: string;
  learningCopy: string;
  lastRememberedAt: number | null;
};

export function getFindItResultConfidenceLabel(matchCount: number): string {
  if (matchCount === 1) return "Strong match";
  if (matchCount <= 3) return "Focused result set";
  if (matchCount <= 6) return "Moderate result set";
  return "Wide result set";
}

export function normalizeFindItSearchValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function createEmptyPersistentResultsBrainState(): PersistentResultsBrainState {
  return {
    version: 1,
    savedAt: 0,
    memoryEntries: [],
    intentHistory: [],
    reinforcement: {},
  };
}

export function trimPersistentMemoryEntries(entries: FindItSelectionMemoryEntry[]) {
  return entries.slice(-MAX_PERSISTED_MEMORY_ENTRIES);
}

function trimPersistentIntentHistory(entries: PersistentIntentEvent[]) {
  return entries.slice(-MAX_PERSISTED_INTENT_EVENTS);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function sanitizeMemoryEntries(value: unknown): FindItSelectionMemoryEntry[] {
  if (!Array.isArray(value)) return [];
  return trimPersistentMemoryEntries(value.filter(isPlainObject) as FindItSelectionMemoryEntry[]);
}

function sanitizeIntentHistory(value: unknown): PersistentIntentEvent[] {
  if (!Array.isArray(value)) return [];

  return trimPersistentIntentHistory(
    value
      .filter(isPlainObject)
      .map((event) => ({
        id: readString(event.id, ""),
        searchValue: readString(event.searchValue, ""),
        normalizedSearchValue: readString(event.normalizedSearchValue, ""),
        selectedNodeId: readString(event.selectedNodeId, ""),
        selectedLabel: readString(event.selectedLabel, ""),
        selectedKind: readString(event.selectedKind, ""),
        selectedIndex: readNumber(event.selectedIndex, 0),
        matchCount: readNumber(event.matchCount, 0),
        confidenceLabel: readString(event.confidenceLabel, "Unknown"),
        createdAt: readNumber(event.createdAt, 0),
      }))
      .filter((event) => event.id && event.selectedNodeId),
  );
}

function createReinforcementEntry(nodeId: string, rawEntry: Record<string, unknown>): PersistentReinforcementEntry {
  return {
    nodeId,
    label: readString(rawEntry.label, "Unknown result"),
    kind: readString(rawEntry.kind, "unknown"),
    score: Math.max(0, readNumber(rawEntry.score, 0)),
    selectionCount: Math.max(0, readNumber(rawEntry.selectionCount, 0)),
    lastSearchValue: readString(rawEntry.lastSearchValue, ""),
    lastSelectedIndex: readNumber(rawEntry.lastSelectedIndex, 0),
    lastMatchCount: readNumber(rawEntry.lastMatchCount, 0),
    lastSelectedAt: readNumber(rawEntry.lastSelectedAt, 0),
  };
}

function sanitizeReinforcement(value: unknown): Record<string, PersistentReinforcementEntry> {
  if (!isPlainObject(value)) return {};

  return Object.entries(value)
    .flatMap(([nodeId, rawEntry]) => {
      if (!isPlainObject(rawEntry)) return [];
      return [[nodeId, createReinforcementEntry(nodeId, rawEntry)] as const];
    })
    .sort(([, left], [, right]) => right.score - left.score || right.lastSelectedAt - left.lastSelectedAt)
    .slice(0, MAX_REINFORCEMENT_TARGETS)
    .reduce<Record<string, PersistentReinforcementEntry>>((nextEntries, [nodeId, entry]) => {
      nextEntries[nodeId] = entry;
      return nextEntries;
    }, {});
}

function parsePersistentResultsBrainState(rawValue: string | null): PersistentResultsBrainState {
  if (!rawValue) return createEmptyPersistentResultsBrainState();

  try {
    const parsed: unknown = JSON.parse(rawValue);
    if (!isPlainObject(parsed)) return createEmptyPersistentResultsBrainState();

    return {
      version: 1,
      savedAt: readNumber(parsed.savedAt, 0),
      memoryEntries: sanitizeMemoryEntries(parsed.memoryEntries),
      intentHistory: sanitizeIntentHistory(parsed.intentHistory),
      reinforcement: sanitizeReinforcement(parsed.reinforcement),
    };
  } catch {
    return createEmptyPersistentResultsBrainState();
  }
}

export function readPersistentResultsBrainState(): PersistentResultsBrainState {
  if (typeof window === "undefined") return createEmptyPersistentResultsBrainState();
  return parsePersistentResultsBrainState(window.localStorage.getItem(FIND_IT_RESULTS_BRAIN_STORAGE_KEY));
}

export function writePersistentResultsBrainState(state: PersistentResultsBrainState) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      FIND_IT_RESULTS_BRAIN_STORAGE_KEY,
      JSON.stringify({
        ...state,
        savedAt: Date.now(),
        memoryEntries: trimPersistentMemoryEntries(state.memoryEntries),
        intentHistory: trimPersistentIntentHistory(state.intentHistory),
        reinforcement: sanitizeReinforcement(state.reinforcement),
      }),
    );
  } catch {
    window.localStorage.removeItem(FIND_IT_RESULTS_BRAIN_STORAGE_KEY);
  }
}

export function createPersistentIntentEvent({
  confidenceLabel,
  matchCount,
  normalizedSearchValue,
  result,
  searchValue,
  selectedIndex,
}: {
  confidenceLabel: string;
  matchCount: number;
  normalizedSearchValue: string;
  result: NavigationSearchResult;
  searchValue: string;
  selectedIndex: number;
}): PersistentIntentEvent {
  const createdAt = Date.now();

  return {
    id: `${result.node.id}-${createdAt}`,
    searchValue,
    normalizedSearchValue,
    selectedNodeId: result.node.id,
    selectedLabel: result.node.label,
    selectedKind: result.node.kind,
    selectedIndex,
    matchCount,
    confidenceLabel,
    createdAt,
  };
}

export function reinforceResultSelection({
  currentReinforcement,
  matchCount,
  result,
  searchValue,
  selectedIndex,
}: {
  currentReinforcement: Record<string, PersistentReinforcementEntry>;
  matchCount: number;
  result: NavigationSearchResult;
  searchValue: string;
  selectedIndex: number;
}) {
  const existingEntry = currentReinforcement[result.node.id];
  const exactSearchBonus =
    normalizeFindItSearchValue(existingEntry?.lastSearchValue ?? "") === normalizeFindItSearchValue(searchValue) ? 2 : 1;
  const focusedBonus = matchCount <= 3 ? 2 : 1;

  return sanitizeReinforcement({
    ...currentReinforcement,
    [result.node.id]: {
      nodeId: result.node.id,
      label: result.node.label,
      kind: result.node.kind,
      score: (existingEntry?.score ?? 0) + exactSearchBonus + focusedBonus,
      selectionCount: (existingEntry?.selectionCount ?? 0) + 1,
      lastSearchValue: searchValue,
      lastSelectedIndex: selectedIndex,
      lastMatchCount: matchCount,
      lastSelectedAt: Date.now(),
    },
  });
}

export function createLearningSummary({
  intentHistory,
  memoryEntries,
  normalizedSearchValue,
  reinforcement,
}: {
  intentHistory: PersistentIntentEvent[];
  memoryEntries: FindItSelectionMemoryEntry[];
  normalizedSearchValue: string;
  reinforcement: Record<string, PersistentReinforcementEntry>;
}): LearningSummary {
  const strongestEntry =
    Object.values(reinforcement).sort(
      (left, right) => right.score - left.score || right.lastSelectedAt - left.lastSelectedAt,
    )[0] ?? null;

  const matchingIntentCount = normalizedSearchValue
    ? intentHistory.filter((event) => event.normalizedSearchValue === normalizedSearchValue).length
    : 0;

  const strongestScore = strongestEntry?.score ?? 0;
  const adaptiveConfidenceBoost = Math.min(12, matchingIntentCount * 2 + Math.floor(strongestScore / 3));

  const searchPatternStrength =
    matchingIntentCount === 0 ? "new" : matchingIntentCount <= 1 || strongestScore < 8 ? "familiar" : "reinforced";

  const adaptiveConfidenceLabel =
    searchPatternStrength === "reinforced"
      ? "Learning reinforced"
      : searchPatternStrength === "familiar"
        ? "Familiar pattern"
        : "New pattern";

  return {
    hasPersistentMemory: memoryEntries.length > 0 || intentHistory.length > 0 || strongestScore > 0,
    persistentMemoryCount: memoryEntries.length,
    intentHistoryCount: intentHistory.length,
    strongestNodeId: strongestEntry?.nodeId ?? null,
    strongestLabel: strongestEntry?.label ?? null,
    strongestScore,
    searchPatternStrength,
    adaptiveConfidenceBoost,
    adaptiveConfidenceLabel,
    adaptiveConfidenceCopy:
      searchPatternStrength === "reinforced"
        ? "Find It has seen this kind of choice before and can lean on remembered behavior."
        : searchPatternStrength === "familiar"
          ? "Find It recognizes part of this search pattern from earlier selections."
          : "Find It is learning this search pattern for the first time.",
    learningCopy:
      memoryEntries.length === 0 && intentHistory.length === 0
        ? "Persistent learning is ready. It will improve after you select results."
        : "Persistent learning is active across browser sessions.",
    lastRememberedAt: strongestEntry?.lastSelectedAt ?? null,
  };
}