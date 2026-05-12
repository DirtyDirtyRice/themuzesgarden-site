import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { searchNavigationNodes } from "@/lib/navigation/navigationSearch";
import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import {
  clampFindItSelectedIndex,
  getFindItSuggestionPhrases,
} from "./findItPanelUtils";

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

function getNavigationResultLabel(result: NavigationSearchResult | null) {
  return result?.node.label ?? null;
}

export function useFindItSearchController({
  searchValue,
  onSearchChange,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedSearchValue = useDebouncedValue(searchValue, 120);
  const cleanSearchValue = debouncedSearchValue.trim();
  const hasSearchText = cleanSearchValue.length > 0;
  const isWaitingForDebounce = searchValue.trim() !== cleanSearchValue;

  const matches = useMemo(() => {
    if (!hasSearchText) {
      return [];
    }

    return searchNavigationNodes(cleanSearchValue, {
      limit: 12,
    });
  }, [cleanSearchValue, hasSearchText]);

  const suggestions = useMemo(
    () => getFindItSuggestionPhrases(searchValue),
    [searchValue],
  );

  const safeSelectedIndex = clampFindItSelectedIndex(selectedIndex, matches);
  const selectedResult = hasSearchText
    ? matches[safeSelectedIndex] ?? matches[0] ?? null
    : null;
  const topResult = hasSearchText ? matches[0] ?? null : null;
  const selectedLabel = getNavigationResultLabel(selectedResult);
  const topResultLabel = getNavigationResultLabel(topResult);
  const hasFocusedTarget = Boolean(selectedResult);
  const canClearSearch = searchValue.length > 0 || selectedIndex !== 0;

  useEffect(() => {
    if (selectedIndex !== safeSelectedIndex) {
      setSelectedIndex(safeSelectedIndex);
    }
  }, [safeSelectedIndex, selectedIndex]);

  function refocusSearchInput() {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function resetFindItSearch() {
    setSelectedIndex(0);
    onSearchChange("");
    refocusSearchInput();
  }

  function handleSearchChange(value: string) {
    setSelectedIndex(0);
    onSearchChange(value);
  }

  function handleSuggestionClick(suggestion: string) {
    handleSearchChange(suggestion);
    refocusSearchInput();
  }

  function selectResult(result: NavigationSearchResult) {
    const nextIndex = matches.findIndex(
      (match) => match.node.id === result.node.id,
    );

    setSelectedIndex(nextIndex >= 0 ? nextIndex : 0);
  }

  function jumpSelectedIndex(amount: number) {
    setSelectedIndex((current) =>
      clampFindItSelectedIndex(current + amount, matches),
    );
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      if (canClearSearch) {
        event.preventDefault();
        resetFindItSearch();
      }

      return;
    }

    if (!hasSearchText) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      jumpSelectedIndex(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      jumpSelectedIndex(-1);
      return;
    }

    if (event.key === "PageDown") {
      event.preventDefault();
      jumpSelectedIndex(5);
      return;
    }

    if (event.key === "PageUp") {
      event.preventDefault();
      jumpSelectedIndex(-5);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setSelectedIndex(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setSelectedIndex(Math.max(matches.length - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      // ENTER NO LONGER NAVIGATES
      // User must click a result, path step, or Go button.
    }
  }

  return {
    canClearSearch,
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
    suggestions,
    topResultLabel,
  };
}