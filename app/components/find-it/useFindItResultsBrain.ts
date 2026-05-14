import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import {
  createEmptyFindItSelectionMemorySnapshot,
  getFindItSelectionMemorySnapshot,
  rememberFindItSelection,
  type FindItSelectionMemoryEntry,
} from "./findItResultsMemory";
import { createFindItIntentState } from "./findItResultsIntent";
import { createFindItPredictionModel } from "./findItResultsPrediction";
import {
  createEmptyPersistentResultsBrainState,
  createLearningSummary,
  createPersistentIntentEvent,
  getFindItResultConfidenceLabel,
  normalizeFindItSearchValue,
  readPersistentResultsBrainState,
  reinforceResultSelection,
  STORAGE_WRITE_DELAY_MS,
  trimPersistentMemoryEntries,
  writePersistentResultsBrainState,
  type PersistentResultsBrainState,
} from "./findItResultsPersistence";

function getResultKindLabel(result: NavigationSearchResult | null): string {
  if (!result) return "No result selected";

  const cleanKind = result.node.kind.replace(/_/g, " ");
  return cleanKind.charAt(0).toUpperCase() + cleanKind.slice(1);
}

function getResultConfidenceCopy(matchCount: number): string {
  if (matchCount === 1) return "Find It found one clear destination.";
  if (matchCount <= 3) return "Small set of strong candidates. Selection is stable.";
  if (matchCount <= 6) return "Several possible matches. Compare before opening.";
  return "Many possible matches. Refine or step carefully.";
}

function getDecisionGuidance(matchCount: number) {
  if (matchCount === 1) {
    return {
      strategy: "Safe to proceed. Verify path quickly, then open.",
      warning: null as string | null,
    };
  }

  if (matchCount <= 3) {
    return {
      strategy: "Compare 2–3 results using Meaning + Path panels before opening.",
      warning: null as string | null,
    };
  }

  return {
    strategy: "Move slowly. Use arrow keys to inspect each result before deciding.",
    warning: "Opening too quickly may send you to the wrong area.",
  };
}

function getSearchInterpretation(matchCount: number) {
  if (matchCount === 0) return "No interpretation yet.";
  if (matchCount === 1) return "Find It is confident in your intent.";
  if (matchCount <= 3) return "Find It narrowed your intent to a few strong options.";
  return "Find It sees multiple possible meanings in your input.";
}

function getComparisonHint(matchCount: number) {
  if (matchCount <= 1) return null;
  if (matchCount <= 3) return "Compare meaning and path panels for each option.";
  return "Large result set — refine search or step carefully.";
}

function getPanelTone(matchCount: number) {
  if (matchCount === 1) return "border-emerald-300/40 bg-emerald-300/10";
  if (matchCount <= 3) return "border-sky-300/40 bg-sky-300/10";
  return "border-white/10 bg-white/[0.03]";
}

function getSafeIndex(index: number, matchCount: number) {
  if (matchCount <= 0) return 0;
  return Math.min(Math.max(index, 0), matchCount - 1);
}

