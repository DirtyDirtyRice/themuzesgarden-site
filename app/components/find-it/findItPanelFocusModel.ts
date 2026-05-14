import type { NavigationSearchResult } from "@/lib/navigation/navigationSearch";

export type FindItPanelFocusSnapshot = {
  activeNodeId: string | null;
  activeLabel: string;
  activeKind: string;
  selectedIndexLabel: string;
  matchCountLabel: string;
  focusLabel: string;
  focusMessage: string;
};

function getKind(result: NavigationSearchResult | null) {
  if (!result) return "none";
  return result.node.kind.replace(/_/g, " ");
}

export function createFocusSnapshot({
  activeResult,
  safeSelectedIndex,
  matchCount,
  hasFocusedTarget,
}: {
  activeResult: NavigationSearchResult | null;
  safeSelectedIndex: number;
  matchCount: number;
  hasFocusedTarget: boolean;
}): FindItPanelFocusSnapshot {
  const label = activeResult?.node.label ?? "No active target";

  if (!activeResult) {
    return {
      activeNodeId: null,
      activeLabel: label,
      activeKind: "none",
      selectedIndexLabel: "none",
      matchCountLabel: `${matchCount} results`,
      focusLabel: "Waiting",
      focusMessage: "No active target yet.",
    };
  }

  return {
    activeNodeId: activeResult.node.id,
    activeLabel: label,
    activeKind: getKind(activeResult),
    selectedIndexLabel: `${safeSelectedIndex + 1} of ${matchCount}`,
    matchCountLabel: `${matchCount} results`,
    focusLabel: hasFocusedTarget ? "Focused target" : "Comparing",
    focusMessage: hasFocusedTarget
      ? `${label} is strong enough to lead layout.`
      : `${label} is selected but still in comparison mode.`,
  };
}