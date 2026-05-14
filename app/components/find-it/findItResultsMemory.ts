import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

export type FindItSelectionMemoryEntry = {
  queryKey: string;
  queryPreview: string;
  selectedNodeId: string;
  selectedLabel: string;
  selectedKind: string;
  selectedIndex: number;
  matchCount: number;
  selectedAt: number;
  selectionCount: number;
};

export type FindItSelectionMemorySnapshot = {
  entries: FindItSelectionMemoryEntry[];
  recentSelections: FindItSelectionMemoryEntry[];
  exactHit: FindItSelectionMemoryEntry | null;
  fuzzyHit: FindItSelectionMemoryEntry | null;
  restoredNodeId: string | null;
  restoredIndex: number | null;
  memoryStrength: "none" | "weak" | "medium" | "strong";
  memoryMessage: string;
};

const MAX_MEMORY_ENTRIES = 24;
const MAX_RECENT_SELECTIONS = 8;
const EMPTY_QUERY_KEY = "__empty_find_it_query__";

function normalizeQuery(value: string) {
  const cleanValue = value
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanValue || EMPTY_QUERY_KEY;
}

function createQueryPreview(queryKey: string) {
  if (queryKey === EMPTY_QUERY_KEY) {
    return "empty search";
  }

  if (queryKey.length <= 36) {
    return queryKey;
  }

  return `${queryKey.slice(0, 33)}...`;
}

function getResultKind(result: NavigationSearchResult) {
  return result.node.kind.replace(/_/g, " ");
}

function clampIndex(index: number, matchCount: number) {
  if (matchCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), matchCount - 1);
}

function sortNewestFirst(
  left: FindItSelectionMemoryEntry,
  right: FindItSelectionMemoryEntry,
) {
  return right.selectedAt - left.selectedAt;
}

function getSharedWordCount(left: string, right: string) {
  const leftWords = new Set(left.split(" ").filter(Boolean));
  const rightWords = new Set(right.split(" ").filter(Boolean));

  let shared = 0;

  leftWords.forEach((word) => {
    if (rightWords.has(word)) {
      shared += 1;
    }
  });

  return shared;
}

function findExactMemoryHit(
  entries: FindItSelectionMemoryEntry[],
  queryKey: string,
) {
  return entries.find((entry) => entry.queryKey === queryKey) ?? null;
}

function findFuzzyMemoryHit(
  entries: FindItSelectionMemoryEntry[],
  queryKey: string,
) {
  if (queryKey === EMPTY_QUERY_KEY) {
    return null;
  }

  const ranked = entries
    .filter((entry) => entry.queryKey !== EMPTY_QUERY_KEY)
    .map((entry) => {
      const sharedWords = getSharedWordCount(entry.queryKey, queryKey);
      const startsNear =
        entry.queryKey.startsWith(queryKey) || queryKey.startsWith(entry.queryKey);

      const score =
        sharedWords * 4 +
        (startsNear ? 5 : 0) +
        Math.min(entry.selectionCount, 5);

      return { entry, score };
    })
    .filter((item) => item.score >= 5)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.entry ?? null;
}

function findRestoredIndex(
  matches: NavigationSearchResult[],
  memoryEntry: FindItSelectionMemoryEntry | null,
) {
  if (!memoryEntry) {
    return null;
  }

  const exactIndex = matches.findIndex(
    (result) => result.node.id === memoryEntry.selectedNodeId,
  );

  if (exactIndex >= 0) {
    return exactIndex;
  }

  const labelIndex = matches.findIndex(
    (result) =>
      result.node.label.toLowerCase() === memoryEntry.selectedLabel.toLowerCase(),
  );

  if (labelIndex >= 0) {
    return labelIndex;
  }

  return null;
}

function getMemoryStrength({
  exactHit,
  fuzzyHit,
  restoredIndex,
}: {
  exactHit: FindItSelectionMemoryEntry | null;
  fuzzyHit: FindItSelectionMemoryEntry | null;
  restoredIndex: number | null;
}): FindItSelectionMemorySnapshot["memoryStrength"] {
  if (exactHit && restoredIndex !== null && exactHit.selectionCount >= 3) {
    return "strong";
  }

  if (exactHit && restoredIndex !== null) {
    return "medium";
  }

  if (fuzzyHit && restoredIndex !== null) {
    return "weak";
  }

  return "none";
}

