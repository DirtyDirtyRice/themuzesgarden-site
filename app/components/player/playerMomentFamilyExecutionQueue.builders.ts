import type {
  BuildFamilyExecutionQueueParams,
  FamilyExecutionBlockReason,
  FamilyExecutionQueueItem,
  FamilyExecutionQueueResult,
  FamilyExecutionReason,
  FamilyExecutionState,
} from "./playerMomentFamilyExecutionQueue.types";

import {
  average,
  clamp100,
  dedupeReasons,
  normalizeText,
  round1,
  sortExecutionItems,
} from "./playerMomentFamilyExecutionQueue.shared";

function getExecutionReadinessScore(params: {
  readinessScore: number | null;
  executionValueScore: number | null;
  planningAction: string | null;
  planningHorizon: string | null;
}): number {
  let score =
    (params.readinessScore ?? 0) * 0.54 +
    (params.executionValueScore ?? 0) * 0.3;

  if (params.planningAction === "prepare-reuse") score += 8;
  if (params.planningAction === "push-now") score += 10;
  if (params.planningHorizon === "immediate") score += 8;
  if (params.planningHorizon === "hold") score -= 18;

  return round1(clamp100(score));
}

function getExecutionPriorityScore(params: {
  planScore: number | null;
  urgencyScore: number | null;
  protectionNeedScore: number | null;
  planningAction: string | null;
}): number {
  let score =
    (params.planScore ?? 0) * 0.42 +
    (params.urgencyScore ?? 0) * 0.34 +
    (params.protectionNeedScore ?? 0) * 0.16;

  if (params.planningAction === "protect-now") score += 10;
  if (params.planningAction === "push-now") score += 12;

  return round1(clamp100(score));
}

function getProtectionLockScore(params: {
  protectionNeedScore: number | null;
  planScore: number | null;
  planningAction: string | null;
  strongestReason: string | null;
}): number {
  let score =
    (params.protectionNeedScore ?? 0) * 0.62 +
    (params.planScore ?? 0) * 0.18;

  if (params.planningAction === "protect-now") score += 14;
  if (params.strongestReason === "signature-needs-protection") score += 10;

  return round1(clamp100(score));
}

function getBlockageScore(params: {
  readinessScore: number | null;
  planScore: number | null;
  planningHorizon: string | null;
  strongestReason: string | null;
}): number {
  let score =
    Math.max(0, 100 - (params.readinessScore ?? 0)) * 0.52 +
    Math.max(0, 100 - (params.planScore ?? 0)) * 0.24;

  if (params.planningHorizon === "hold") score += 18;
  if (params.planningHorizon === "backlog") score += 8;
  if (params.strongestReason === "proof-still-thin") score += 10;
  if (params.strongestReason === "archive-load-confirmed") score += 16;

  return round1(clamp100(score));
}

function getQueueScore(params: {
  executionReadinessScore: number;
  executionPriorityScore: number;
  protectionLockScore: number;
  blockageScore: number;
}): number {
  return round1(
    clamp100(
      params.executionReadinessScore * 0.34 +
        params.executionPriorityScore * 0.34 +
        params.protectionLockScore * 0.12 +
        Math.max(0, 100 - params.blockageScore) * 0.2
    )
  );
}

function getExecutionState(params: {
  queueScore: number;
  executionReadinessScore: number;
  protectionLockScore: number;
  blockageScore: number;
  planningAction: string | null;
  planningHorizon: string | null;
}): FamilyExecutionState {
  if (
    params.protectionLockScore >= 82 &&
    params.planningAction === "protect-now"
  ) {
    return "protected";
  }

  if (
    params.queueScore >= 78 &&
    params.executionReadinessScore >= 72 &&
    params.blockageScore < 35 &&
    (params.planningAction === "push-now" ||
      params.planningAction === "prepare-reuse" ||
      params.planningHorizon === "immediate")
  ) {
    return "execute-now";
  }

  if (params.blockageScore >= 60) {
    return "blocked";
  }

  if (
    params.queueScore >= 48 &&
    (params.planningHorizon === "next-up" ||
      params.planningHorizon === "queued" ||
      params.planningAction === "develop-next")
  ) {
    return "queued";
  }

  return "deferred";
}

