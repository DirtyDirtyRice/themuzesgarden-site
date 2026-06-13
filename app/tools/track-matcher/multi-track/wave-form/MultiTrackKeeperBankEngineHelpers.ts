import type {
  MultiTrackKeeperBankAsset,
  MultiTrackKeeperBankCollection,
  MultiTrackKeeperBankDecision,
  MultiTrackKeeperBankWorkspaceState,
} from "./MultiTrackKeeperBankEngineTypes";

type MultiTrackKeeperBankInlineReadiness =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export function getMultiTrackKeeperBankReadinessLabel(
  readiness: MultiTrackKeeperBankInlineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackKeeperBankDecisionLabel(
  decision: MultiTrackKeeperBankDecision,
): string {
  if (decision === "accept") return "Accept";
  if (decision === "hold") return "Hold";
  if (decision === "review") return "Review";
  if (decision === "reject") return "Reject";
  return "Future";
}

export function clampMultiTrackKeeperBankScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export function calculateMultiTrackKeeperBankEvidenceScore(
  asset: MultiTrackKeeperBankAsset,
): number {
  if (asset.evidence.length === 0) return 0;

  const total = asset.evidence.reduce((sum, evidence) => {
    return sum + evidence.strength * 0.58 + evidence.confidence * 0.42;
  }, 0);

  return clampMultiTrackKeeperBankScore(total / asset.evidence.length);
}

export function calculateMultiTrackKeeperBankAssetScore(
  asset: MultiTrackKeeperBankAsset,
): number {
  const evidenceScore = calculateMultiTrackKeeperBankEvidenceScore(asset);
  const qualityPenalty =
    asset.qualityFlags.filter(
      (flag) =>
        flag === "needs-trim" ||
        flag === "needs-ear-check" ||
        flag === "possible-duplicate" ||
        flag === "future-dsp-check",
    ).length * 5;

  return clampMultiTrackKeeperBankScore(
    asset.emotionalScore * 0.32 +
      asset.reuseScore * 0.22 +
      asset.arrangementScore * 0.2 +
      asset.confidence * 0.16 +
      evidenceScore * 0.1 -
      qualityPenalty,
  );
}

export function getMultiTrackKeeperBankRecommendedDecision(
  asset: MultiTrackKeeperBankAsset,
): MultiTrackKeeperBankDecision {
  const score = calculateMultiTrackKeeperBankAssetScore(asset);
  const needsEarCheck = asset.qualityFlags.includes("needs-ear-check");
  const possibleDuplicate = asset.qualityFlags.includes("possible-duplicate");

  if (asset.readiness === "blocked") return "review";
  if (needsEarCheck || possibleDuplicate) return "review";
  if (score >= 88 && asset.confidence >= 85) return "accept";
  if (score >= 76) return "review";
  if (score >= 62) return "hold";
  return "reject";
}

export function sortMultiTrackKeeperBankAssets(
  assets: MultiTrackKeeperBankAsset[],
): MultiTrackKeeperBankAsset[] {
  return [...assets].sort((first, second) => {
    const firstScore = calculateMultiTrackKeeperBankAssetScore(first);
    const secondScore = calculateMultiTrackKeeperBankAssetScore(second);
    const scoreDelta = secondScore - firstScore;

    if (scoreDelta !== 0) return scoreDelta;

    return first.title.localeCompare(second.title);
  });
}

export function getMultiTrackKeeperBankAcceptedAssets(
  assets: MultiTrackKeeperBankAsset[],
): MultiTrackKeeperBankAsset[] {
  return sortMultiTrackKeeperBankAssets(
    assets.filter((asset) => asset.decision === "accept" && asset.readiness === "ready"),
  );
}

export function getMultiTrackKeeperBankReviewAssets(
  assets: MultiTrackKeeperBankAsset[],
): MultiTrackKeeperBankAsset[] {
  return sortMultiTrackKeeperBankAssets(
    assets.filter(
      (asset) =>
        asset.decision === "review" ||
        asset.readiness === "needs-review" ||
        asset.qualityFlags.includes("needs-ear-check") ||
        asset.qualityFlags.includes("possible-duplicate"),
    ),
  );
}

export function countMultiTrackKeeperBankAcceptedAssets(
  collections: MultiTrackKeeperBankCollection[],
): number {
  return collections.reduce(
    (total, collection) => total + collection.acceptedAssetIds.length,
    0,
  );
}

export function countMultiTrackKeeperBankPendingAssets(
  collections: MultiTrackKeeperBankCollection[],
): number {
  return collections.reduce(
    (total, collection) => total + collection.pendingAssetIds.length,
    0,
  );
}

export function countMultiTrackKeeperBankRejectedAssets(
  collections: MultiTrackKeeperBankCollection[],
): number {
  return collections.reduce(
    (total, collection) => total + collection.rejectedAssetIds.length,
    0,
  );
}

export function getMultiTrackKeeperBankWorkspaceSummary(
  workspace: MultiTrackKeeperBankWorkspaceState,
): string {
  const acceptedCount = getMultiTrackKeeperBankAcceptedAssets(workspace.assets).length;
  const reviewCount = getMultiTrackKeeperBankReviewAssets(workspace.assets).length;
  const collectionAcceptedCount = countMultiTrackKeeperBankAcceptedAssets(workspace.collections);
  const collectionPendingCount = countMultiTrackKeeperBankPendingAssets(workspace.collections);

  return `${acceptedCount} accepted keeper asset${
    acceptedCount === 1 ? "" : "s"
  }, ${reviewCount} needing review, ${collectionAcceptedCount} banked asset${
    collectionAcceptedCount === 1 ? "" : "s"
  }, ${collectionPendingCount} pending bank asset${
    collectionPendingCount === 1 ? "" : "s"
  }.`;
}