// app/tools/track-matcher/multi-track/wave-form/MultiTrackCrossVersionVotingEngineHelpers.ts

import type {
  MultiTrackCrossVersionVotingCandidate,
  MultiTrackCrossVersionVotingReadiness,
  MultiTrackCrossVersionVotingRisk,
  MultiTrackCrossVersionVotingStrength,
  MultiTrackCrossVersionVotingVoteKind,
  MultiTrackCrossVersionVotingWorkspaceState,
} from "./MultiTrackCrossVersionVotingEngineTypes";

export function getMultiTrackCrossVersionVotingReadinessLabel(
  readiness: MultiTrackCrossVersionVotingReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackCrossVersionVotingKindLabel(
  voteKind: MultiTrackCrossVersionVotingVoteKind,
): string {
  if (voteKind === "keep") return "Keep";
  if (voteKind === "promote") return "Promote";
  if (voteKind === "compare") return "Compare";
  if (voteKind === "review") return "Review";
  if (voteKind === "hold") return "Hold";
  return "Reject";
}

export function getMultiTrackCrossVersionVotingStrengthLabel(
  strength: MultiTrackCrossVersionVotingStrength,
): string {
  if (strength === "elite") return "Elite";
  if (strength === "strong") return "Strong";
  if (strength === "medium") return "Medium";
  if (strength === "weak") return "Weak";
  return "Missing";
}

export function getMultiTrackCrossVersionVotingRiskLabel(
  risk: MultiTrackCrossVersionVotingRisk,
): string {
  if (risk === "missing-audio") return "Missing Audio";
  if (risk === "weak-match") return "Weak Match";
  if (risk === "conflicting-votes") return "Conflicting Votes";
  if (risk === "low-confidence") return "Low Confidence";
  if (risk === "needs-human-review") return "Needs Human Review";
  return "Seed Placeholder";
}

export function clampMultiTrackCrossVersionVotingScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export function getMultiTrackCrossVersionVotingStrengthScore(
  strength: MultiTrackCrossVersionVotingStrength,
): number {
  if (strength === "elite") return 100;
  if (strength === "strong") return 88;
  if (strength === "medium") return 70;
  if (strength === "weak") return 42;
  return 0;
}

export function calculateMultiTrackCrossVersionVotingScore(
  candidate: MultiTrackCrossVersionVotingCandidate,
): number {
  if (candidate.votes.length === 0) return 0;

  const totalWeight = candidate.votes.reduce((sum, vote) => sum + vote.weight, 0);

  if (totalWeight <= 0) return 0;

  const weightedScore = candidate.votes.reduce((sum, vote) => {
    const strengthScore = getMultiTrackCrossVersionVotingStrengthScore(vote.strength);
    const voteScore = strengthScore * 0.58 + vote.confidence * 0.42;

    return sum + voteScore * vote.weight;
  }, 0);

  const riskPenalty = Math.min(candidate.risks.length * 5, 30);

  return clampMultiTrackCrossVersionVotingScore(weightedScore / totalWeight - riskPenalty);
}

export function getMultiTrackCrossVersionVotingRecommendedKind(
  candidate: MultiTrackCrossVersionVotingCandidate,
): MultiTrackCrossVersionVotingVoteKind {
  const score = calculateMultiTrackCrossVersionVotingScore(candidate);

  if (candidate.readiness === "blocked") return "review";
  if (score >= 88) return "promote";
  if (score >= 76) return "keep";
  if (score >= 62) return "compare";
  if (score >= 46) return "review";
  if (score >= 30) return "hold";
  return "reject";
}

export function sortMultiTrackCrossVersionVotingCandidatesByScore(
  candidates: MultiTrackCrossVersionVotingCandidate[],
): MultiTrackCrossVersionVotingCandidate[] {
  return [...candidates].sort((left, right) => {
    const scoreDelta =
      calculateMultiTrackCrossVersionVotingScore(right) -
      calculateMultiTrackCrossVersionVotingScore(left);

    if (scoreDelta !== 0) return scoreDelta;

    return left.title.localeCompare(right.title);
  });
}

export function getMultiTrackCrossVersionVotingWinner(
  candidates: MultiTrackCrossVersionVotingCandidate[],
): MultiTrackCrossVersionVotingCandidate | undefined {
  return sortMultiTrackCrossVersionVotingCandidatesByScore(candidates)[0];
}

export function getMultiTrackCrossVersionVotingWorkspaceSummary(
  state: MultiTrackCrossVersionVotingWorkspaceState,
): {
  candidateCount: number;
  voteCount: number;
  readyCount: number;
  reviewCount: number;
  winnerTitle: string;
  winnerScore: number;
} {
  const winner = getMultiTrackCrossVersionVotingWinner(state.candidates);

  return {
    candidateCount: state.candidates.length,
    voteCount: state.candidates.reduce((sum, candidate) => sum + candidate.votes.length, 0),
    readyCount: state.candidates.filter((candidate) => candidate.readiness === "ready").length,
    reviewCount: state.candidates.filter(
      (candidate) => candidate.readiness === "needs-review" || candidate.voteKind === "review",
    ).length,
    winnerTitle: winner?.title ?? "No voting winner",
    winnerScore: winner ? calculateMultiTrackCrossVersionVotingScore(winner) : 0,
  };
}