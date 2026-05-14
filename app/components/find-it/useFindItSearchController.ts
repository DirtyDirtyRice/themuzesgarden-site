import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { searchNavigationNodes } from "@/lib/navigation/navigationSearch";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import { getFindItMetadataResults } from "./findItMetadataAdapter";
import { getFindItSuggestionPhrases } from "./findItPanelUtils";
import {
  NAVIGATION_RESULT_LIMIT,
  SEARCH_DEBOUNCE_MS,
} from "./FindItSearchControllerConstants";
import { getFindItControllerStatus } from "./findItControllerStatus";
import { getFindItKeyboardCommand } from "./findItKeyboardModel";
import { mergeFindItResultGroups } from "./findItResultMerge";
import {
  getFindItResultId,
  getFindItResultLabel,
} from "./findItResultRanking";
import {
  getFindItFinalIndex,
  getFindItPreferredSelectedIndex,
  getFindItResultIndexByResult,
  getFindItSafeSelectionTarget,
  getFindItSelectionSnapshot,
  getNextFindItSelectedIndex,
} from "./findItSelectionModel";
import { getFindItSourceSummary } from "./findItSourceSummary";
import type {
  FindItControllerInput,
  FindItSelectionReason,
} from "./FindItSearchControllerTypes";
import {
  getCleanFindItSearchValue,
  hasUsableFindItSearchText,
  isFindItWaitingForDebounce,
  useFindItDebouncedValue,
} from "./useFindItDebouncedValue";

