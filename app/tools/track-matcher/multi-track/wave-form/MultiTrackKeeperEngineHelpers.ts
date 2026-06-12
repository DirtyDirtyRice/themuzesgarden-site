
import type {
  MultiTrackKeeperCandidate,
  MultiTrackKeeperColor,
  MultiTrackKeeperEngineWorkspaceState,
  MultiTrackKeeperPromotionTarget,
  MultiTrackKeeperReadinessStatus,
  MultiTrackKeeperReasonCode,
  MultiTrackKeeperStrength,
} from "./MultiTrackKeeperEngineTypes";

export function getMultiTrackKeeperReadinessLabel(status: MultiTrackKeeperReadinessStatus): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackKeeperStrengthLabel(strength: MultiTrackKeeperStrength): string {
  if (strength === "keeper") return "Keeper";
  if (strength === "strong") return "Strong";
  if (strength === "maybe") return "Maybe";
  if (strength === "weak") return "Weak";
  return "Reject";
}

export function getMultiTrackKeeperColorLabel(color: MultiTrackKeeperColor): string {
  if (color === "white") return "White";
  if (color === "blue") return "Blue";
  if (color === "green") return "Green";
  if (color === "gold") return "Gold";
  if (color === "purple") return "Purple";
  return "Red";
}

export function getMultiTrackKeeperReasonLabel(reason: MultiTrackKeeperReasonCode): string {
  if (reason === "strong-hook") return "Strong Hook";
  if (reason === "clear-lineage") return "Clear Lineage";
  if (reason === "repeatable-riff") return "Repeatable Riff";
  if (reason === "best-mutation") return "Best Mutation";
  if (reason === "arrangement-ready") return "Arrangement Ready";
  if (reason === "edit-ready") return "Edit Ready";
  if (reason === "render-ready") return "Render Ready";
  if (reason === "needs-human-review") return "Needs Human Review";
  if (reason === "missing-audio") return "Missing Audio";
  if (reason === "missing-metadata") return "Missing Metadata";
  return "Seed Placeholder";
}

export function getMultiTrackKeeperPromotionTargetLabel(target: MultiTrackKeeperPromotionTarget): string {
  if (target === "extract") return "Extract";
  if (target === "duplicate") return "Duplicate";
  if (target === "edit-lane") return "Edit Lane";
  if (target === "arrangement") return "Arrangement";
  if (target === "render-queue") return "Render Queue";
  if (target === "archive") return "Archive";
  return "Review";
}

export function getMultiTrackKeeperCandidateScore(candidate: MultiTrackKeeperCandidate): number {
  const signalTotal = candidate.signals.reduce((total, signal) => {
    if (signal.maxValue <= 0) return total;
    return total + signal.value / signal.maxValue;
  }, 0);

  const signalAverage = candidate.signals.length > 0 ? signalTotal / candidate.signals.length : 0;
  const strengthBoost = getMultiTrackKeeperStrengthBoost(candidate.strength);
  const readinessBoost = getMultiTrackKeeperReadinessBoost(candidate.readinessStatus);
  const rankBoost = Math.max(0, 1 - (candidate.survivorRank - 1) * 0.08);
  const mutationPenalty = Math.min(candidate.mutationCount * 0.01, 0.16);

  return Math.round((signalAverage * 0.52 + strengthBoost * 0.24 + readinessBoost * 0.14 + rankBoost * 0.1 - mutationPenalty) * 100);
}

export function getMultiTrackKeeperBestCandidate(
  candidates: MultiTrackKeeperCandidate[],
): MultiTrackKeeperCandidate | undefined {
  return [...candidates].sort(
    (left, right) => getMultiTrackKeeperCandidateScore(right) - getMultiTrackKeeperCandidateScore(left),
  )[0];
}

export function getMultiTrackKeeperCandidatesByStrength(
  candidates: MultiTrackKeeperCandidate[],
  strength: MultiTrackKeeperStrength,
): MultiTrackKeeperCandidate[] {
  return candidates.filter((candidate) => candidate.strength === strength);
}

export function getMultiTrackKeeperCandidatesByReadiness(
  candidates: MultiTrackKeeperCandidate[],
  readinessStatus: MultiTrackKeeperReadinessStatus,
): MultiTrackKeeperCandidate[] {
  return candidates.filter((candidate) => candidate.readinessStatus === readinessStatus);
}

export function getMultiTrackKeeperCandidatesForPromotionTarget(
  candidates: MultiTrackKeeperCandidate[],
  target: MultiTrackKeeperPromotionTarget,
): MultiTrackKeeperCandidate[] {
  return candidates.filter((candidate) => candidate.promotionTargets.includes(target));
}

export function getMultiTrackKeeperWorkspaceSummary(state: MultiTrackKeeperEngineWorkspaceState): {
  candidateCount: number;
  keeperCount: number;
  readyCount: number;
  reviewCount: number;
  queueCount: number;
  bestCandidateTitle: string;
  bestCandidateScore: number;
} {
  const bestCandidate = getMultiTrackKeeperBestCandidate(state.candidates);

  return {
    candidateCount: state.candidates.length,
    keeperCount: getMultiTrackKeeperCandidatesByStrength(state.candidates, "keeper").length,
    readyCount: getMultiTrackKeeperCandidatesByReadiness(state.candidates, "ready").length,
    reviewCount: getMultiTrackKeeperCandidatesByReadiness(state.candidates, "needs-review").length,
    queueCount: state.promotionQueue.length,
    bestCandidateTitle: bestCandidate?.title ?? "No keeper candidate",
    bestCandidateScore: bestCandidate ? getMultiTrackKeeperCandidateScore(bestCandidate) : 0,
  };
}

export function sortMultiTrackKeeperCandidatesByScore(
  candidates: MultiTrackKeeperCandidate[],
): MultiTrackKeeperCandidate[] {
  return [...candidates].sort(
    (left, right) => getMultiTrackKeeperCandidateScore(right) - getMultiTrackKeeperCandidateScore(left),
  );
}

export function getMultiTrackKeeperPathCandidateTitles(
  state: MultiTrackKeeperEngineWorkspaceState,
  pathId: string,
): string[] {
  const path = state.keeperPaths.find((keeperPath) => keeperPath.id === pathId);
  if (!path) return [];

  return [...path.steps]
    .sort((left, right) => left.order - right.order)
    .map((step) => {
      const candidate = state.candidates.find((item) => item.id === step.candidateId);
      return candidate?.title ?? step.label;
    });
}

function getMultiTrackKeeperStrengthBoost(strength: MultiTrackKeeperStrength): number {
  if (strength === "keeper") return 1;
  if (strength === "strong") return 0.82;
  if (strength === "maybe") return 0.58;
  if (strength === "weak") return 0.28;
  return 0;
}

function getMultiTrackKeeperReadinessBoost(status: MultiTrackKeeperReadinessStatus): number {
  if (status === "ready") return 1;
  if (status === "needs-review") return 0.62;
  if (status === "future") return 0.38;
  return 0;
}