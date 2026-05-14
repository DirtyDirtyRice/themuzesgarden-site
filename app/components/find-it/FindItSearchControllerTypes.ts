import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

export type FindItResultSource = "navigation" | "metadata" | "merged";

export type FindItSearchMode =
  | "idle"
  | "debouncing"
  | "no_results"
  | "single_result"
  | "focused_results"
  | "compare_results"
  | "wide_results";

export type FindItSelectionReason =
  | "initial"
  | "search_changed"
  | "keyboard"
  | "click"
  | "clamped"
  | "cleared";

export type FindItControllerStatus = {
  mode: FindItSearchMode;
  label: string;
  detail: string;
  matchCount: number;
  selectedIndex: number;
  selectedLabel: string | null;
  topResultLabel: string | null;
};

export type FindItResultSourceSummary = {
  navigationCount: number;
  metadataCount: number;
  mergedCount: number;
  hasNavigationMatches: boolean;
  hasMetadataMatches: boolean;
  dominantSource: FindItResultSource;
};

export type FindItSelectionSnapshot = {
  index: number;
  label: string | null;
  nodeId: string | null;
  reason: FindItSelectionReason;
};

export type FindItControllerInput = {
  searchValue: string;
  onSearchChange: (value: string) => void;
};

export type FindItMatchGroups = {
  metadataMatches: NavigationSearchResult[];
  navigationMatches: NavigationSearchResult[];
};

export type FindItSelectionTarget = {
  index: number;
  result: NavigationSearchResult | null;
};

export function isFindItResult(
  result: NavigationSearchResult | null | undefined,
): result is NavigationSearchResult {
  return !!result;
}