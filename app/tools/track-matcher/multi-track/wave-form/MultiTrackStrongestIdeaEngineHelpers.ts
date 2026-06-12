
import type {
  MultiTrackStrongestIdeaCandidate,
  MultiTrackStrongestIdeaEngineReport,
  MultiTrackStrongestIdeaEngineState,
  MultiTrackStrongestIdeaEngineSummary,
  MultiTrackStrongestIdeaEvidenceLevel,
  MultiTrackStrongestIdeaRankedCandidate,
  MultiTrackStrongestIdeaReadiness,
  MultiTrackStrongestIdeaRisk,
  MultiTrackStrongestIdeaScoreBand,
  MultiTrackStrongestIdeaScoreBreakdown,
  MultiTrackStrongestIdeaSignal,
  MultiTrackStrongestIdeaSource,
  MultiTrackStrongestIdeaVerdict,
} from "./MultiTrackStrongestIdeaEngineTypes";

export function getStrongestIdeaReadinessLabel(readiness: MultiTrackStrongestIdeaReadiness): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getStrongestIdeaVerdictLabel(verdict: MultiTrackStrongestIdeaVerdict): string {
  if (verdict === "strongest") return "Strongest";
  if (verdict === "contender") return "Contender";
  if (verdict === "supporting") return "Supporting";
  if (verdict === "needs-more-evidence") return "Needs More Evidence";
  return "Reject";
}

export function getStrongestIdeaEvidenceLabel(level: MultiTrackStrongestIdeaEvidenceLevel): string {
  if (level === "verified") return "Verified";
  if (level === "strong") return "Strong";
  if (level === "moderate") return "Moderate";
  if (level === "weak") return "Weak";
  return "Missing";
}

export function clampStrongestIdeaScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
}

export function getStrongestIdeaEvidenceMultiplier(level: MultiTrackStrongestIdeaEvidenceLevel): number {
  if (level === "verified") return 1.15;
  if (level === "strong") return 1;
  if (level === "moderate") return 0.86;
  if (level === "weak") return 0.62;
  return 0.25;
}

export function getStrongestIdeaReadinessMultiplier(readiness: MultiTrackStrongestIdeaReadiness): number {
  if (readiness === "ready") return 1;
  if (readiness === "needs-review") return 0.86;
  if (readiness === "future") return 0.55;
  return 0.2;
}

export function calculateStrongestIdeaSignalScore(signal: MultiTrackStrongestIdeaSignal): number {
  const safeScore = clampStrongestIdeaScore(signal.score);
  const safeWeight = Number.isFinite(signal.weight) && signal.weight > 0 ? signal.weight : 1;
  const evidenceMultiplier = getStrongestIdeaEvidenceMultiplier(signal.evidenceLevel);
  return safeScore * safeWeight * evidenceMultiplier;
}

export function calculateStrongestIdeaWeightedSignalScore(
  signals: MultiTrackStrongestIdeaSignal[],
): number {
  if (signals.length === 0) return 0;

  const totalWeightedScore = signals.reduce((total, signal) => {
    return total + calculateStrongestIdeaSignalScore(signal);
  }, 0);

  const totalWeight = signals.reduce((total, signal) => {
    const safeWeight = Number.isFinite(signal.weight) && signal.weight > 0 ? signal.weight : 1;
    return total + safeWeight;
  }, 0);

  if (totalWeight <= 0) return 0;

  return clampStrongestIdeaScore(totalWeightedScore / totalWeight);
}

export function calculateStrongestIdeaRiskPenalty(risks: MultiTrackStrongestIdeaRisk[]): number {
  if (risks.length === 0) return 0;

  return risks.reduce((total, risk) => {
    const safeSeverity = clampStrongestIdeaScore(risk.severity);
    const blockingPenalty = risk.isBlocking ? 25 : 0;
    return total + safeSeverity + blockingPenalty;
  }, 0);
}

export function getStrongestIdeaScoreBand(score: number): MultiTrackStrongestIdeaScoreBand {
  const safeScore = clampStrongestIdeaScore(score);

  if (safeScore >= 90) return "elite";
  if (safeScore >= 76) return "high";
  if (safeScore >= 55) return "medium";
  if (safeScore > 0) return "low";
  return "unknown";
}

export function getStrongestIdeaScoreBandLabel(scoreBand: MultiTrackStrongestIdeaScoreBand): string {
  if (scoreBand === "elite") return "Elite";
  if (scoreBand === "high") return "High";
  if (scoreBand === "medium") return "Medium";
  if (scoreBand === "low") return "Low";
  return "Unknown";
}

export function calculateStrongestIdeaScoreBreakdown(
  candidate: MultiTrackStrongestIdeaCandidate,
): MultiTrackStrongestIdeaScoreBreakdown {
  const weightedSignalScore = calculateStrongestIdeaWeightedSignalScore(candidate.signals);
  const riskPenalty = calculateStrongestIdeaRiskPenalty(candidate.risks);
  const readinessMultiplier = getStrongestIdeaReadinessMultiplier(candidate.readiness);
  const manualAdjustment = candidate.manualBoost - candidate.manualPenalty;
  const positiveScore = weightedSignalScore * readinessMultiplier;
  const finalScore = clampStrongestIdeaScore(positiveScore - riskPenalty + manualAdjustment);

  return {
    candidateId: candidate.id,
    positiveScore: clampStrongestIdeaScore(positiveScore),
    weightedSignalScore,
    riskPenalty: clampStrongestIdeaScore(riskPenalty),
    manualAdjustment,
    finalScore,
    scoreBand: getStrongestIdeaScoreBand(finalScore),
  };
}