function getBlockReason(params: {
  executionState: FamilyExecutionState;
  readinessScore: number | null;
  planningAction: string | null;
  strongestReason: string | null;
  planningHorizon: string | null;
}): FamilyExecutionBlockReason | null {
  if (params.executionState !== "blocked" && params.executionState !== "deferred") {
    return params.executionState === "protected" ? "protected-signature" : null;
  }

  if (params.planningAction === "archive-intentionally") {
    return "archive-lane";
  }

  if (params.strongestReason === "proof-still-thin" || (params.readinessScore ?? 0) < 48) {
    return "insufficient-readiness";
  }

  if (params.strongestReason === "signature-needs-protection") {
    return "protected-signature";
  }

  if (params.planningHorizon === "hold") {
    return "deferred-by-plan";
  }

  if (params.planningHorizon === "backlog") {
    return "waiting-turn";
  }

  return "proof-too-thin";
}

function buildItemReasons(params: {
  itemRank: number;
  queueScore: number;
  executionReadinessScore: number;
  executionPriorityScore: number;
  protectionLockScore: number;
  blockageScore: number;
  executionState: FamilyExecutionState;
  planningAction: string | null;
  strongestPlanningReason: string | null;
}): FamilyExecutionReason[] {
  const reasons: FamilyExecutionReason[] = [];

  if (params.itemRank <= 3) {
    reasons.push("top-execution-candidate");
  }

  if (params.queueScore >= 78 || params.executionState === "execute-now") {
    reasons.push("highest-plan-priority");
  }

  if (params.executionReadinessScore >= 72) {
    reasons.push("ready-for-execution");
  }

  if (
    params.executionState === "protected" ||
    params.protectionLockScore >= 82 ||
    params.strongestPlanningReason === "signature-needs-protection"
  ) {
    reasons.push("signature-protected");
  }

  if (params.executionState === "queued" || params.executionPriorityScore >= 62) {
    reasons.push("queue-position-earned");
  }

  if (params.executionState === "blocked" || params.blockageScore >= 60) {
    reasons.push("blocked-by-readiness");
  }

  if (params.executionState === "deferred") {
    reasons.push("deferred-intentionally");
  }

  if (params.planningAction === "archive-intentionally") {
    reasons.push("archive-lane-confirmed");
  }

  if (params.strongestPlanningReason === "timing-window-open") {
    reasons.push("timing-window-open");
  }

  if (params.planningAction === "prepare-reuse") {
    reasons.push("reuse-prep-approved");
  }

  return dedupeReasons(reasons);
}

function getItemStrongestReason(params: {
  reasons: FamilyExecutionReason[];
  itemRank: number;
  executionState: FamilyExecutionState;
  blockageScore: number;
  protectionLockScore: number;
  executionReadinessScore: number;
}): FamilyExecutionReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (params.itemRank <= 3 && reasons.includes("top-execution-candidate")) {
    return "top-execution-candidate";
  }

  if (
    params.executionState === "protected" &&
    reasons.includes("signature-protected")
  ) {
    return "signature-protected";
  }

  if (
    params.executionState === "blocked" &&
    reasons.includes("blocked-by-readiness")
  ) {
    return "blocked-by-readiness";
  }

  if (
    params.executionState === "execute-now" &&
    params.executionReadinessScore >= 72 &&
    reasons.includes("ready-for-execution")
  ) {
    return "ready-for-execution";
  }

  if (
    params.protectionLockScore >= 82 &&
    reasons.includes("signature-protected")
  ) {
    return "signature-protected";
  }

  return reasons[0] ?? null;
}

