import type {
  MultiTrackHybridAssetCandidate,
  MultiTrackHybridBuilderOwnershipItem,
  MultiTrackHybridCompatibilitySignal,
  MultiTrackHybridConfidenceLevel,
  MultiTrackHybridMergePlan,
  MultiTrackHybridReadinessStatus,
  MultiTrackHybridWorkspaceState,
} from "./MultiTrackHybridIntelligenceTypes";

export function getMultiTrackHybridStatusLabel(status: MultiTrackHybridReadinessStatus): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackHybridConfidenceLabel(confidence: MultiTrackHybridConfidenceLevel): string {
  if (confidence === "high") return "High Confidence";
  if (confidence === "medium") return "Medium Confidence";
  if (confidence === "low") return "Low Confidence";
  return "Manual Required";
}

export function getMultiTrackHybridStatusClass(status: MultiTrackHybridReadinessStatus): string {
  if (status === "ready") return "border-white/30 text-white";
  if (status === "needs-review") return "border-white/20 text-white/80";
  if (status === "blocked") return "border-white/15 text-white/60";
  return "border-white/10 text-white/50";
}

export function getMultiTrackHybridConfidenceClass(confidence: MultiTrackHybridConfidenceLevel): string {
  if (confidence === "high") return "border-white/30 text-white";
  if (confidence === "medium") return "border-white/20 text-white/80";
  if (confidence === "low") return "border-white/15 text-white/60";
  return "border-white/25 text-white";
}

export function countMultiTrackHybridItemsByStatus(
  items: { status: MultiTrackHybridReadinessStatus }[],
  status: MultiTrackHybridReadinessStatus,
): number {
  return items.filter((item) => item.status === status).length;
}

export function getMultiTrackHybridReadinessSummary(state: MultiTrackHybridWorkspaceState): {
  ready: number;
  needsReview: number;
  blocked: number;
  future: number;
  total: number;
} {
  const allStatusItems = [
    ...state.compatibilitySignals,
    ...state.assetCandidates,
    ...state.mergePlans,
    ...state.builderOwnership,
  ];

  return {
    ready: countMultiTrackHybridItemsByStatus(allStatusItems, "ready"),
    needsReview: countMultiTrackHybridItemsByStatus(allStatusItems, "needs-review"),
    blocked: countMultiTrackHybridItemsByStatus(allStatusItems, "blocked"),
    future: countMultiTrackHybridItemsByStatus(allStatusItems, "future"),
    total: allStatusItems.length,
  };
}

export function getMultiTrackHybridManualConfirmationCount(state: MultiTrackHybridWorkspaceState): number {
  return [
    ...state.compatibilitySignals.map((item) => item.confidence),
    ...state.assetCandidates.map((item) => item.confidence),
    ...state.mergePlans.map((item) => item.confidence),
  ].filter((confidence) => confidence === "manual-required").length;
}

export function getMultiTrackHybridTrackAAssets(
  assets: MultiTrackHybridAssetCandidate[],
): MultiTrackHybridAssetCandidate[] {
  return assets.filter((asset) => asset.sourceId === "track-a");
}

export function getMultiTrackHybridTrackBAssets(
  assets: MultiTrackHybridAssetCandidate[],
): MultiTrackHybridAssetCandidate[] {
  return assets.filter((asset) => asset.sourceId === "track-b");
}

export function getMultiTrackHybridFuturePlans(
  plans: MultiTrackHybridMergePlan[],
): MultiTrackHybridMergePlan[] {
  return plans.filter((plan) => plan.status === "future");
}

export function getMultiTrackHybridReviewSignals(
  signals: MultiTrackHybridCompatibilitySignal[],
): MultiTrackHybridCompatibilitySignal[] {
  return signals.filter((signal) => signal.status === "needs-review");
}

export function getMultiTrackHybridReadyOwnership(
  ownership: MultiTrackHybridBuilderOwnershipItem[],
): MultiTrackHybridBuilderOwnershipItem[] {
  return ownership.filter((item) => item.status === "ready");
}

export function buildMultiTrackHybridPlanningSentence(state: MultiTrackHybridWorkspaceState): string {
  const summary = getMultiTrackHybridReadinessSummary(state);
  const manualCount = getMultiTrackHybridManualConfirmationCount(state);

  return `${summary.ready} ready item(s), ${summary.needsReview} review item(s), ${summary.future} future item(s), and ${manualCount} manual confirmation gate(s).`;
}

export function buildMultiTrackHybridSourceSummary(assets: MultiTrackHybridAssetCandidate[]): {
  trackA: number;
  trackB: number;
} {
  return {
    trackA: getMultiTrackHybridTrackAAssets(assets).length,
    trackB: getMultiTrackHybridTrackBAssets(assets).length,
  };
}

export function buildMultiTrackHybridSafetySummary(): string[] {
  return [
    "Read-only planning only.",
    "No engine state.",
    "No DSP processing.",
    "No audio rendering.",
    "No save or Supabase writes.",
    "No duplicate track state.",
    "User confirmation required before future builder action.",
  ];
}