export function rankStrongestIdeaCandidates(
  candidates: MultiTrackStrongestIdeaCandidate[],
): MultiTrackStrongestIdeaRankedCandidate[] {
  return candidates
    .map((candidate) => ({
      candidate,
      score: calculateStrongestIdeaScoreBreakdown(candidate),
    }))
    .sort((left, right) => {
      if (right.score.finalScore !== left.score.finalScore) {
        return right.score.finalScore - left.score.finalScore;
      }

      return left.candidate.title.localeCompare(right.candidate.title);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      rankLabel: `#${index + 1}`,
    }));
}

export function findStrongestIdeaSourceById(
  sources: MultiTrackStrongestIdeaSource[],
  sourceId: string,
): MultiTrackStrongestIdeaSource | null {
  return sources.find((source) => source.id === sourceId) ?? null;
}

export function findStrongestIdeaCandidateById(
  candidates: MultiTrackStrongestIdeaCandidate[],
  candidateId: string,
): MultiTrackStrongestIdeaCandidate | null {
  return candidates.find((candidate) => candidate.id === candidateId) ?? null;
}

export function getStrongestIdeaCandidateDuration(candidate: MultiTrackStrongestIdeaCandidate): number {
  const duration = candidate.timeRange.endSecond - candidate.timeRange.startSecond;
  if (!Number.isFinite(duration) || duration < 0) return 0;
  return Math.round(duration);
}

export function formatStrongestIdeaTimeRange(candidate: MultiTrackStrongestIdeaCandidate): string {
  const start = Math.max(0, Math.round(candidate.timeRange.startSecond));
  const end = Math.max(start, Math.round(candidate.timeRange.endSecond));
  return `${start}s - ${end}s`;
}

export function hasStrongestIdeaBlockingRisk(candidate: MultiTrackStrongestIdeaCandidate): boolean {
  return candidate.risks.some((risk) => risk.isBlocking);
}

export function getStrongestIdeaCandidateReviewLabel(candidate: MultiTrackStrongestIdeaCandidate): string {
  if (hasStrongestIdeaBlockingRisk(candidate)) return "Blocked by risk";
  if (candidate.readiness === "ready" && candidate.verdict === "strongest") return "Promote first";
  if (candidate.readiness === "ready") return "Ready to compare";
  if (candidate.readiness === "needs-review") return "Needs listening review";
  if (candidate.readiness === "future") return "Waiting for future engine evidence";
  return "Blocked";
}

export function summarizeStrongestIdeaEngine(
  state: MultiTrackStrongestIdeaEngineState,
): MultiTrackStrongestIdeaEngineSummary {
  const rankedCandidates = rankStrongestIdeaCandidates(state.candidates);
  const strongest = rankedCandidates[0] ?? null;

  const readyCandidates = state.candidates.filter((candidate) => candidate.readiness === "ready").length;
  const blockedCandidates = state.candidates.filter((candidate) => candidate.readiness === "blocked").length;
  const needsReviewCount = state.candidates.filter(
    (candidate) => candidate.readiness === "needs-review",
  ).length;

  return {
    totalSources: state.sources.length,
    totalCandidates: state.candidates.length,
    readyCandidates,
    blockedCandidates,
    strongestCandidateId: strongest?.candidate.id ?? "",
    strongestCandidateTitle: strongest?.candidate.title ?? "No strongest idea yet",
    strongestScore: strongest?.score.finalScore ?? 0,
    strongestBand: strongest?.score.scoreBand ?? "unknown",
    needsReviewCount,
  };
}

export function createStrongestIdeaEngineReport(
  state: MultiTrackStrongestIdeaEngineState,
): MultiTrackStrongestIdeaEngineReport {
  const rankedCandidates = rankStrongestIdeaCandidates(state.candidates);
  const selectedCandidate = findStrongestIdeaCandidateById(
    state.candidates,
    state.selectedCandidateId,
  );

  return {
    state,
    rankedCandidates,
    selectedCandidate,
    summary: summarizeStrongestIdeaEngine(state),
  };
}

export function getStrongestIdeaSourceLabel(
  sources: MultiTrackStrongestIdeaSource[],
  sourceId: string,
): string {
  const source = findStrongestIdeaSourceById(sources, sourceId);
  return source?.label ?? "Unknown Source";
}

export function getStrongestIdeaPromotionReason(
  rankedCandidate: MultiTrackStrongestIdeaRankedCandidate,
): string {
  const { candidate, score, rank } = rankedCandidate;

  if (rank === 1 && score.finalScore >= 85) {
    return "Best current candidate for keeper promotion and arrangement testing.";
  }

  if (candidate.verdict === "contender") {
    return "Useful contender that should stay available for comparison.";
  }

  if (candidate.verdict === "needs-more-evidence") {
    return "Hold until more waveform or listening evidence is available.";
  }

  if (candidate.verdict === "supporting") {
    return "Useful as support material, but not the main musical winner.";
  }

  if (candidate.verdict === "reject") {
    return "Do not promote unless future evidence changes the decision.";
  }

  return "Candidate is worth keeping in the ranked idea list.";
}