function buildExecutionItem(params: {
  itemRank: number;
  planningItem: FamilyExecutionQueueResult["planningResult"] extends infer _ ? any : never;
}): FamilyExecutionQueueItem {
  const planningItem = params.planningItem;

  const executionReadinessScore = getExecutionReadinessScore({
    readinessScore: planningItem?.readinessScore ?? null,
    executionValueScore: planningItem?.executionValueScore ?? null,
    planningAction: planningItem?.planningAction ?? null,
    planningHorizon: planningItem?.planningHorizon ?? null,
  });

  const executionPriorityScore = getExecutionPriorityScore({
    planScore: planningItem?.planScore ?? null,
    urgencyScore: planningItem?.urgencyScore ?? null,
    protectionNeedScore: planningItem?.protectionNeedScore ?? null,
    planningAction: planningItem?.planningAction ?? null,
  });

  const protectionLockScore = getProtectionLockScore({
    protectionNeedScore: planningItem?.protectionNeedScore ?? null,
    planScore: planningItem?.planScore ?? null,
    planningAction: planningItem?.planningAction ?? null,
    strongestReason: planningItem?.strongestReason ?? null,
  });

  const blockageScore = getBlockageScore({
    readinessScore: planningItem?.readinessScore ?? null,
    planScore: planningItem?.planScore ?? null,
    planningHorizon: planningItem?.planningHorizon ?? null,
    strongestReason: planningItem?.strongestReason ?? null,
  });

  const queueScore = getQueueScore({
    executionReadinessScore,
    executionPriorityScore,
    protectionLockScore,
    blockageScore,
  });

  const executionState = getExecutionState({
    queueScore,
    executionReadinessScore,
    protectionLockScore,
    blockageScore,
    planningAction: planningItem?.planningAction ?? null,
    planningHorizon: planningItem?.planningHorizon ?? null,
  });

  const blockReason = getBlockReason({
    executionState,
    readinessScore: planningItem?.readinessScore ?? null,
    planningAction: planningItem?.planningAction ?? null,
    strongestReason: planningItem?.strongestReason ?? null,
    planningHorizon: planningItem?.planningHorizon ?? null,
  });

  const reasons = buildItemReasons({
    itemRank: params.itemRank,
    queueScore,
    executionReadinessScore,
    executionPriorityScore,
    protectionLockScore,
    blockageScore,
    executionState,
    planningAction: planningItem?.planningAction ?? null,
    strongestPlanningReason: planningItem?.strongestReason ?? null,
  });

  const strongestReason = getItemStrongestReason({
    reasons,
    itemRank: params.itemRank,
    executionState,
    blockageScore,
    protectionLockScore,
    executionReadinessScore,
  });

  return {
    familyId: normalizeText(planningItem?.familyId),
    queueScore,
    executionReadinessScore,
    executionPriorityScore,
    protectionLockScore,
    blockageScore,
    executionState,
    blockReason,
    queuePosition: null,
    strongestReason,
    reasons,
  };
}

function buildReasons(params: {
  queueScore: number;
  executionReadinessScore: number;
  executionPriorityScore: number;
  protectionLockScore: number;
  blockageScore: number;
  executeNowCount: number;
  protectedCount: number;
  queuedCount: number;
  blockedCount: number;
  deferredCount: number;
}): FamilyExecutionReason[] {
  const reasons: FamilyExecutionReason[] = [];

  if (params.executeNowCount >= 1) {
    reasons.push("highest-plan-priority");
  }

  if (params.executionReadinessScore >= 68) {
    reasons.push("ready-for-execution");
  }

  if (params.protectedCount >= 1 || params.protectionLockScore >= 74) {
    reasons.push("signature-protected");
  }

  if (params.queuedCount >= 1 || params.executionPriorityScore >= 62) {
    reasons.push("queue-position-earned");
  }

  if (params.blockedCount >= 1 || params.blockageScore >= 58) {
    reasons.push("blocked-by-readiness");
  }

  if (params.deferredCount >= 1) {
    reasons.push("deferred-intentionally");
  }

  if (params.deferredCount >= 1 && params.queueScore < 40) {
    reasons.push("archive-lane-confirmed");
  }

  if (params.executionPriorityScore >= 68) {
    reasons.push("timing-window-open");
  }

  if (params.executionReadinessScore >= 70 && params.queuedCount >= 1) {
    reasons.push("reuse-prep-approved");
  }

  if (params.executeNowCount >= 1) {
    reasons.push("top-execution-candidate");
  }

  return dedupeReasons(reasons);
}

