import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

import type { FindItPredictionModel } from "./findItResultsPrediction";

export type FindItIntentState = {
  selectedResult: NavigationSearchResult | null;
  selectedIndex: number;
  stableSelectedIndex: number;
  selectedNodeId: string | null;
  isStable: boolean;
  stabilityLabel: string;
  stabilityMessage: string;
  headline: string;
  explanation: string;
  nextStep: string;
};

function clampSelectedIndex(index: number, matchCount: number) {
  if (matchCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), matchCount - 1);
}

function findNodeIndex(matches: NavigationSearchResult[], nodeId: string | null) {
  if (!nodeId) {
    return -1;
  }

  return matches.findIndex((result) => result.node.id === nodeId);
}

function getStableSelectedIndex({
  matches,
  safeSelectedIndex,
  previousSelectedNodeId,
  predictedIndex,
  restoredIndex,
}: {
  matches: NavigationSearchResult[];
  safeSelectedIndex: number;
  previousSelectedNodeId: string | null;
  predictedIndex: number | null;
  restoredIndex: number | null;
}) {
  if (matches.length === 0) {
    return 0;
  }

  const previousIndex = findNodeIndex(matches, previousSelectedNodeId);

  if (previousIndex >= 0) {
    return previousIndex;
  }

  if (restoredIndex !== null) {
    return clampSelectedIndex(restoredIndex, matches.length);
  }

  if (predictedIndex !== null) {
    return clampSelectedIndex(predictedIndex, matches.length);
  }

  return clampSelectedIndex(safeSelectedIndex, matches.length);
}

function getStabilityLabel(isStable: boolean, matchCount: number) {
  if (matchCount === 0) {
    return "Waiting";
  }

  return isStable ? "Stable intent" : "Stabilizing";
}

function getStabilityMessage({
  isStable,
  selectedResult,
  matchCount,
}: {
  isStable: boolean;
  selectedResult: NavigationSearchResult | null;
  matchCount: number;
}) {
  if (!selectedResult || matchCount === 0) {
    return "Intent stability is waiting for results.";
  }

  if (isStable) {
    return `Selection is locked on ${selectedResult.node.label}.`;
  }

  return "Selection changed because the result set changed.";
}

function getIntentHeadline({
  selectedResult,
  matchCount,
  prediction,
}: {
  selectedResult: NavigationSearchResult | null;
  matchCount: number;
  prediction: FindItPredictionModel;
}) {
  if (!selectedResult) {
    return "Waiting for selection";
  }

  if (prediction.predictedNodeId === selectedResult.node.id) {
    return `Predicted target: ${selectedResult.node.label}`;
  }

  if (matchCount === 1) {
    return `Direct match: ${selectedResult.node.label}`;
  }

  if (matchCount <= 3) {
    return `Best candidate: ${selectedResult.node.label}`;
  }

  return `Exploring candidates: ${selectedResult.node.label}`;
}

function getIntentExplanation({
  selectedResult,
  matchCount,
  prediction,
}: {
  selectedResult: NavigationSearchResult | null;
  matchCount: number;
  prediction: FindItPredictionModel;
}) {
  if (!selectedResult) {
    return "Find It needs a selected result to begin path and meaning analysis.";
  }

  if (prediction.predictedNodeId === selectedResult.node.id) {
    return prediction.topCandidate?.reason ?? "The prediction layer prefers this result.";
  }

  if (matchCount === 1) {
    return "Your input clearly maps to a single destination.";
  }

  if (matchCount <= 3) {
    return "A small set of strong matches was found. This is the current best.";
  }

  return "There are multiple possible matches. Selection is a guided guess.";
}

function getIntentNextStep({
  selectedResult,
  matchCount,
  isStable,
}: {
  selectedResult: NavigationSearchResult | null;
  matchCount: number;
  isStable: boolean;
}) {
  if (!selectedResult) {
    return "Use arrow keys or click a result.";
  }

  if (!isStable) {
    return "Pause for the selection to stabilize, then compare panels.";
  }

  if (matchCount === 1) {
    return "Confirm path and open safely.";
  }

  if (matchCount <= 3) {
    return "Compare meaning and path before opening.";
  }

  return "Move through results and compare behavior.";
}

export function createFindItIntentState({
  matches,
  safeSelectedIndex,
  previousSelectedNodeId,
  prediction,
  restoredIndex,
}: {
  matches: NavigationSearchResult[];
  safeSelectedIndex: number;
  previousSelectedNodeId: string | null;
  prediction: FindItPredictionModel;
  restoredIndex: number | null;
}): FindItIntentState {
  const stableSelectedIndex = getStableSelectedIndex({
    matches,
    safeSelectedIndex,
    previousSelectedNodeId,
    predictedIndex: prediction.predictedIndex,
    restoredIndex,
  });

  const selectedResult = matches[stableSelectedIndex] ?? matches[0] ?? null;
  const selectedNodeId = selectedResult?.node.id ?? null;
  const requestedIndex = clampSelectedIndex(safeSelectedIndex, matches.length);
  const isStable = stableSelectedIndex === requestedIndex || matches.length <= 1;

  return {
    selectedResult,
    selectedIndex: requestedIndex,
    stableSelectedIndex,
    selectedNodeId,
    isStable,
    stabilityLabel: getStabilityLabel(isStable, matches.length),
    stabilityMessage: getStabilityMessage({
      isStable,
      selectedResult,
      matchCount: matches.length,
    }),
    headline: getIntentHeadline({
      selectedResult,
      matchCount: matches.length,
      prediction,
    }),
    explanation: getIntentExplanation({
      selectedResult,
      matchCount: matches.length,
      prediction,
    }),
    nextStep: getIntentNextStep({
      selectedResult,
      matchCount: matches.length,
      isStable,
    }),
  };
}