import type {
  MultiTrackVariationEngineCandidate,
  MultiTrackVariationEngineCandidateSummary,
  MultiTrackVariationEngineCluster,
  MultiTrackVariationEngineClusterSummary,
  MultiTrackVariationEngineComparison,
  MultiTrackVariationEngineConfidenceBucket,
  MultiTrackVariationEngineDecision,
  MultiTrackVariationEngineEditPlan,
  MultiTrackVariationEngineFilter,
  MultiTrackVariationEngineReadinessStatus,
  MultiTrackVariationEngineRenderPlan,
  MultiTrackVariationEngineReviewPacket,
  MultiTrackVariationEngineRisk,
  MultiTrackVariationEngineScore,
  MultiTrackVariationEngineValidationResult,
  MultiTrackVariationEngineVariationKind,
  MultiTrackVariationEngineVersionId,
  MultiTrackVariationEngineVersionRanking,
  MultiTrackVariationEngineWorkspaceState,
} from "./MultiTrackVariationEngineTypes";

export function getMultiTrackVariationEngineReadinessLabel(
  status: MultiTrackVariationEngineReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackVariationEngineConfidenceLabel(
  bucket: MultiTrackVariationEngineConfidenceBucket,
): string {
  if (bucket === "verified") return "Verified";
  if (bucket === "strong") return "Strong";
  if (bucket === "moderate") return "Moderate";
  if (bucket === "weak") return "Weak";
  if (bucket === "blocked") return "Blocked";
  return "Unknown";
}

export function getMultiTrackVariationEngineKindLabel(
  kind: MultiTrackVariationEngineVariationKind,
): string {
  if (kind === "hook") return "Hook";
  if (kind === "riff") return "Riff";
  if (kind === "melody") return "Melody";
  if (kind === "vocal") return "Vocal";
  if (kind === "bass") return "Bass";
  if (kind === "drums") return "Drums";
  if (kind === "groove") return "Groove";
  if (kind === "transition") return "Transition";
  if (kind === "section") return "Section";
  return "Hybrid";
}

export function formatMultiTrackVariationEngineSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatMultiTrackVariationEngineRange(
  startSeconds: number,
  endSeconds: number,
): string {
  return `${formatMultiTrackVariationEngineSeconds(
    startSeconds,
  )} - ${formatMultiTrackVariationEngineSeconds(endSeconds)}`;
}

export function getMultiTrackVariationEngineConfidenceScore(
  bucket: MultiTrackVariationEngineConfidenceBucket,
): number {
  if (bucket === "verified") return 100;
  if (bucket === "strong") return 85;
  if (bucket === "moderate") return 65;
  if (bucket === "weak") return 35;
  if (bucket === "blocked") return 0;
  return 10;
}

export function getMultiTrackVariationEngineCandidateById(
  state: MultiTrackVariationEngineWorkspaceState,
  candidateId: string,
): MultiTrackVariationEngineCandidate | null {
  return (
    state.candidates.find((candidate) => candidate.id === candidateId) ?? null
  );
}

export function getMultiTrackVariationEngineClusterById(
  state: MultiTrackVariationEngineWorkspaceState,
  clusterId: string,
): MultiTrackVariationEngineCluster | null {
  return state.clusters.find((cluster) => cluster.id === clusterId) ?? null;
}

export function getMultiTrackVariationEngineScoresForCandidate(
  state: MultiTrackVariationEngineWorkspaceState,
  candidate: MultiTrackVariationEngineCandidate,
): MultiTrackVariationEngineScore[] {
  return candidate.scoreIds
    .map((scoreId) => state.scores.find((score) => score.id === scoreId))
    .filter((score): score is MultiTrackVariationEngineScore => Boolean(score));
}

export function getMultiTrackVariationEngineRisksForCandidate(
  state: MultiTrackVariationEngineWorkspaceState,
  candidate: MultiTrackVariationEngineCandidate,
): MultiTrackVariationEngineRisk[] {
  return candidate.riskIds
    .map((riskId) => state.risks.find((risk) => risk.id === riskId))
    .filter((risk): risk is MultiTrackVariationEngineRisk => Boolean(risk));
}

export function getMultiTrackVariationEngineDecisionsForCandidate(
  state: MultiTrackVariationEngineWorkspaceState,
  candidate: MultiTrackVariationEngineCandidate,
): MultiTrackVariationEngineDecision[] {
  return candidate.decisionIds
    .map((decisionId) =>
      state.decisions.find((decision) => decision.id === decisionId),
    )
    .filter((decision): decision is MultiTrackVariationEngineDecision =>
      Boolean(decision),
    );
}

export function getMultiTrackVariationEngineAverageCandidateScore(
  state: MultiTrackVariationEngineWorkspaceState,
  candidate: MultiTrackVariationEngineCandidate,
): number {
  const scores = getMultiTrackVariationEngineScoresForCandidate(
    state,
    candidate,
  );

  if (scores.length === 0) return 0;

  const total = scores.reduce((sum, score) => sum + score.value, 0);
  return Math.round(total / scores.length);
}

export function buildMultiTrackVariationEngineCandidateSummaries(
  state: MultiTrackVariationEngineWorkspaceState,
): MultiTrackVariationEngineCandidateSummary[] {
  return state.candidates.map((candidate) => ({
    candidateId: candidate.id,
    title: candidate.title,
    versionId: candidate.versionId,
    variationKind: candidate.variationKind,
    color: candidate.color,
    averageScore: getMultiTrackVariationEngineAverageCandidateScore(
      state,
      candidate,
    ),
    riskCount: candidate.riskIds.length,
    confidenceBucket: candidate.confidenceBucket,
    readinessStatus: candidate.readinessStatus,
  }));
}

export function buildMultiTrackVariationEngineClusterSummaries(
  state: MultiTrackVariationEngineWorkspaceState,
): MultiTrackVariationEngineClusterSummary[] {
  return state.clusters.map((cluster) => {
    const winningCandidate = cluster.winningCandidateId
      ? getMultiTrackVariationEngineCandidateById(
          state,
          cluster.winningCandidateId,
        )
      : null;

    return {
      clusterId: cluster.id,
      title: cluster.title,
      variationKind: cluster.variationKind,
      color: cluster.color,
      candidateCount: cluster.candidateIds.length,
      winningCandidateTitle: winningCandidate?.title ?? "No winner yet",
      readinessStatus: cluster.readinessStatus,
    };
  });
}

export function getMultiTrackVariationEngineComparisonsForCluster(
  state: MultiTrackVariationEngineWorkspaceState,
  clusterId: string,
): MultiTrackVariationEngineComparison[] {
  return state.comparisons.filter(
    (comparison) => comparison.clusterId === clusterId,
  );
}

export function getMultiTrackVariationEngineEditPlansForCandidate(
  state: MultiTrackVariationEngineWorkspaceState,
  candidateId: string,
): MultiTrackVariationEngineEditPlan[] {
  return state.editPlans.filter((plan) => plan.candidateId === candidateId);
}

export function getMultiTrackVariationEngineRenderPlansForCandidate(
  state: MultiTrackVariationEngineWorkspaceState,
  candidateId: string,
): MultiTrackVariationEngineRenderPlan[] {
  return state.renderPlans.filter((plan) => plan.candidateId === candidateId);
}

export function buildMultiTrackVariationEngineReviewPacket(
  state: MultiTrackVariationEngineWorkspaceState,
  clusterId: string,
  candidateId: string,
): MultiTrackVariationEngineReviewPacket {
  const activeCluster = getMultiTrackVariationEngineClusterById(
    state,
    clusterId,
  );
  const activeCandidate = getMultiTrackVariationEngineCandidateById(
    state,
    candidateId,
  );

  if (!activeCandidate) {
    return {
      activeCluster,
      activeCandidate: null,
      scores: [],
      risks: [],
      decisions: [],
      editPlans: [],
      renderPlans: [],
      comparisons: activeCluster
        ? getMultiTrackVariationEngineComparisonsForCluster(
            state,
            activeCluster.id,
          )
        : [],
    };
  }

  return {
    activeCluster,
    activeCandidate,
    scores: getMultiTrackVariationEngineScoresForCandidate(
      state,
      activeCandidate,
    ),
    risks: getMultiTrackVariationEngineRisksForCandidate(
      state,
      activeCandidate,
    ),
    decisions: getMultiTrackVariationEngineDecisionsForCandidate(
      state,
      activeCandidate,
    ),
    editPlans: getMultiTrackVariationEngineEditPlansForCandidate(
      state,
      activeCandidate.id,
    ),
    renderPlans: getMultiTrackVariationEngineRenderPlansForCandidate(
      state,
      activeCandidate.id,
    ),
    comparisons: activeCluster
      ? getMultiTrackVariationEngineComparisonsForCluster(
          state,
          activeCluster.id,
        )
      : [],
  };
}

export function buildMultiTrackVariationEngineVersionRankings(
  state: MultiTrackVariationEngineWorkspaceState,
): MultiTrackVariationEngineVersionRanking[] {
  return state.sourceVersions.map((source) => {
    const candidates = state.candidates.filter(
      (candidate) => candidate.versionId === source.versionId,
    );

    const averageScore =
      candidates.length > 0
        ? Math.round(
            candidates.reduce(
              (sum, candidate) =>
                sum +
                getMultiTrackVariationEngineAverageCandidateScore(
                  state,
                  candidate,
                ),
              0,
            ) / candidates.length,
          )
        : 0;

    const strongestCandidate = [...candidates].sort(
      (firstCandidate, secondCandidate) =>
        getMultiTrackVariationEngineAverageCandidateScore(
          state,
          secondCandidate,
        ) -
        getMultiTrackVariationEngineAverageCandidateScore(
          state,
          firstCandidate,
        ),
    )[0];

    return {
      versionId: source.versionId,
      sourceTitle: source.title,
      candidateCount: candidates.length,
      averageScore,
      strongestCandidateTitle: strongestCandidate?.title ?? "No candidate yet",
      readinessStatus: source.readinessStatus,
    };
  });
}

export function filterMultiTrackVariationEngineCandidates(
  candidates: MultiTrackVariationEngineCandidate[],
  filter: MultiTrackVariationEngineFilter,
): MultiTrackVariationEngineCandidate[] {
  const searchText = filter.searchText.trim().toLowerCase();

  return candidates.filter((candidate) => {
    const matchesSearch =
      searchText.length === 0 ||
      candidate.title.toLowerCase().includes(searchText) ||
      candidate.summary.toLowerCase().includes(searchText);

    const matchesKind =
      filter.variationKind === "all" ||
      candidate.variationKind === filter.variationKind;

    const matchesColor =
      filter.color === "all" || candidate.color === filter.color;

    const matchesConfidence =
      filter.confidenceBucket === "all" ||
      candidate.confidenceBucket === filter.confidenceBucket;

    const matchesReadiness =
      filter.readinessStatus === "all" ||
      candidate.readinessStatus === filter.readinessStatus;

    return (
      matchesSearch &&
      matchesKind &&
      matchesColor &&
      matchesConfidence &&
      matchesReadiness
    );
  });
}

export function getMultiTrackVariationEngineWinningCandidates(
  state: MultiTrackVariationEngineWorkspaceState,
): MultiTrackVariationEngineCandidate[] {
  return state.clusters
    .map((cluster) =>
      cluster.winningCandidateId
        ? getMultiTrackVariationEngineCandidateById(
            state,
            cluster.winningCandidateId,
          )
        : null,
    )
    .filter((candidate): candidate is MultiTrackVariationEngineCandidate =>
      Boolean(candidate),
    );
}

export function validateMultiTrackVariationEngineState(
  state: MultiTrackVariationEngineWorkspaceState,
): MultiTrackVariationEngineValidationResult {
  const messages: string[] = [];
  const scoreIds = new Set(state.scores.map((score) => score.id));
  const riskIds = new Set(state.risks.map((risk) => risk.id));
  const decisionIds = new Set(state.decisions.map((decision) => decision.id));
  const candidateIds = new Set(
    state.candidates.map((candidate) => candidate.id),
  );
  const clusterIds = new Set(state.clusters.map((cluster) => cluster.id));
  const sourceVersionIds = new Set(
    state.sourceVersions.map((source) => source.versionId),
  );

  state.candidates.forEach((candidate) => {
    if (!sourceVersionIds.has(candidate.versionId)) {
      messages.push(`Missing source version for candidate ${candidate.id}`);
    }

    candidate.scoreIds.forEach((scoreId) => {
      if (!scoreIds.has(scoreId)) {
        messages.push(`Missing score ${scoreId} for candidate ${candidate.id}`);
      }
    });

    candidate.riskIds.forEach((riskId) => {
      if (!riskIds.has(riskId)) {
        messages.push(`Missing risk ${riskId} for candidate ${candidate.id}`);
      }
    });

    candidate.decisionIds.forEach((decisionId) => {
      if (!decisionIds.has(decisionId)) {
        messages.push(
          `Missing decision ${decisionId} for candidate ${candidate.id}`,
        );
      }
    });
  });

  state.clusters.forEach((cluster) => {
    cluster.candidateIds.forEach((candidateId) => {
      if (!candidateIds.has(candidateId)) {
        messages.push(`Missing candidate ${candidateId} in cluster ${cluster.id}`);
      }
    });

    if (
      cluster.winningCandidateId &&
      !candidateIds.has(cluster.winningCandidateId)
    ) {
      messages.push(`Missing winning candidate in cluster ${cluster.id}`);
    }
  });

  state.comparisons.forEach((comparison) => {
    if (!clusterIds.has(comparison.clusterId)) {
      messages.push(`Missing cluster for comparison ${comparison.id}`);
    }

    if (!candidateIds.has(comparison.leftCandidateId)) {
      messages.push(`Missing left candidate for comparison ${comparison.id}`);
    }

    if (!candidateIds.has(comparison.rightCandidateId)) {
      messages.push(`Missing right candidate for comparison ${comparison.id}`);
    }

    if (
      comparison.winnerCandidateId &&
      !candidateIds.has(comparison.winnerCandidateId)
    ) {
      messages.push(`Missing winner candidate for comparison ${comparison.id}`);
    }
  });

  state.editPlans.forEach((plan) => {
    if (!candidateIds.has(plan.candidateId)) {
      messages.push(`Missing candidate for edit plan ${plan.id}`);
    }
  });

  state.renderPlans.forEach((plan) => {
    if (!candidateIds.has(plan.candidateId)) {
      messages.push(`Missing candidate for render plan ${plan.id}`);
    }
  });

  const readyCount = state.candidates.filter(
    (candidate) => candidate.readinessStatus === "ready",
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
    readyCount,
    reviewCount,
    futureCount,
    blockedCount,
    messages,
  };
}