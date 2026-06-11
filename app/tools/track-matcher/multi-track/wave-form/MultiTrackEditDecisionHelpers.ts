import type {
  MultiTrackEditDecisionCandidate,
  MultiTrackEditDecisionChoice,
  MultiTrackEditDecisionConfidenceBucket,
  MultiTrackEditDecisionReadinessStatus,
  MultiTrackEditDecisionRecord,
  MultiTrackEditDecisionReviewPacket,
  MultiTrackEditDecisionRisk,
  MultiTrackEditDecisionScore,
  MultiTrackEditDecisionSummary,
  MultiTrackEditDecisionTargetKind,
  MultiTrackEditDecisionValidationResult,
  MultiTrackEditDecisionWorkspaceState,
} from "./MultiTrackEditDecisionTypes";

export function getMultiTrackEditDecisionReadinessLabel(
  status: MultiTrackEditDecisionReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackEditDecisionChoiceLabel(
  choice: MultiTrackEditDecisionChoice,
): string {
  if (choice === "keep") return "Keep";
  if (choice === "edit") return "Edit";
  if (choice === "duplicate") return "Duplicate";
  if (choice === "render") return "Render";
  if (choice === "hold") return "Hold";
  return "Reject";
}

export function getMultiTrackEditDecisionTargetKindLabel(
  kind: MultiTrackEditDecisionTargetKind,
): string {
  if (kind === "hook") return "Hook";
  if (kind === "riff") return "Riff";
  if (kind === "bass-groove") return "Bass Groove";
  if (kind === "drum-pocket") return "Drum Pocket";
  if (kind === "vocal-phrase") return "Vocal Phrase";
  if (kind === "melody") return "Melody";
  return "Hybrid Section";
}

export function getMultiTrackEditDecisionConfidenceLabel(
  bucket: MultiTrackEditDecisionConfidenceBucket,
): string {
  if (bucket === "verified") return "Verified";
  if (bucket === "strong") return "Strong";
  if (bucket === "moderate") return "Moderate";
  if (bucket === "weak") return "Weak";
  if (bucket === "blocked") return "Blocked";
  return "Unknown";
}

export function formatMultiTrackEditDecisionSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatMultiTrackEditDecisionRange(
  startSeconds: number,
  endSeconds: number,
): string {
  return `${formatMultiTrackEditDecisionSeconds(
    startSeconds,
  )} - ${formatMultiTrackEditDecisionSeconds(endSeconds)}`;
}

export function findMultiTrackEditDecisionById(
  state: MultiTrackEditDecisionWorkspaceState,
  decisionId: string,
): MultiTrackEditDecisionRecord | null {
  return state.decisions.find((decision) => decision.id === decisionId) ?? null;
}

export function findMultiTrackEditDecisionCandidateById(
  state: MultiTrackEditDecisionWorkspaceState,
  candidateId: string,
): MultiTrackEditDecisionCandidate | null {
  return (
    state.candidates.find((candidate) => candidate.id === candidateId) ?? null
  );
}

export function getMultiTrackEditDecisionScoresForCandidate(
  state: MultiTrackEditDecisionWorkspaceState,
  candidateId: string,
): MultiTrackEditDecisionScore[] {
  return state.scores.filter((score) => score.candidateId === candidateId);
}

export function getMultiTrackEditDecisionRisksForDecision(
  state: MultiTrackEditDecisionWorkspaceState,
  decision: MultiTrackEditDecisionRecord,
): MultiTrackEditDecisionRisk[] {
  return decision.riskIds
    .map((riskId) => state.risks.find((risk) => risk.id === riskId))
    .filter((risk): risk is MultiTrackEditDecisionRisk => Boolean(risk));
}

export function getMultiTrackEditDecisionAverageScore(
  scores: MultiTrackEditDecisionScore[],
): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, score) => sum + score.value, 0);
  return Math.round(total / scores.length);
}

export function buildMultiTrackEditDecisionReviewPacket(
  state: MultiTrackEditDecisionWorkspaceState,
  decisionId: string,
): MultiTrackEditDecisionReviewPacket {
  const activeDecision = findMultiTrackEditDecisionById(state, decisionId);

  if (!activeDecision) {
    return {
      activeDecision: null,
      candidate: null,
      scores: [],
      risks: [],
    };
  }

  const candidate = findMultiTrackEditDecisionCandidateById(
    state,
    activeDecision.candidateId,
  );

  return {
    activeDecision,
    candidate,
    scores: candidate
      ? getMultiTrackEditDecisionScoresForCandidate(state, candidate.id)
      : [],
    risks: getMultiTrackEditDecisionRisksForDecision(state, activeDecision),
  };
}

export function buildMultiTrackEditDecisionSummaries(
  state: MultiTrackEditDecisionWorkspaceState,
): MultiTrackEditDecisionSummary[] {
  return state.decisions.map((decision) => {
    const candidate = findMultiTrackEditDecisionCandidateById(
      state,
      decision.candidateId,
    );
    const scores = candidate
      ? getMultiTrackEditDecisionScoresForCandidate(state, candidate.id)
      : [];

    return {
      decisionId: decision.id,
      candidateTitle: candidate?.title ?? "Missing candidate",
      choice: decision.choice,
      targetKind: candidate?.targetKind ?? "hybrid-section",
      color: candidate?.color ?? "white",
      averageScore: getMultiTrackEditDecisionAverageScore(scores),
      readinessStatus: decision.readinessStatus,
    };
  });
}

export function validateMultiTrackEditDecisionState(
  state: MultiTrackEditDecisionWorkspaceState,
): MultiTrackEditDecisionValidationResult {
  const messages: string[] = [];
  const candidateIds = new Set(
    state.candidates.map((candidate) => candidate.id),
  );
  const riskIds = new Set(state.risks.map((risk) => risk.id));
  const decisionIds = new Set(
    state.decisions.map((decision) => decision.id),
  );

  state.scores.forEach((score) => {
    if (!candidateIds.has(score.candidateId)) {
      messages.push(`Missing candidate for score ${score.id}`);
    }
  });

  state.decisions.forEach((decision) => {
    if (!candidateIds.has(decision.candidateId)) {
      messages.push(`Missing candidate for decision ${decision.id}`);
    }

    decision.riskIds.forEach((riskId) => {
      if (!riskIds.has(riskId)) {
        messages.push(`Missing risk ${riskId} for decision ${decision.id}`);
      }
    });
  });

  state.lanes.forEach((lane) => {
    lane.decisionIds.forEach((decisionId) => {
      if (!decisionIds.has(decisionId)) {
        messages.push(`Missing decision ${decisionId} for lane ${lane.id}`);
      }
    });
  });

  const readyCount = state.decisions.filter(
    (decision) => decision.readinessStatus === "ready",
  ).length;

  const reviewCount = state.decisions.filter(
    (decision) => decision.readinessStatus === "needs-review",
  ).length;

  const futureCount = state.decisions.filter(
    (decision) => decision.readinessStatus === "future",
  ).length;

  const blockedCount = state.decisions.filter(
    (decision) => decision.readinessStatus === "blocked",
  ).length;

  return {
    isValid: messages.length === 0,
    readyCount,
    reviewCount,
    futureCount,
    blockedCount,
    messages,
  };
}