function getMemoryMessage({
  exactHit,
  fuzzyHit,
  restoredIndex,
}: {
  exactHit: FindItSelectionMemoryEntry | null;
  fuzzyHit: FindItSelectionMemoryEntry | null;
  restoredIndex: number | null;
}) {
  if (exactHit && restoredIndex !== null) {
    return `Memory restored your previous target: ${exactHit.selectedLabel}.`;
  }

  if (fuzzyHit && restoredIndex !== null) {
    return `Memory found a similar earlier target: ${fuzzyHit.selectedLabel}.`;
  }

  if (exactHit || fuzzyHit) {
    return "Memory found a past choice, but it is not in the current results.";
  }

  return "No saved selection memory for this search yet.";
}

export function createEmptyFindItSelectionMemorySnapshot(): FindItSelectionMemorySnapshot {
  return {
    entries: [],
    recentSelections: [],
    exactHit: null,
    fuzzyHit: null,
    restoredNodeId: null,
    restoredIndex: null,
    memoryStrength: "none",
    memoryMessage: "No saved selection memory for this search yet.",
  };
}

export function getFindItSelectionMemorySnapshot({
  entries,
  searchValue,
  matches,
}: {
  entries: FindItSelectionMemoryEntry[];
  searchValue: string;
  matches: NavigationSearchResult[];
}): FindItSelectionMemorySnapshot {
  const queryKey = normalizeQuery(searchValue);
  const exactHit = findExactMemoryHit(entries, queryKey);
  const fuzzyHit = exactHit ? null : findFuzzyMemoryHit(entries, queryKey);
  const memoryHit = exactHit ?? fuzzyHit;

  const restoredIndex = findRestoredIndex(matches, memoryHit);
  const restoredNodeId =
    restoredIndex !== null ? matches[restoredIndex]?.node.id ?? null : null;

  return {
    entries,
    recentSelections: [...entries].sort(sortNewestFirst).slice(0, MAX_RECENT_SELECTIONS),
    exactHit,
    fuzzyHit,
    restoredNodeId,
    restoredIndex,
    memoryStrength: getMemoryStrength({ exactHit, fuzzyHit, restoredIndex }),
    memoryMessage: getMemoryMessage({ exactHit, fuzzyHit, restoredIndex }),
  };
}

export function rememberFindItSelection({
  entries,
  searchValue,
  selectedResult,
  selectedIndex,
  matchCount,
  now = Date.now(),
}: {
  entries: FindItSelectionMemoryEntry[];
  searchValue: string;
  selectedResult: NavigationSearchResult;
  selectedIndex: number;
  matchCount: number;
  now?: number;
}) {
  const queryKey = normalizeQuery(searchValue);
  const cleanIndex = clampIndex(selectedIndex, matchCount);
  const existingEntry = entries.find((entry) => entry.queryKey === queryKey);

  const nextEntry: FindItSelectionMemoryEntry = {
    queryKey,
    queryPreview: createQueryPreview(queryKey),
    selectedNodeId: selectedResult.node.id,
    selectedLabel: selectedResult.node.label,
    selectedKind: getResultKind(selectedResult),
    selectedIndex: cleanIndex,
    matchCount,
    selectedAt: now,
    selectionCount: (existingEntry?.selectionCount ?? 0) + 1,
  };

  const withoutCurrentQuery = entries.filter((entry) => entry.queryKey !== queryKey);

  return [nextEntry, ...withoutCurrentQuery]
    .sort(sortNewestFirst)
    .slice(0, MAX_MEMORY_ENTRIES);
}

export function describeFindItMemoryStrength(
  strength: FindItSelectionMemorySnapshot["memoryStrength"],
) {
  if (strength === "strong") {
    return "Strong memory";
  }

  if (strength === "medium") {
    return "Useful memory";
  }

  if (strength === "weak") {
    return "Soft memory";
  }

  return "No memory";
}