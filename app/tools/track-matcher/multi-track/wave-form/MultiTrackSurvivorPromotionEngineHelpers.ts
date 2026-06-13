import type {
  MultiTrackSurvivorPromotionCandidate,
  MultiTrackSurvivorPromotionDecision,
  MultiTrackSurvivorPromotionKeeperBankSlot,
  MultiTrackSurvivorPromotionRisk,
  MultiTrackSurvivorPromotionWorkspaceState,
} from "./MultiTrackSurvivorPromotionEngineTypes";

type MultiTrackSurvivorPromotionInlineReadiness =
  | "ready"
  | "needs-review"
  | "blocked"
  | "future";

export function getMultiTrackSurvivorPromotionReadinessLabel(
  readiness: MultiTrackSurvivorPromotionInlineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackSurvivorPromotionDecisionLabel(
  decision: MultiTrackSurvivorPromotionDecision,
): string {
  if (decision === "promote") return "Promote";
  if (decision === "hold") return "Hold";
  if (decision === "review") return "Review";
  if (decision === "reject") return "Reject";
  return "Future";
}

export function clampMultiTrackSurvivorPromotionScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export function getMultiTrackSurvivorPromotionRiskLoad(
  risks: MultiTrackSurvivorPromotionRisk[],
): number {
  if (risks.length === 0) return 0;

  const totalSeverity = risks.reduce((total, risk) => total + risk.severity, 0);
  return clampMultiTrackSurvivorPromotionScore(totalSeverity / risks.length);
}

export function calculateMultiTrackSurvivorPromotionCandidateScore(
  candidate: MultiTrackSurvivorPromotionCandidate,
): number {
  const evidenceStrength =
    candidate.evidence.reduce((total, evidence) => total + evidence.strength, 0) /
    Math.max(1, candidate.evidence.length);

  const evidenceConfidence =
    candidate.evidence.reduce((total, evidence) => total + evidence.confidence, 0) /
    Math.max(1, candidate.evidence.length);

  const riskLoad = getMultiTrackSurvivorPromotionRiskLoad(candidate.risks);

  return clampMultiTrackSurvivorPromotionScore(
    evidenceStrength * 0.42 +
      evidenceConfidence * 0.28 +
      candidate.confidence * 0.2 +
      candidate.score * 0.1 -
      riskLoad * 0.22,
  );
}

export function getMultiTrackSurvivorPromotionRecommendedDecision(
  candidate: MultiTrackSurvivorPromotionCandidate,
): MultiTrackSurvivorPromotionDecision {
  const calculatedScore = calculateMultiTrackSurvivorPromotionCandidateScore(candidate);
  const hasSevereManualRisk = candidate.risks.some(
    (risk) => !risk.canAutoResolve && risk.severity >= 70,
  );

  if (candidate.readiness === "blocked") return "review";
  if (hasSevereManualRisk) return "review";
  if (calculatedScore >= 88 && candidate.confidence >= 85) return "promote";
  if (calculatedScore >= 74) return "review";
  if (calculatedScore >= 58) return "hold";
  return "reject";
}

export function sortMultiTrackSurvivorPromotionCandidates(
  candidates: MultiTrackSurvivorPromotionCandidate[],
): MultiTrackSurvivorPromotionCandidate[] {
  return [...candidates].sort((first, second) => {
    const firstScore = calculateMultiTrackSurvivorPromotionCandidateScore(first);
    const secondScore = calculateMultiTrackSurvivorPromotionCandidateScore(second);
    const scoreDelta = secondScore - firstScore;

    if (scoreDelta !== 0) return scoreDelta;

    return first.title.localeCompare(second.title);
  });
}

export function getMultiTrackSurvivorPromotionReadyCandidates(
  candidates: MultiTrackSurvivorPromotionCandidate[],
): MultiTrackSurvivorPromotionCandidate[] {
  const readyCandidates = candidates.filter(
    (candidate) => candidate.decision === "promote" && candidate.readiness === "ready",
  );

  return sortMultiTrackSurvivorPromotionCandidates(readyCandidates);
}

export function getMultiTrackSurvivorPromotionReviewCandidates(
  candidates: MultiTrackSurvivorPromotionCandidate[],
): MultiTrackSurvivorPromotionCandidate[] {
  const reviewCandidates = candidates.filter(
    (candidate) =>
      candidate.decision === "review" ||
      candidate.readiness === "needs-review" ||
      candidate.risks.length > 0,
  );

  return sortMultiTrackSurvivorPromotionCandidates(reviewCandidates);
}

export function countMultiTrackSurvivorPromotionAcceptedKeepers(
  keeperBankSlots: MultiTrackSurvivorPromotionKeeperBankSlot[],
): number {
  return keeperBankSlots.reduce(
    (total, slot) => total + slot.acceptedCandidateIds.length,
    0,
  );
}

export function countMultiTrackSurvivorPromotionPendingKeepers(
  keeperBankSlots: MultiTrackSurvivorPromotionKeeperBankSlot[],
): number {
  return keeperBankSlots.reduce(
    (total, slot) => total + slot.pendingCandidateIds.length,
    0,
  );
}

export function getMultiTrackSurvivorPromotionWorkspaceSummary(
  workspace: MultiTrackSurvivorPromotionWorkspaceState,
): string {
  const readyCount = getMultiTrackSurvivorPromotionReadyCandidates(workspace.candidates).length;
  const reviewCount = getMultiTrackSurvivorPromotionReviewCandidates(workspace.candidates).length;
  const acceptedCount = countMultiTrackSurvivorPromotionAcceptedKeepers(workspace.keeperBankSlots);
  const pendingCount = countMultiTrackSurvivorPromotionPendingKeepers(workspace.keeperBankSlots);

  return `${readyCount} ready survivor candidate${
    readyCount === 1 ? "" : "s"
  }, ${reviewCount} needing review, ${acceptedCount} accepted keeper${
    acceptedCount === 1 ? "" : "s"
  }, ${pendingCount} pending keeper${pendingCount === 1 ? "" : "s"}.`;
}