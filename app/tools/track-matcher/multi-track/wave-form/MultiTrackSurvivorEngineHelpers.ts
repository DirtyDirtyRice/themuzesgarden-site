import { multiTrackSurvivorEngineWorkspace } from "./MultiTrackSurvivorEngineSeed";
import type {
  MultiTrackSurvivorEngineCandidate,
  MultiTrackSurvivorEngineComparison,
  MultiTrackSurvivorEngineDecision,
  MultiTrackSurvivorEngineEvidence,
  MultiTrackSurvivorEngineFinding,
  MultiTrackSurvivorEngineReadiness,
  MultiTrackSurvivorEngineRisk,
  MultiTrackSurvivorEngineStatus,
  MultiTrackSurvivorEngineWorkspace,
} from "./MultiTrackSurvivorEngineTypes";

export function getMultiTrackSurvivorEngineWorkspace(): MultiTrackSurvivorEngineWorkspace {
  return multiTrackSurvivorEngineWorkspace;
}

export function getSurvivorEngineReadinessLabel(
  readiness: MultiTrackSurvivorEngineReadiness,
): string {
  if (readiness === "ready") return "Ready";
  if (readiness === "needs-mutation-map") return "Needs Mutation Map";
  if (readiness === "needs-riff-groups") return "Needs Riff Groups";
  if (readiness === "needs-review") return "Needs Review";
  if (readiness === "blocked") return "Blocked";
  return "Future";
}

export function getSurvivorEngineStatusLabel(status: MultiTrackSurvivorEngineStatus): string {
  if (status === "ranked") return "Ranked";
  if (status === "estimated") return "Estimated";
  if (status === "seeded") return "Seeded";
  if (status === "missing") return "Missing";
  return "Future";
}

export function getSurvivorEngineRiskLabel(risk: MultiTrackSurvivorEngineRisk): string {
  if (risk === "low") return "Low";
  if (risk === "medium") return "Medium";
  if (risk === "high") return "High";
  return "Blocked";
}

export function getSurvivorEngineDecisionLabel(decision: MultiTrackSurvivorEngineDecision): string {
  if (decision === "promote") return "Promote";
  if (decision === "hold") return "Hold";
  if (decision === "review") return "Review";
  if (decision === "reject") return "Reject";
  return "Future";
}

export function getSurvivorEngineTimeLabel(timeMs: number): string {
  const seconds = Math.round(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function getSurvivorEngineCandidateTimeLabel(
  candidate: MultiTrackSurvivorEngineCandidate,
): string {
  return `${getSurvivorEngineTimeLabel(candidate.startMs)} - ${getSurvivorEngineTimeLabel(
    candidate.endMs,
  )}`;
}

export function getSurvivorEnginePercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 100;
  return Math.round(value * 100);
}

export function getSurvivorEngineScoreWidth(value: number): string {
  return `${Math.max(4, getSurvivorEnginePercent(value))}%`;
}

export function getSurvivorEngineBestCandidate(
  candidates: MultiTrackSurvivorEngineCandidate[],
): MultiTrackSurvivorEngineCandidate | null {
  if (candidates.length === 0) return null;

  return candidates.reduce((best, candidate) => {
    if (candidate.scoreBreakdown.finalScore > best.scoreBreakdown.finalScore) return candidate;
    return best;
  }, candidates[0]);
}

export function getSurvivorEnginePromotedCount(
  candidates: MultiTrackSurvivorEngineCandidate[],
): number {
  return candidates.filter((candidate) => candidate.decision === "promote").length;
}

export function getSurvivorEngineHeldCount(
  candidates: MultiTrackSurvivorEngineCandidate[],
): number {
  return candidates.filter((candidate) => candidate.decision === "hold").length;
}

export function getSurvivorEngineRejectedCount(
  candidates: MultiTrackSurvivorEngineCandidate[],
): number {
  return candidates.filter((candidate) => candidate.decision === "reject").length;
}

export function getSurvivorEngineRiskCount(
  candidates: MultiTrackSurvivorEngineCandidate[],
): number {
  return candidates.filter(
    (candidate) =>
      candidate.risk === "medium" || candidate.risk === "high" || candidate.risk === "blocked",
  ).length;
}

export function getSurvivorEngineAverageFinalScore(
  candidates: MultiTrackSurvivorEngineCandidate[],
): number {
  if (candidates.length === 0) return 0;
  const total = candidates.reduce((sum, candidate) => sum + candidate.scoreBreakdown.finalScore, 0);
  return roundSurvivorNumber(total / candidates.length);
}

export function getSurvivorEngineCandidateSummary(
  candidate: MultiTrackSurvivorEngineCandidate,
): string {
  return `Rank ${candidate.rank} / ${getSurvivorEngineDecisionLabel(
    candidate.decision,
  )} / final score ${candidate.scoreBreakdown.finalScore}.`;
}

export function getSurvivorEngineEvidenceSummary(
  evidence: MultiTrackSurvivorEngineEvidence,
): string {
  return `${getSurvivorEngineStatusLabel(evidence.status)} / ${getSurvivorEngineRiskLabel(
    evidence.risk,
  )} / impact ${evidence.scoreImpact}.`;
}

export function getSurvivorEngineComparisonSummary(
  comparison: MultiTrackSurvivorEngineComparison,
): string {
  return `Winner ${comparison.winnerCandidateId} / score difference ${comparison.scoreDifference}.`;
}

export function getSurvivorEngineFindingAction(
  finding: MultiTrackSurvivorEngineFinding,
): string {
  return `${getSurvivorEngineStatusLabel(finding.status)} / ${getSurvivorEngineRiskLabel(
    finding.risk,
  )}: ${finding.action}`;
}

export function buildSurvivorEnginePlanningSentence(
  workspace: MultiTrackSurvivorEngineWorkspace,
): string {
  const best = getSurvivorEngineBestCandidate(workspace.candidates);

  if (!best) {
    return "Survivor engine needs candidates before planning extraction.";
  }

  return `${best.title} is the current top survivor. Recommendation: ${best.recommendation}`;
}

function roundSurvivorNumber(value: number): number {
  return Math.round(value * 100) / 100;
}