function getStrongestReason(params: {
  reasons: FamilyExecutionReason[];
  executeNowCount: number;
  protectedCount: number;
  blockedCount: number;
  executionReadinessScore: number;
  protectionLockScore: number;
}): FamilyExecutionReason | null {
  const { reasons } = params;
  if (!reasons.length) return null;

  if (params.executeNowCount >= 1 && reasons.includes("top-execution-candidate")) {
    return "top-execution-candidate";
  }

  if (params.protectedCount >= 1 && reasons.includes("signature-protected")) {
    return "signature-protected";
  }

  if (params.blockedCount >= 1 && reasons.includes("blocked-by-readiness")) {
    return "blocked-by-readiness";
  }

  if (
    params.executionReadinessScore >= 68 &&
    reasons.includes("ready-for-execution")
  ) {
    return "ready-for-execution";
  }

  if (
    params.protectionLockScore >= 74 &&
    reasons.includes("signature-protected")
  ) {
    return "signature-protected";
  }

  return reasons[0] ?? null;
}

export function buildFamilyExecutionQueue(
  params: BuildFamilyExecutionQueueParams
): FamilyExecutionQueueResult {
  const planningResult = params.planningResult ?? null;
  const planningItems = planningResult?.items ?? [];

  const unsortedItems = planningItems.map((planningItem, index) =>
    buildExecutionItem({
      itemRank: index + 1,
      planningItem,
    })
  );

  const sortedItems = sortExecutionItems(unsortedItems);

  const items = sortedItems.map((item, index) => ({
    ...item,
    queuePosition:
      item.executionState === "queued" || item.executionState === "execute-now"
        ? index + 1
        : null,
  }));

  const executeNowFamilyIds = items
    .filter((item) => item.executionState === "execute-now")
    .map((item) => item.familyId);

  const protectedFamilyIds = items
    .filter((item) => item.executionState === "protected")
    .map((item) => item.familyId);

  const queuedFamilyIds = items
    .filter((item) => item.executionState === "queued")
    .map((item) => item.familyId);

  const blockedFamilyIds = items
    .filter((item) => item.executionState === "blocked")
    .map((item) => item.familyId);

  const deferredFamilyIds = items
    .filter((item) => item.executionState === "deferred")
    .map((item) => item.familyId);

  const queueScore = round1(average(items.map((item) => item.queueScore)));
  const executionReadinessScore = round1(
    average(items.map((item) => item.executionReadinessScore))
  );
  const executionPriorityScore = round1(
    average(items.map((item) => item.executionPriorityScore))
  );
  const protectionLockScore = round1(
    average(items.map((item) => item.protectionLockScore))
  );
  const blockageScore = round1(average(items.map((item) => item.blockageScore)));

  const reasons = buildReasons({
    queueScore,
    executionReadinessScore,
    executionPriorityScore,
    protectionLockScore,
    blockageScore,
    executeNowCount: executeNowFamilyIds.length,
    protectedCount: protectedFamilyIds.length,
    queuedCount: queuedFamilyIds.length,
    blockedCount: blockedFamilyIds.length,
    deferredCount: deferredFamilyIds.length,
  });

  const strongestReason = getStrongestReason({
    reasons,
    executeNowCount: executeNowFamilyIds.length,
    protectedCount: protectedFamilyIds.length,
    blockedCount: blockedFamilyIds.length,
    executionReadinessScore,
    protectionLockScore,
  });

  return {
    familyCount: items.length,
    queueScore,
    executionReadinessScore,
    executionPriorityScore,
    protectionLockScore,
    blockageScore,
    strongestReason,
    reasons,
    planningResult,
    executeNowFamilyIds,
    protectedFamilyIds,
    queuedFamilyIds,
    blockedFamilyIds,
    deferredFamilyIds,
    items,
  };
}