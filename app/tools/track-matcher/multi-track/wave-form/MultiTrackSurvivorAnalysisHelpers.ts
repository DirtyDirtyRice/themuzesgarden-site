import type {
  MultiTrackSurvivorAnalysisCandidate,
  MultiTrackSurvivorAnalysisCandidateKind,
  MultiTrackSurvivorAnalysisCandidateSummary,
  MultiTrackSurvivorAnalysisConfidenceBucket,
  MultiTrackSurvivorAnalysisGroup,
  MultiTrackSurvivorAnalysisGroupSummary,
  MultiTrackSurvivorAnalysisOutcome,
  MultiTrackSurvivorAnalysisReadinessStatus,
  MultiTrackSurvivorAnalysisReason,
  MultiTrackSurvivorAnalysisReviewPacket,
  MultiTrackSurvivorAnalysisRisk,
  MultiTrackSurvivorAnalysisValidationResult,
  MultiTrackSurvivorAnalysisWorkspaceState,
} from "./MultiTrackSurvivorAnalysisTypes";

export function getMultiTrackSurvivorAnalysisReadinessLabel(
  status: MultiTrackSurvivorAnalysisReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackSurvivorAnalysisConfidenceLabel(
  bucket: MultiTrackSurvivorAnalysisConfidenceBucket,
): string {
  if (bucket === "verified") return "Verified";
  if (bucket === "strong") return "Strong";
  if (bucket === "moderate") return "Moderate";
  if (bucket === "weak") return "Weak";
  if (bucket === "blocked") return "Blocked";
  return "Unknown";
}

export function getMultiTrackSurvivorAnalysisKindLabel(
  kind: MultiTrackSurvivorAnalysisCandidateKind,
): string {
  if (kind === "hook") return "Hook";
  if (kind === "riff") return "Riff";
  if (kind === "melody") return "Melody";
  if (kind === "bass-motion") return "Bass Motion";
  if (kind === "drum-pocket") return "Drum Pocket";
  if (kind === "vocal-phrase") return "Vocal Phrase";
  return "Hybrid Section";
}

export function getMultiTrackSurvivorAnalysisOutcomeLabel(
  outcome: MultiTrackSurvivorAnalysisOutcome,
): string {
  if (outcome === "winner") return "Winner";
  if (outcome === "runner-up") return "Runner Up";
  if (outcome === "support") return "Support";
  if (outcome === "review") return "Review";
  if (outcome === "hold") return "Hold";
  return "Reject";
}

export function formatMultiTrackSurvivorAnalysisSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatMultiTrackSurvivorAnalysisRange(
  startSeconds: number,
  endSeconds: number,
): string {
  return `${formatMultiTrackSurvivorAnalysisSeconds(
    startSeconds,
  )} - ${formatMultiTrackSurvivorAnalysisSeconds(endSeconds)}`;
}

export function getMultiTrackSurvivorAnalysisTotalScore(
  candidate: MultiTrackSurvivorAnalysisCandidate,
): number {
  return Math.round(
    (candidate.identityScore +
      candidate.editScore +
      candidate.renderScore +
      candidate.keeperScore) /
      4,
  );
}

export function findMultiTrackSurvivorAnalysisCandidateById(
  state: MultiTrackSurvivorAnalysisWorkspaceState,
  candidateId: string,
): MultiTrackSurvivorAnalysisCandidate | null {
  return (
    state.candidates.find((candidate) => candidate.id === candidateId) ?? null
  );
}

export function findMultiTrackSurvivorAnalysisGroupById(
  state: MultiTrackSurvivorAnalysisWorkspaceState,
  groupId: string,
): MultiTrackSurvivorAnalysisGroup | null {
  return state.groups.find((group) => group.id === groupId) ?? null;
}

export function getMultiTrackSurvivorAnalysisReasonsForCandidate(
  state: MultiTrackSurvivorAnalysisWorkspaceState,
  candidateId: string,
): MultiTrackSurvivorAnalysisReason[] {
  return state.reasons.filter((reason) => reason.candidateId === candidateId);
}

export function getMultiTrackSurvivorAnalysisRisksForGroup(
  state: MultiTrackSurvivorAnalysisWorkspaceState,
  group: MultiTrackSurvivorAnalysisGroup,
): MultiTrackSurvivorAnalysisRisk[] {
  return group.riskIds
    .map((riskId) => state.risks.find((risk) => risk.id === riskId))
    .filter((risk): risk is MultiTrackSurvivorAnalysisRisk => Boolean(risk));
}

export function buildMultiTrackSurvivorAnalysisCandidateSummaries(
  state: MultiTrackSurvivorAnalysisWorkspaceState,
): MultiTrackSurvivorAnalysisCandidateSummary[] {
  return state.candidates.map((candidate) => ({
    candidateId: candidate.id,
    title: candidate.title,
    versionId: candidate.versionId,
    candidateKind: candidate.candidateKind,
    outcome: candidate.outcome,
    totalScore: getMultiTrackSurvivorAnalysisTotalScore(candidate),
    confidenceBucket: candidate.confidenceBucket,
    readinessStatus: candidate.readinessStatus,
  }));
}

export function buildMultiTrackSurvivorAnalysisGroupSummaries(
  state: MultiTrackSurvivorAnalysisWorkspaceState,
): MultiTrackSurvivorAnalysisGroupSummary[] {
  return state.groups.map((group) => {
    const winner = group.winnerCandidateId
      ? findMultiTrackSurvivorAnalysisCandidateById(
          state,
          group.winnerCandidateId,
        )
      : null;

    const runnerUp = group.runnerUpCandidateId
      ? findMultiTrackSurvivorAnalysisCandidateById(
          state,
          group.runnerUpCandidateId,
        )
      : null;

    return {
      groupId: group.id,
      title: group.title,
      candidateCount: group.candidateIds.length,
      winnerTitle: winner?.title ?? "No winner selected",
      runnerUpTitle: runnerUp?.title ?? "No runner up selected",
      readinessStatus: group.readinessStatus,
    };
  });
}

export function buildMultiTrackSurvivorAnalysisReviewPacket(
  state: MultiTrackSurvivorAnalysisWorkspaceState,
  groupId: string,
  candidateId: string,
): MultiTrackSurvivorAnalysisReviewPacket {
  const activeGroup = findMultiTrackSurvivorAnalysisGroupById(state, groupId);
  const activeCandidate = findMultiTrackSurvivorAnalysisCandidateById(
    state,
    candidateId,
  );

  const groupCandidates = activeGroup
    ? activeGroup.candidateIds
        .map((id) => findMultiTrackSurvivorAnalysisCandidateById(state, id))
        .filter(
          (candidate): candidate is MultiTrackSurvivorAnalysisCandidate =>
            Boolean(candidate),
        )
    : [];

  return {
    activeGroup,
    activeCandidate,
    groupCandidates,
    reasons: activeCandidate
      ? getMultiTrackSurvivorAnalysisReasonsForCandidate(
          state,
          activeCandidate.id,
        )
      : [],
    risks: activeGroup
      ? getMultiTrackSurvivorAnalysisRisksForGroup(state, activeGroup)
      : [],
  };
}

export function validateMultiTrackSurvivorAnalysisState(
  state: MultiTrackSurvivorAnalysisWorkspaceState,
): MultiTrackSurvivorAnalysisValidationResult {
  const messages: string[] = [];
  const candidateIds = new Set(
    state.candidates.map((candidate) => candidate.id),
  );
  const riskIds = new Set(state.risks.map((risk) => risk.id));

  state.reasons.forEach((reason) => {
    if (!candidateIds.has(reason.candidateId)) {
      messages.push(`Missing candidate for reason ${reason.id}`);
    }
  });

  state.groups.forEach((group) => {
    group.candidateIds.forEach((candidateId) => {
      if (!candidateIds.has(candidateId)) {
        messages.push(`Missing candidate ${candidateId} for group ${group.id}`);
      }
    });

    if (group.winnerCandidateId && !candidateIds.has(group.winnerCandidateId)) {
      messages.push(`Missing winner candidate for group ${group.id}`);
    }

    if (
      group.runnerUpCandidateId &&
      !candidateIds.has(group.runnerUpCandidateId)
    ) {
      messages.push(`Missing runner-up candidate for group ${group.id}`);
    }

    group.riskIds.forEach((riskId) => {
      if (!riskIds.has(riskId)) {
        messages.push(`Missing risk ${riskId} for group ${group.id}`);
      }
    });
  });

  state.lanes.forEach((lane) => {
    lane.candidateIds.forEach((candidateId) => {
      if (!candidateIds.has(candidateId)) {
        messages.push(`Missing candidate ${candidateId} for lane ${lane.id}`);
      }
    });
  });

  const winnerCount = state.candidates.filter(
    (candidate) => candidate.outcome === "winner",
  ).length;

  const reviewCount = state.candidates.filter(
    (candidate) => candidate.readinessStatus === "needs-review",
  ).length;

  const futureCount = state.candidates.filter(
    (candidate) => candidate.readinessStatus === "future",
  ).length;

  const blockedCount = state.candidates.filter(
    (candidate) => candidate.readinessStatus === "blocked",
  ).length;

  return {
    isValid: messages.length === 0,
    winnerCount,
    reviewCount,
    futureCount,
    blockedCount,
    messages,
  };
}