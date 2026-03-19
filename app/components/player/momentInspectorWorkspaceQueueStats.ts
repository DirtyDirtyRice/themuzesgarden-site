import type { MomentInspectorWorkspaceFamilyItem } from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceQueueStats = {
  visibleCount: number;
  pinnedCount: number;
  bookmarkedCount: number;
  comparedCount: number;
  highPriorityCount: number;
};

export function buildMomentInspectorWorkspaceQueueStats(
  items: MomentInspectorWorkspaceFamilyItem[]
): MomentInspectorWorkspaceQueueStats {
  return {
    visibleCount: items.length,
    pinnedCount: items.filter((item) => item.pinned).length,
    bookmarkedCount: items.filter((item) => item.bookmarked).length,
    comparedCount: items.filter((item) => item.compared).length,
    highPriorityCount: items.filter(
      (item) => (item.repairPriorityScore ?? 0) >= 70
    ).length,
  };
}