export type MomentInspectorWorkspaceVisibleStats = {
  visibleWatchCount: number;
  visibleRepairCount: number;
  visibleTotalCount: number;
};

function countItems(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export function buildMomentInspectorWorkspaceVisibleStats(
  derivedView: any
): MomentInspectorWorkspaceVisibleStats {
  const visibleWatchCount =
    countItems(derivedView?.watchItems) ||
    countItems(derivedView?.lanes?.find?.((lane: any) => lane?.lane === "watch")?.items);

  const visibleRepairCount =
    countItems(derivedView?.repairItems) ||
    countItems(derivedView?.lanes?.find?.((lane: any) => lane?.lane === "repair")?.items);

  return {
    visibleWatchCount,
    visibleRepairCount,
    visibleTotalCount: visibleWatchCount + visibleRepairCount,
  };
}