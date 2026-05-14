import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import { clampFindItSelectedIndex } from "./findItPanelUtils";
import {
  getFindItResultId,
  getFindItResultLabel,
} from "./findItResultRanking";
import type {
  FindItSelectionReason,
  FindItSelectionSnapshot,
  FindItSelectionTarget,
} from "./FindItSearchControllerTypes";

export function getFindItSelectionSnapshot({
  reason,
  selectedIndex,
  selectedResult,
}: {
  reason: FindItSelectionReason;
  selectedIndex: number;
  selectedResult: NavigationSearchResult | null;
}): FindItSelectionSnapshot {
  return {
    index: selectedIndex,
    label: getFindItResultLabel(selectedResult),
    nodeId: getFindItResultId(selectedResult),
    reason,
  };
}

export function getFindItResultIndexByNodeId({
  matches,
  nodeId,
}: {
  matches: NavigationSearchResult[];
  nodeId: string | null;
}) {
  if (!nodeId) {
    return -1;
  }

  return matches.findIndex((match) => match.node.id === nodeId);
}

export function getFindItResultIndexByResult({
  matches,
  result,
}: {
  matches: NavigationSearchResult[];
  result: NavigationSearchResult;
}) {
  return matches.findIndex((match) => match.node.id === result.node.id);
}

export function getFindItPreferredSelectedIndex({
  matches,
  selectedIndex,
  selectedResultId,
}: {
  matches: NavigationSearchResult[];
  selectedIndex: number;
  selectedResultId: string | null;
}) {
  const rememberedIndex = getFindItResultIndexByNodeId({
    matches,
    nodeId: selectedResultId,
  });

  return rememberedIndex >= 0 ? rememberedIndex : selectedIndex;
}

export function getFindItSafeSelectionTarget({
  matches,
  preferredSelectedIndex,
}: {
  matches: NavigationSearchResult[];
  preferredSelectedIndex: number;
}): FindItSelectionTarget {
  const index = clampFindItSelectedIndex(preferredSelectedIndex, matches);

  return {
    index,
    result: matches[index] ?? matches[0] ?? null,
  };
}

export function getNextFindItSelectedIndex({
  currentIndex,
  matches,
  nextIndex,
}: {
  currentIndex: number;
  matches: NavigationSearchResult[];
  nextIndex: number;
}) {
  if (matches.length === 0) {
    return 0;
  }

  const clampedIndex = clampFindItSelectedIndex(nextIndex, matches);

  if (clampedIndex === currentIndex) {
    return currentIndex;
  }

  return clampedIndex;
}

export function getFindItFinalIndex(matches: NavigationSearchResult[]) {
  return Math.max(matches.length - 1, 0);
}