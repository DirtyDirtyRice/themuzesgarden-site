import type {
  MomentInspectorWorkspaceDerivedState,
  MomentInspectorWorkspaceLane,
} from "./momentInspectorWorkspace.types";

export type MomentInspectorWorkspaceSummaryMetric = {
  key: string;
  label: string;
  value: number;
};

export type MomentInspectorWorkspaceLaneCountMap = Record<
  MomentInspectorWorkspaceLane,
  number
>;

export type MomentInspectorWorkspaceSummary = {
  totalFamilies: number;
  laneCounts: MomentInspectorWorkspaceLaneCountMap;
  pinnedCount: number;
  bookmarkedCount: number;
  comparedCount: number;
  highPriorityCount: number;
  metrics: MomentInspectorWorkspaceSummaryMetric[];
};

function countWhere(values: boolean[]): number {
  return values.filter(Boolean).length;
}

export function buildMomentInspectorWorkspaceSummary(
  state: MomentInspectorWorkspaceDerivedState
): MomentInspectorWorkspaceSummary {
  const allItems = [
    ...state.queues.watch.items,
    ...state.queues.repair.items,
    ...state.queues.blocked.items,
  ];

  const laneCounts: MomentInspectorWorkspaceLaneCountMap = {
    watch: state.queues.watch.count,
    repair: state.queues.repair.count,
    blocked: state.queues.blocked.count,
  };

  const pinnedCount = countWhere(allItems.map((item) => item.pinned));
  const bookmarkedCount = countWhere(allItems.map((item) => item.bookmarked));
  const comparedCount = countWhere(allItems.map((item) => item.compared));
  const highPriorityCount = allItems.filter(
    (item) => (item.repairPriorityScore ?? 0) >= 70
  ).length;

  return {
    totalFamilies: state.totalCount,
    laneCounts,
    pinnedCount,
    bookmarkedCount,
    comparedCount,
    highPriorityCount,
    metrics: [
      {
        key: "total",
        label: "Total Families",
        value: state.totalCount,
      },
      {
        key: "pinned",
        label: "Pinned",
        value: pinnedCount,
      },
      {
        key: "bookmarked",
        label: "Bookmarked",
        value: bookmarkedCount,
      },
      {
        key: "compared",
        label: "Compared",
        value: comparedCount,
      },
      {
        key: "high-priority",
        label: "High Priority",
        value: highPriorityCount,
      },
    ],
  };
}