export function useFindItResultsBrain({
  searchValue,
  matches,
  safeSelectedIndex,
  selectResult,
}: {
  searchValue: string;
  matches: NavigationSearchResult[];
  safeSelectedIndex: number;
  selectResult: (result: NavigationSearchResult) => void;
}) {
  const [persistentState, setPersistentState] = useState<PersistentResultsBrainState>(() =>
    createEmptyPersistentResultsBrainState(),
  );
  const [hasLoadedPersistentState, setHasLoadedPersistentState] = useState(false);

  const previousSelectedNodeIdRef = useRef<string | null>(null);
  const storageWriteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeIndex = getSafeIndex(safeSelectedIndex, matches.length);
  const normalizedSearchValue = normalizeFindItSearchValue(searchValue);

  useEffect(() => {
    setPersistentState(readPersistentResultsBrainState());
    setHasLoadedPersistentState(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedPersistentState) return;

    if (storageWriteTimeoutRef.current) {
      clearTimeout(storageWriteTimeoutRef.current);
    }

    storageWriteTimeoutRef.current = setTimeout(() => {
      writePersistentResultsBrainState(persistentState);
    }, STORAGE_WRITE_DELAY_MS);

    return () => {
      if (storageWriteTimeoutRef.current) {
        clearTimeout(storageWriteTimeoutRef.current);
      }
    };
  }, [hasLoadedPersistentState, persistentState]);

  const memory = useMemo(() => {
    if (matches.length === 0) return createEmptyFindItSelectionMemorySnapshot();

    return getFindItSelectionMemorySnapshot({
      entries: persistentState.memoryEntries,
      searchValue,
      matches,
    });
  }, [matches, persistentState.memoryEntries, searchValue]);

  const prediction = useMemo(
    () =>
      createFindItPredictionModel({
        matches,
        searchValue,
        memory,
      }),
    [matches, memory, searchValue],
  );

  const learning = useMemo(
    () =>
      createLearningSummary({
        intentHistory: persistentState.intentHistory,
        memoryEntries: persistentState.memoryEntries,
        normalizedSearchValue,
        reinforcement: persistentState.reinforcement,
      }),
    [normalizedSearchValue, persistentState],
  );

  const intent = useMemo(
    () =>
      createFindItIntentState({
        matches,
        safeSelectedIndex: safeIndex,
        previousSelectedNodeId: previousSelectedNodeIdRef.current,
        prediction,
        restoredIndex: memory.restoredIndex,
      }),
    [matches, memory.restoredIndex, prediction, safeIndex],
  );

  useEffect(() => {
    previousSelectedNodeIdRef.current = intent.selectedNodeId;
  }, [intent.selectedNodeId]);

  const selectedResult = intent.selectedResult;
  const activeSelectedIndex = intent.stableSelectedIndex;

  const rememberSelection = useCallback(
    (result: NavigationSearchResult, index: number) => {
      const confidenceLabel = getFindItResultConfidenceLabel(matches.length);

      setPersistentState((currentState) => {
        const nextMemoryEntries: FindItSelectionMemoryEntry[] = trimPersistentMemoryEntries(
          rememberFindItSelection({
            entries: currentState.memoryEntries,
            searchValue,
            selectedResult: result,
            selectedIndex: index,
            matchCount: matches.length,
          }),
        );

        return {
          version: 1,
          savedAt: Date.now(),
          memoryEntries: nextMemoryEntries,
          intentHistory: [
            ...currentState.intentHistory,
            createPersistentIntentEvent({
              confidenceLabel,
              matchCount: matches.length,
              normalizedSearchValue,
              result,
              searchValue,
              selectedIndex: index,
            }),
          ],
          reinforcement: reinforceResultSelection({
            currentReinforcement: currentState.reinforcement,
            matchCount: matches.length,
            result,
            searchValue,
            selectedIndex: index,
          }),
        };
      });
    },
    [matches.length, normalizedSearchValue, searchValue],
  );

  const selectResultWithMemory = useCallback(
    (result: NavigationSearchResult) => {
      const resultIndex = matches.findIndex((match) => match.node.id === result.node.id);
      const nextIndex = resultIndex >= 0 ? resultIndex : safeIndex;

      rememberSelection(result, nextIndex);
      previousSelectedNodeIdRef.current = result.node.id;
      selectResult(result);
    },
    [matches, rememberSelection, safeIndex, selectResult],
  );

  const resultKindLabel = getResultKindLabel(selectedResult);
  const confidenceLabel = getFindItResultConfidenceLabel(matches.length);
  const confidenceCopy = getResultConfidenceCopy(matches.length);
  const guidance = getDecisionGuidance(matches.length);
  const interpretation = getSearchInterpretation(matches.length);
  const comparisonHint = getComparisonHint(matches.length);
  const panelTone = getPanelTone(matches.length);

  return {
    activeSelectedIndex,
    comparisonHint,
    confidenceCopy,
    confidenceLabel,
    guidance,
    intent,
    interpretation,
    learning,
    memory,
    panelTone,
    persistentState,
    prediction,
    resultKindLabel,
    selectedResult,
    selectResultWithMemory,
  };
}