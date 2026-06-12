import type {
  MultiTrackDuplicationAction,
  MultiTrackDuplicationClone,
  MultiTrackDuplicationCloneStatus,
  MultiTrackDuplicationPriority,
  MultiTrackDuplicationReadinessStatus,
  MultiTrackDuplicationRisk,
  MultiTrackDuplicationTargetKind,
  MultiTrackDuplicationWorkspaceState,
} from "./MultiTrackDuplicationEngineTypes";

export function getMultiTrackDuplicationReadinessLabel(
  status: MultiTrackDuplicationReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackDuplicationCloneStatusLabel(
  status: MultiTrackDuplicationCloneStatus,
): string {
  if (status === "draft") return "Draft";
  if (status === "prepared") return "Prepared";
  if (status === "approved") return "Approved";
  if (status === "duplicated") return "Duplicated";
  if (status === "placed") return "Placed";
  return "Archived";
}

export function getMultiTrackDuplicationTargetKindLabel(
  targetKind: MultiTrackDuplicationTargetKind,
): string {
  if (targetKind === "intro-copy") return "Intro Copy";
  if (targetKind === "verse-copy") return "Verse Copy";
  if (targetKind === "chorus-copy") return "Chorus Copy";
  if (targetKind === "hook-repeat") return "Hook Repeat";
  if (targetKind === "bridge-copy") return "Bridge Copy";
  if (targetKind === "outro-copy") return "Outro Copy";
  if (targetKind === "edit-lane-copy") return "Edit Lane Copy";
  return "Render Copy";
}

export function getMultiTrackDuplicationActionLabel(action: MultiTrackDuplicationAction): string {
  if (action === "copy") return "Copy";
  if (action === "repeat") return "Repeat";
  if (action === "offset") return "Offset";
  if (action === "trim") return "Trim";
  if (action === "loop") return "Loop";
  if (action === "place") return "Place";
  if (action === "review") return "Review";
  return "Prepare Render";
}

export function getMultiTrackDuplicationPriorityLabel(priority: MultiTrackDuplicationPriority): string {
  if (priority === "critical") return "Critical";
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  if (priority === "low") return "Low";
  return "Parking Lot";
}

export function getMultiTrackDuplicationRiskLabel(risk: MultiTrackDuplicationRisk): string {
  if (risk === "timing-drift") return "Timing Drift";
  if (risk === "weak-transition") return "Weak Transition";
  if (risk === "overcrowded-arrangement") return "Overcrowded Arrangement";
  if (risk === "missing-source-audio") return "Missing Source Audio";
  if (risk === "unreviewed-clone") return "Unreviewed Clone";
  if (risk === "render-risk") return "Render Risk";
  return "Seed Placeholder";
}

export function getMultiTrackDuplicationSourceBarLength(clone: MultiTrackDuplicationClone): number {
  return Math.max(0, clone.sourceEndBar - clone.sourceStartBar + 1);
}

export function getMultiTrackDuplicationTargetBarLength(clone: MultiTrackDuplicationClone): number {
  return Math.max(0, clone.targetEndBar - clone.targetStartBar + 1);
}

export function getMultiTrackDuplicationPassedCheckCount(clone: MultiTrackDuplicationClone): number {
  return clone.checks.filter((check) => check.passed).length;
}

export function getMultiTrackDuplicationComputedScore(clone: MultiTrackDuplicationClone): number {
  const checkAverage =
    clone.checks.length > 0
      ? clone.checks.reduce((total, check) => {
          if (check.maxScore <= 0) return total;
          return total + check.score / check.maxScore;
        }, 0) / clone.checks.length
      : 0;

  const passedRatio =
    clone.checks.length > 0
      ? clone.checks.filter((check) => check.passed).length / clone.checks.length
      : 0;

  const priorityBoost = getMultiTrackDuplicationPriorityBoost(clone.priority);
  const statusBoost = getMultiTrackDuplicationStatusBoost(clone.cloneStatus);
  const readinessBoost = getMultiTrackDuplicationReadinessBoost(clone.readinessStatus);
  const repeatBoost = Math.min(clone.repeatCount * 3, 12);
  const offsetPenalty = Math.min(Math.abs(clone.offsetBeats) * 3, 12);
  const riskPenalty = Math.min(clone.risks.length * 5, 22);

  return Math.round(
    clone.cloneScore * 0.24 +
      clone.timingScore * 0.2 +
      clone.transitionScore * 0.18 +
      clone.renderScore * 0.14 +
      checkAverage * 100 * 0.08 +
      passedRatio * 100 * 0.04 +
      priorityBoost * 100 * 0.04 +
      statusBoost * 100 * 0.03 +
      readinessBoost * 100 * 0.03 +
      repeatBoost -
      offsetPenalty -
      riskPenalty,
  );
}

export function sortMultiTrackDuplicationClonesByScore(
  clones: MultiTrackDuplicationClone[],
): MultiTrackDuplicationClone[] {
  return [...clones].sort(
    (left, right) =>
      getMultiTrackDuplicationComputedScore(right) -
      getMultiTrackDuplicationComputedScore(left),
  );
}

export function sortMultiTrackDuplicationClonesByTargetBar(
  clones: MultiTrackDuplicationClone[],
): MultiTrackDuplicationClone[] {
  return [...clones].sort((left, right) => left.targetStartBar - right.targetStartBar);
}

export function getMultiTrackDuplicationBestClone(
  clones: MultiTrackDuplicationClone[],
): MultiTrackDuplicationClone | undefined {
  return sortMultiTrackDuplicationClonesByScore(clones)[0];
}

export function getMultiTrackDuplicationClonesByReadiness(
  clones: MultiTrackDuplicationClone[],
  readinessStatus: MultiTrackDuplicationReadinessStatus,
): MultiTrackDuplicationClone[] {
  return clones.filter((clone) => clone.readinessStatus === readinessStatus);
}

export function getMultiTrackDuplicationClonesByStatus(
  clones: MultiTrackDuplicationClone[],
  cloneStatus: MultiTrackDuplicationCloneStatus,
): MultiTrackDuplicationClone[] {
  return clones.filter((clone) => clone.cloneStatus === cloneStatus);
}

export function getMultiTrackDuplicationClonesByTargetKind(
  clones: MultiTrackDuplicationClone[],
  targetKind: MultiTrackDuplicationTargetKind,
): MultiTrackDuplicationClone[] {
  return clones.filter((clone) => clone.targetKind === targetKind);
}

export function getMultiTrackDuplicationClonesForAction(
  clones: MultiTrackDuplicationClone[],
  action: MultiTrackDuplicationAction,
): MultiTrackDuplicationClone[] {
  return clones.filter((clone) => clone.actions.includes(action));
}

export function getMultiTrackDuplicationLaneClones(
  state: MultiTrackDuplicationWorkspaceState,
  laneId: string,
): MultiTrackDuplicationClone[] {
  const lane = state.lanes.find((item) => item.id === laneId);
  if (!lane) return [];

  return lane.cloneIds
    .map((cloneId) => state.clones.find((clone) => clone.id === cloneId))
    .filter((clone): clone is MultiTrackDuplicationClone => Boolean(clone));
}

export function getMultiTrackDuplicationCloneTitle(
  state: MultiTrackDuplicationWorkspaceState,
  cloneId: string,
): string {
  return state.clones.find((clone) => clone.id === cloneId)?.title ?? "Unknown duplicate clone";
}

export function getMultiTrackDuplicationWorkspaceSummary(
  state: MultiTrackDuplicationWorkspaceState,
): {
  cloneCount: number;
  readyCount: number;
  reviewCount: number;
  approvedCount: number;
  preparedCount: number;
  hookRepeatCount: number;
  renderCopyCount: number;
  bestCloneTitle: string;
  bestCloneScore: number;
} {
  const bestClone = getMultiTrackDuplicationBestClone(state.clones);

  return {
    cloneCount: state.clones.length,
    readyCount: getMultiTrackDuplicationClonesByReadiness(state.clones, "ready").length,
    reviewCount: getMultiTrackDuplicationClonesByReadiness(state.clones, "needs-review").length,
    approvedCount: getMultiTrackDuplicationClonesByStatus(state.clones, "approved").length,
    preparedCount: getMultiTrackDuplicationClonesByStatus(state.clones, "prepared").length,
    hookRepeatCount: getMultiTrackDuplicationClonesByTargetKind(state.clones, "hook-repeat").length,
    renderCopyCount: getMultiTrackDuplicationClonesByTargetKind(state.clones, "render-copy").length,
    bestCloneTitle: bestClone?.title ?? "No duplicate clone",
    bestCloneScore: bestClone ? getMultiTrackDuplicationComputedScore(bestClone) : 0,
  };
}

function getMultiTrackDuplicationPriorityBoost(priority: MultiTrackDuplicationPriority): number {
  if (priority === "critical") return 1;
  if (priority === "high") return 0.82;
  if (priority === "medium") return 0.62;
  if (priority === "low") return 0.34;
  return 0.18;
}

function getMultiTrackDuplicationStatusBoost(status: MultiTrackDuplicationCloneStatus): number {
  if (status === "placed") return 1;
  if (status === "duplicated") return 0.9;
  if (status === "approved") return 0.82;
  if (status === "prepared") return 0.68;
  if (status === "draft") return 0.42;
  return 0.2;
}

function getMultiTrackDuplicationReadinessBoost(status: MultiTrackDuplicationReadinessStatus): number {
  if (status === "ready") return 1;
  if (status === "needs-review") return 0.58;
  if (status === "future") return 0.32;
  return 0;
}