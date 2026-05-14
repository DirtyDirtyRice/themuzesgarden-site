import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

export type FindItPanelDecisionSnapshot = {
  shouldPromoteTargetPath: boolean;
  shouldLockMeaning: boolean;
  shouldFreezeLayout: boolean;
  shouldShowComparisonGrid: boolean;
  targetPathPlacement: "promoted" | "standard" | "hidden";
  meaningMode: "locked" | "compare" | "waiting";
  layoutMode: "stable" | "adaptive" | "waiting";
  primaryAction: string;
  decisionLabel: string;
  decisionMessage: string;
};

export function createDecisionSnapshot({
  activeResult,
  hasFocusedTarget,
  hasSearchText,
  isWaitingForDebounce,
  matchCount,
  safeSelectedIndex,
}: {
  activeResult: NavigationSearchResult | null;
  hasFocusedTarget: boolean;
  hasSearchText: boolean;
  isWaitingForDebounce: boolean;
  matchCount: number;
  safeSelectedIndex: number;
}): FindItPanelDecisionSnapshot {
  const hasTarget = !!activeResult;
  const isSingleResult = matchCount === 1;
  const isFocusedSet = matchCount > 0 && matchCount <= 3;
  const selectedNearTop = safeSelectedIndex <= 1;

  const shouldPromoteTargetPath =
    hasTarget &&
    hasSearchText &&
    !isWaitingForDebounce &&
    (hasFocusedTarget || isSingleResult || (isFocusedSet && selectedNearTop));

  const shouldLockMeaning =
    hasTarget &&
    hasSearchText &&
    !isWaitingForDebounce &&
    (isSingleResult || isFocusedSet);

  const shouldFreezeLayout =
    shouldPromoteTargetPath || shouldLockMeaning || isWaitingForDebounce;

  const shouldShowComparisonGrid = hasSearchText && matchCount > 1;

  const targetPathPlacement = shouldPromoteTargetPath
    ? "promoted"
    : hasTarget
      ? "standard"
      : "hidden";

  const meaningMode = shouldLockMeaning ? "locked" : hasTarget ? "compare" : "waiting";

  const layoutMode = shouldFreezeLayout
    ? "stable"
    : hasSearchText
      ? "adaptive"
      : "waiting";

  if (!hasSearchText) {
    return {
      shouldPromoteTargetPath,
      shouldLockMeaning,
      shouldFreezeLayout,
      shouldShowComparisonGrid,
      targetPathPlacement,
      meaningMode,
      layoutMode,
      primaryAction: "Start typing in Find It.",
      decisionLabel: "Waiting",
      decisionMessage: "Panel decisions start after search input.",
    };
  }

  if (isWaitingForDebounce) {
    return {
      shouldPromoteTargetPath,
      shouldLockMeaning,
      shouldFreezeLayout,
      shouldShowComparisonGrid,
      targetPathPlacement,
      meaningMode,
      layoutMode,
      primaryAction: "Pause while results update.",
      decisionLabel: "Stabilizing",
      decisionMessage: "Layout is held stable while search results settle.",
    };
  }

  if (!hasTarget || matchCount === 0) {
    return {
      shouldPromoteTargetPath,
      shouldLockMeaning,
      shouldFreezeLayout,
      shouldShowComparisonGrid,
      targetPathPlacement,
      meaningMode,
      layoutMode,
      primaryAction: "Try broader search words.",
      decisionLabel: "Recovery mode",
      decisionMessage: "No target is strong enough for panel coordination yet.",
    };
  }

  if (shouldPromoteTargetPath) {
    return {
      shouldPromoteTargetPath,
      shouldLockMeaning,
      shouldFreezeLayout,
      shouldShowComparisonGrid,
      targetPathPlacement,
      meaningMode,
      layoutMode,
      primaryAction: "Verify target path, then open safely.",
      decisionLabel: "Path promoted",
      decisionMessage: `${activeResult.node.label} is strong enough to lead route guidance.`,
    };
  }

  if (shouldLockMeaning) {
    return {
      shouldPromoteTargetPath,
      shouldLockMeaning,
      shouldFreezeLayout,
      shouldShowComparisonGrid,
      targetPathPlacement,
      meaningMode,
      layoutMode,
      primaryAction: "Read meaning, then compare path.",
      decisionLabel: "Meaning locked",
      decisionMessage: `${activeResult.node.label} is stable enough for locked meaning guidance.`,
    };
  }

  return {
    shouldPromoteTargetPath,
    shouldLockMeaning,
    shouldFreezeLayout,
    shouldShowComparisonGrid,
    targetPathPlacement,
    meaningMode,
    layoutMode,
    primaryAction: "Compare results before opening.",
    decisionLabel: "Comparison mode",
    decisionMessage: "Multiple results are possible, so panels stay in comparison mode.",
  };
}