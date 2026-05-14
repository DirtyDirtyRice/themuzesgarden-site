import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import { getFindItSearchModeLabel } from "./FindItSearchControllerConstants";
import { getFindItResultLabel } from "./findItResultRanking";
import type {
  FindItControllerStatus,
  FindItResultSourceSummary,
  FindItSearchMode,
} from "./FindItSearchControllerTypes";

export function getFindItSearchMode({
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
}: {
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
}): FindItSearchMode {
  if (!hasSearchText) return "idle";
  if (isWaitingForDebounce) return "debouncing";
  if (matchCount === 0) return "no_results";
  if (matchCount === 1) return "single_result";
  if (matchCount <= 3) return "focused_results";
  if (matchCount <= 8) return "compare_results";

  return "wide_results";
}

export function getFindItSearchModeDetail({
  mode,
  sourceSummary,
}: {
  mode: FindItSearchMode;
  sourceSummary: FindItResultSourceSummary;
}) {
  if (mode === "idle") return "Waiting for search text.";
  if (mode === "debouncing") return "Waiting for typed text to settle.";
  if (mode === "no_results") {
    return "No matching navigation or metadata destinations were found.";
  }
  if (mode === "single_result") return "One destination is driving the panels.";
  if (mode === "focused_results") {
    return "A small set of likely choices is available.";
  }
  if (mode === "compare_results") {
    return "Several results should be compared before opening.";
  }

  return `Wide scan across ${sourceSummary.navigationCount} navigation and ${sourceSummary.metadataCount} metadata matches.`;
}

export function getFindItControllerStatus({
  isWaitingForDebounce,
  hasSearchText,
  matches,
  selectedIndex,
  selectedResult,
  sourceSummary,
  topResult,
}: {
  isWaitingForDebounce: boolean;
  hasSearchText: boolean;
  matches: NavigationSearchResult[];
  selectedIndex: number;
  selectedResult: NavigationSearchResult | null;
  sourceSummary: FindItResultSourceSummary;
  topResult: NavigationSearchResult | null;
}): FindItControllerStatus {
  const mode = getFindItSearchMode({
    hasSearchText,
    isWaitingForDebounce,
    matchCount: matches.length,
  });

  return {
    mode,
    label: getFindItSearchModeLabel(mode),
    detail: getFindItSearchModeDetail({ mode, sourceSummary }),
    matchCount: matches.length,
    selectedIndex,
    selectedLabel: getFindItResultLabel(selectedResult),
    topResultLabel: getFindItResultLabel(topResult),
  };
}