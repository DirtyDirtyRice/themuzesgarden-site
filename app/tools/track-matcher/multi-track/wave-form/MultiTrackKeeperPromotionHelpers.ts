import type {
  MultiTrackKeeperPromotionDecision,
  MultiTrackKeeperPromotionItem,
  MultiTrackKeeperPromotionPriority,
  MultiTrackKeeperPromotionReadinessStatus,
  MultiTrackKeeperPromotionReason,
  MultiTrackKeeperPromotionStage,
  MultiTrackKeeperPromotionTarget,
  MultiTrackKeeperPromotionWorkspaceState,
} from "./MultiTrackKeeperPromotionTypes";

export function getMultiTrackKeeperPromotionReadinessLabel(
  status: MultiTrackKeeperPromotionReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackKeeperPromotionStageLabel(stage: MultiTrackKeeperPromotionStage): string {
  if (stage === "candidate") return "Candidate";
  if (stage === "approved") return "Approved";
  if (stage === "prepared") return "Prepared";
  if (stage === "queued") return "Queued";
  if (stage === "promoted") return "Promoted";
  return "Archived";
}

export function getMultiTrackKeeperPromotionTargetLabel(target: MultiTrackKeeperPromotionTarget): string {
  if (target === "keeper-bank") return "Keeper Bank";
  if (target === "extract-lane") return "Extract Lane";
  if (target === "edit-lane") return "Edit Lane";
  if (target === "duplicate-lane") return "Duplicate Lane";
  if (target === "arrangement-lane") return "Arrangement Lane";
  if (target === "render-queue") return "Render Queue";
  return "Archive Bin";
}

export function getMultiTrackKeeperPromotionPriorityLabel(
  priority: MultiTrackKeeperPromotionPriority,
): string {
  if (priority === "critical") return "Critical";
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  if (priority === "low") return "Low";
  return "Parking Lot";
}

export function getMultiTrackKeeperPromotionReasonLabel(reason: MultiTrackKeeperPromotionReason): string {
  if (reason === "best-survivor") return "Best Survivor";
  if (reason === "strong-hook") return "Strong Hook";
  if (reason === "closest-original") return "Closest Original";
  if (reason === "useful-mutation") return "Useful Mutation";
  if (reason === "arrangement-ready") return "Arrangement Ready";
  if (reason === "extraction-ready") return "Extraction Ready";
  if (reason === "render-ready") return "Render Ready";
  if (reason === "manual-keeper") return "Manual Keeper";
  if (reason === "archive-drift") return "Archive Drift";
  return "Seed Placeholder";
}

export function getMultiTrackKeeperPromotionComputedScore(item: MultiTrackKeeperPromotionItem): number {
  const checkAverage =
    item.checks.length > 0
      ? item.checks.reduce((total, check) => {
          if (check.maxScore <= 0) return total;
          return total + check.score / check.maxScore;
        }, 0) / item.checks.length
      : 0;

  const passedRatio =
    item.checks.length > 0
      ? item.checks.filter((check) => check.passed).length / item.checks.length
      : 0;

  const priorityBoost = getMultiTrackKeeperPromotionPriorityBoost(item.priority);
  const stageBoost = getMultiTrackKeeperPromotionStageBoost(item.stage);
  const readinessBoost = getMultiTrackKeeperPromotionReadinessBoost(item.readinessStatus);

  return Math.round(
    item.promotionScore * 0.42 +
      checkAverage * 100 * 0.26 +
      passedRatio * 100 * 0.14 +
      priorityBoost * 100 * 0.1 +
      stageBoost * 100 * 0.05 +
      readinessBoost * 100 * 0.03,
  );
}

export function sortMultiTrackKeeperPromotionItemsByScore(
  items: MultiTrackKeeperPromotionItem[],
): MultiTrackKeeperPromotionItem[] {
  return [...items].sort(
    (left, right) =>
      getMultiTrackKeeperPromotionComputedScore(right) -
      getMultiTrackKeeperPromotionComputedScore(left),
  );
}

export function getMultiTrackKeeperPromotionBestItem(
  items: MultiTrackKeeperPromotionItem[],
): MultiTrackKeeperPromotionItem | undefined {
  return sortMultiTrackKeeperPromotionItemsByScore(items)[0];
}

export function getMultiTrackKeeperPromotionItemsByTarget(
  items: MultiTrackKeeperPromotionItem[],
  target: MultiTrackKeeperPromotionTarget,
): MultiTrackKeeperPromotionItem[] {
  return items.filter((item) => item.target === target);
}

export function getMultiTrackKeeperPromotionItemsByStage(
  items: MultiTrackKeeperPromotionItem[],
  stage: MultiTrackKeeperPromotionStage,
): MultiTrackKeeperPromotionItem[] {
  return items.filter((item) => item.stage === stage);
}

export function getMultiTrackKeeperPromotionItemsByReadiness(
  items: MultiTrackKeeperPromotionItem[],
  readinessStatus: MultiTrackKeeperPromotionReadinessStatus,
): MultiTrackKeeperPromotionItem[] {
  return items.filter((item) => item.readinessStatus === readinessStatus);
}

export function getMultiTrackKeeperPromotionDecisionForItem(
  decisions: MultiTrackKeeperPromotionDecision[],
  itemId: string,
): MultiTrackKeeperPromotionDecision | undefined {
  return decisions.find((decision) => decision.itemId === itemId);
}

export function getMultiTrackKeeperPromotionItemTitle(
  state: MultiTrackKeeperPromotionWorkspaceState,
  itemId: string,
): string {
  return state.items.find((item) => item.id === itemId)?.title ?? "Unknown promotion item";
}

export function getMultiTrackKeeperPromotionLaneItems(
  state: MultiTrackKeeperPromotionWorkspaceState,
  laneId: string,
): MultiTrackKeeperPromotionItem[] {
  const lane = state.lanes.find((item) => item.id === laneId);
  if (!lane) return [];

  return lane.itemIds
    .map((itemId) => state.items.find((item) => item.id === itemId))
    .filter((item): item is MultiTrackKeeperPromotionItem => Boolean(item));
}

export function getMultiTrackKeeperPromotionWorkspaceSummary(
  state: MultiTrackKeeperPromotionWorkspaceState,
): {
  itemCount: number;
  readyCount: number;
  reviewCount: number;
  approvedCount: number;
  preparedCount: number;
  archivedCount: number;
  bestItemTitle: string;
  bestItemScore: number;
} {
  const bestItem = getMultiTrackKeeperPromotionBestItem(state.items);

  return {
    itemCount: state.items.length,
    readyCount: getMultiTrackKeeperPromotionItemsByReadiness(state.items, "ready").length,
    reviewCount: getMultiTrackKeeperPromotionItemsByReadiness(state.items, "needs-review").length,
    approvedCount: getMultiTrackKeeperPromotionItemsByStage(state.items, "approved").length,
    preparedCount: getMultiTrackKeeperPromotionItemsByStage(state.items, "prepared").length,
    archivedCount: getMultiTrackKeeperPromotionItemsByStage(state.items, "archived").length,
    bestItemTitle: bestItem?.title ?? "No promotion item",
    bestItemScore: bestItem ? getMultiTrackKeeperPromotionComputedScore(bestItem) : 0,
  };
}

export function getMultiTrackKeeperPromotionPassedCheckCount(item: MultiTrackKeeperPromotionItem): number {
  return item.checks.filter((check) => check.passed).length;
}

function getMultiTrackKeeperPromotionPriorityBoost(priority: MultiTrackKeeperPromotionPriority): number {
  if (priority === "critical") return 1;
  if (priority === "high") return 0.84;
  if (priority === "medium") return 0.62;
  if (priority === "low") return 0.38;
  return 0.18;
}

function getMultiTrackKeeperPromotionStageBoost(stage: MultiTrackKeeperPromotionStage): number {
  if (stage === "promoted") return 1;
  if (stage === "approved") return 0.88;
  if (stage === "prepared") return 0.78;
  if (stage === "queued") return 0.62;
  if (stage === "candidate") return 0.44;
  return 0.22;
}

function getMultiTrackKeeperPromotionReadinessBoost(
  readinessStatus: MultiTrackKeeperPromotionReadinessStatus,
): number {
  if (readinessStatus === "ready") return 1;
  if (readinessStatus === "needs-review") return 0.58;
  if (readinessStatus === "future") return 0.36;
  return 0;
}