export function useFindItSearchController({
  searchValue,
  onSearchChange,
}: FindItControllerInput) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [selectionReason, setSelectionReason] =
    useState<FindItSelectionReason>("initial");

  const debouncedSearchValue = useFindItDebouncedValue(
    searchValue,
    SEARCH_DEBOUNCE_MS,
  );

  const cleanSearchValue = getCleanFindItSearchValue(debouncedSearchValue);
  const hasSearchText = hasUsableFindItSearchText(cleanSearchValue);
  const isWaitingForDebounce = isFindItWaitingForDebounce({
    debouncedSearchValue,
    searchValue,
  });

  const navigationMatches = useMemo(() => {
    if (!hasSearchText) {
      return [];
    }

    return searchNavigationNodes(cleanSearchValue, {
      limit: NAVIGATION_RESULT_LIMIT,
    });
  }, [cleanSearchValue, hasSearchText]);

  const metadataMatches = useMemo(() => {
    if (!hasSearchText) {
      return [];
    }

    return getFindItMetadataResults(cleanSearchValue);
  }, [cleanSearchValue, hasSearchText]);

  const matches = useMemo(
    () =>
      mergeFindItResultGroups({
        metadataMatches,
        navigationMatches,
      }),
    [metadataMatches, navigationMatches],
  );

  const sourceSummary = useMemo(
    () =>
      getFindItSourceSummary({
        matches,
        metadataMatches,
        navigationMatches,
      }),
    [matches, metadataMatches, navigationMatches],
  );

  const suggestions = useMemo(
    () => getFindItSuggestionPhrases(searchValue),
    [searchValue],
  );

  const preferredSelectedIndex = getFindItPreferredSelectedIndex({
    matches,
    selectedIndex,
    selectedResultId,
  });

  const safeSelectionTarget = getFindItSafeSelectionTarget({
    matches,
    preferredSelectedIndex,
  });

  const safeSelectedIndex = safeSelectionTarget.index;

  const selectedResult = hasSearchText ? safeSelectionTarget.result : null;
  const topResult = hasSearchText ? matches[0] ?? null : null;
  const selectedLabel = getFindItResultLabel(selectedResult);
  const topResultLabel = getFindItResultLabel(topResult);
  const hasFocusedTarget = Boolean(selectedResult);
  const canClearSearch = searchValue.length > 0 || selectedIndex !== 0;

  const controllerStatus = useMemo(
    () =>
      getFindItControllerStatus({
        isWaitingForDebounce,
        hasSearchText,
        matches,
        selectedIndex: safeSelectedIndex,
        selectedResult,
        sourceSummary,
        topResult,
      }),
    [
      hasSearchText,
      isWaitingForDebounce,
      matches,
      safeSelectedIndex,
      selectedResult,
      sourceSummary,
      topResult,
    ],
  );

  const selectionSnapshot = useMemo(
    () =>
      getFindItSelectionSnapshot({
        reason: selectionReason,
        selectedIndex: safeSelectedIndex,
        selectedResult,
      }),
    [safeSelectedIndex, selectedResult, selectionReason],
  );

  useEffect(() => {
    if (!hasSearchText) {
      if (selectedIndex !== 0) {
        setSelectedIndex(0);
      }

      if (selectedResultId !== null) {
        setSelectedResultId(null);
      }

      if (selectionReason !== "cleared") {
        setSelectionReason("cleared");
      }

      return;
    }

    if (selectedIndex !== safeSelectedIndex) {
      setSelectedIndex(safeSelectedIndex);
      setSelectionReason("clamped");
    }
  }, [
    hasSearchText,
    safeSelectedIndex,
    selectedIndex,
    selectedResultId,
    selectionReason,
  ]);

  useEffect(() => {
    const nextSelectedResultId = getFindItResultId(selectedResult);

    if (nextSelectedResultId && nextSelectedResultId !== selectedResultId) {
      setSelectedResultId(nextSelectedResultId);
    }
  }, [selectedResult, selectedResultId]);

  const refocusSearchInput = useCallback(() => {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const resetFindItSearch = useCallback(() => {
    setSelectedIndex(0);
    setSelectedResultId(null);
    setSelectionReason("cleared");
    onSearchChange("");
    refocusSearchInput();
  }, [onSearchChange, refocusSearchInput]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSelectedIndex(0);
      setSelectedResultId(null);
      setSelectionReason("search_changed");
      onSearchChange(value);
    },
    [onSearchChange],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSearchChange(suggestion);
      refocusSearchInput();
    },
    [handleSearchChange, refocusSearchInput],
  );

  const selectResult = useCallback(
    (result: NavigationSearchResult) => {
      const nextIndex = getFindItResultIndexByResult({
        matches,
        result,
      });

      setSelectedIndex(nextIndex >= 0 ? nextIndex : 0);
      setSelectedResultId(result.node.id);
      setSelectionReason("click");
    },
    [matches],
  );

  const jumpSelectedIndex = useCallback(
    (amount: number) => {
      setSelectedIndex((current) => {
        const nextIndex = getNextFindItSelectedIndex({
          currentIndex: current,
          matches,
          nextIndex: current + amount,
        });

        const nextResult = matches[nextIndex] ?? null;

        setSelectedResultId(getFindItResultId(nextResult));
        setSelectionReason("keyboard");

        return nextIndex;
      });
    },
    [matches],
  );

  const moveToFirstResult = useCallback(() => {
    setSelectedIndex(0);
    setSelectedResultId(getFindItResultId(matches[0] ?? null));
    setSelectionReason("keyboard");
  }, [matches]);

  const moveToLastResult = useCallback(() => {
    const finalIndex = getFindItFinalIndex(matches);

    setSelectedIndex(finalIndex);
    setSelectedResultId(getFindItResultId(matches[finalIndex] ?? null));
    setSelectionReason("keyboard");
  }, [matches]);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      const command = getFindItKeyboardCommand(event.key);

      if (command.type === "clear") {
        if (canClearSearch) {
          event.preventDefault();
          resetFindItSearch();
        }

        return;
      }

      if (!hasSearchText) {
        return;
      }

      if (command.type === "jump") {
        event.preventDefault();
        jumpSelectedIndex(command.amount);
        return;
      }

      if (command.type === "first") {
        event.preventDefault();
        moveToFirstResult();
        return;
      }

      if (command.type === "last") {
        event.preventDefault();
        moveToLastResult();
        return;
      }

      if (command.type === "confirm_without_navigation") {
        event.preventDefault();
        // ENTER DOES NOT NAVIGATE.
        // The user must click a result, path step, or Go button.
      }
    },
    [
      canClearSearch,
      hasSearchText,
      jumpSelectedIndex,
      moveToFirstResult,
      moveToLastResult,
      resetFindItSearch,
    ],
  );

  return {
    canClearSearch,
    controllerStatus,
    handleSearchChange,
    handleSearchKeyDown,
    handleSuggestionClick,
    hasFocusedTarget,
    hasSearchText,
    inputRef,
    isWaitingForDebounce,
    matches,
    resetFindItSearch,
    safeSelectedIndex,
    searchValue,
    selectResult,
    selectedLabel,
    selectedResult,
    selectionSnapshot,
    sourceSummary,
    suggestions,
    topResultLabel,
  };
}