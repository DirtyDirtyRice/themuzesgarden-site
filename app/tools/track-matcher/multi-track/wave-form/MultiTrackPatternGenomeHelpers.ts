import type {
  MultiTrackPatternGenomeAction,
  MultiTrackPatternGenomeBoard,
  MultiTrackPatternGenomeColor,
  MultiTrackPatternGenomeComparison,
  MultiTrackPatternGenomeConfidenceBucket,
  MultiTrackPatternGenomeEvidence,
  MultiTrackPatternGenomeFilter,
  MultiTrackPatternGenomeIdea,
  MultiTrackPatternGenomeIdeaRole,
  MultiTrackPatternGenomeIdeaSummary,
  MultiTrackPatternGenomeReadinessStatus,
  MultiTrackPatternGenomeReviewPacket,
  MultiTrackPatternGenomeRisk,
  MultiTrackPatternGenomeSource,
  MultiTrackPatternGenomeValidationResult,
  MultiTrackPatternGenomeVersionCoverage,
  MultiTrackPatternGenomeVersionId,
  MultiTrackPatternGenomeWorkspaceState,
} from "./MultiTrackPatternGenomeTypes";

export function getMultiTrackPatternGenomeReadinessLabel(
  status: MultiTrackPatternGenomeReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackPatternGenomeConfidenceLabel(
  bucket: MultiTrackPatternGenomeConfidenceBucket,
): string {
  if (bucket === "verified") return "Verified";
  if (bucket === "strong") return "Strong";
  if (bucket === "moderate") return "Moderate";
  if (bucket === "weak") return "Weak";
  if (bucket === "blocked") return "Blocked";
  return "Unknown";
}

export function getMultiTrackPatternGenomeRoleLabel(
  role: MultiTrackPatternGenomeIdeaRole,
): string {
  if (role === "hook") return "Hook";
  if (role === "riff") return "Riff";
  if (role === "verse-motif") return "Verse Motif";
  if (role === "chorus-motif") return "Chorus Motif";
  if (role === "bass-motion") return "Bass Motion";
  if (role === "drum-pocket") return "Drum Pocket";
  if (role === "vocal-phrase") return "Vocal Phrase";
  if (role === "counter-melody") return "Counter Melody";
  if (role === "transition") return "Transition";
  return "Unknown";
}

export function getMultiTrackPatternGenomeColorLabel(
  color: MultiTrackPatternGenomeColor,
): string {
  if (color === "white") return "White";
  if (color === "blue") return "Blue";
  if (color === "green") return "Green";
  if (color === "purple") return "Purple";
  if (color === "yellow") return "Yellow";
  if (color === "orange") return "Orange";
  if (color === "red") return "Red";
  return "Pink";
}

export function formatMultiTrackPatternGenomeSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatMultiTrackPatternGenomeRange(
  startSeconds: number,
  endSeconds: number,
): string {
  return `${formatMultiTrackPatternGenomeSeconds(
    startSeconds,
  )} - ${formatMultiTrackPatternGenomeSeconds(endSeconds)}`;
}

export function findMultiTrackPatternGenomeIdeaById(
  state: MultiTrackPatternGenomeWorkspaceState,
  ideaId: string,
): MultiTrackPatternGenomeIdea | null {
  return state.ideas.find((idea) => idea.id === ideaId) ?? null;
}

export function findMultiTrackPatternGenomeSourceByVersionId(
  sources: MultiTrackPatternGenomeSource[],
  versionId: MultiTrackPatternGenomeVersionId,
): MultiTrackPatternGenomeSource | null {
  return sources.find((source) => source.versionId === versionId) ?? null;
}

export function getMultiTrackPatternGenomeEvidenceForIdea(
  state: MultiTrackPatternGenomeWorkspaceState,
  idea: MultiTrackPatternGenomeIdea,
): MultiTrackPatternGenomeEvidence[] {
  return idea.evidenceIds
    .map((evidenceId) =>
      state.evidence.find((evidenceItem) => evidenceItem.id === evidenceId),
    )
    .filter((evidenceItem): evidenceItem is MultiTrackPatternGenomeEvidence =>
      Boolean(evidenceItem),
    );
}

export function getMultiTrackPatternGenomeActionsForIdea(
  state: MultiTrackPatternGenomeWorkspaceState,
  idea: MultiTrackPatternGenomeIdea,
): MultiTrackPatternGenomeAction[] {
  return idea.actionIds
    .map((actionId) =>
      state.actions.find((actionItem) => actionItem.id === actionId),
    )
    .filter((actionItem): actionItem is MultiTrackPatternGenomeAction =>
      Boolean(actionItem),
    );
}

export function getMultiTrackPatternGenomeRisksForIdea(
  state: MultiTrackPatternGenomeWorkspaceState,
  idea: MultiTrackPatternGenomeIdea,
): MultiTrackPatternGenomeRisk[] {
  return idea.riskIds
    .map((riskId) => state.risks.find((riskItem) => riskItem.id === riskId))
    .filter((riskItem): riskItem is MultiTrackPatternGenomeRisk =>
      Boolean(riskItem),
    );
}

export function getMultiTrackPatternGenomeComparisonsForIdea(
  state: MultiTrackPatternGenomeWorkspaceState,
  ideaId: string,
): MultiTrackPatternGenomeComparison[] {
  return state.comparisons.filter((comparison) => comparison.ideaId === ideaId);
}

export function buildMultiTrackPatternGenomeReviewPacket(
  state: MultiTrackPatternGenomeWorkspaceState,
  ideaId: string,
): MultiTrackPatternGenomeReviewPacket {
  const activeIdea = findMultiTrackPatternGenomeIdeaById(state, ideaId);

  if (!activeIdea) {
    return {
      activeIdea: null,
      activeEvidence: [],
      activeActions: [],
      activeRisks: [],
      activeComparisons: [],
      renderTargets: [],
    };
  }

  return {
    activeIdea,
    activeEvidence: getMultiTrackPatternGenomeEvidenceForIdea(state, activeIdea),
    activeActions: getMultiTrackPatternGenomeActionsForIdea(state, activeIdea),
    activeRisks: getMultiTrackPatternGenomeRisksForIdea(state, activeIdea),
    activeComparisons: getMultiTrackPatternGenomeComparisonsForIdea(
      state,
      activeIdea.id,
    ),
    renderTargets: state.renderTargets.filter(
      (target) => target.ideaId === activeIdea.id,
    ),
  };
}

export function buildMultiTrackPatternGenomeIdeaSummaries(
  state: MultiTrackPatternGenomeWorkspaceState,
): MultiTrackPatternGenomeIdeaSummary[] {
  return state.ideas.map((idea) => ({
    ideaId: idea.id,
    title: idea.title,
    role: idea.role,
    color: idea.color,
    matchedCount: idea.matchedVersionIds.length,
    confidenceBucket: idea.confidenceBucket,
    readinessStatus: idea.readinessStatus,
  }));
}

export function buildMultiTrackPatternGenomeVersionCoverage(
  state: MultiTrackPatternGenomeWorkspaceState,
): MultiTrackPatternGenomeVersionCoverage[] {
  return state.sources.map((source) => {
    const matchingIdeas = state.ideas.filter((idea) =>
      idea.matchedVersionIds.includes(source.versionId),
    );

    const matchingComparisons = state.comparisons.filter(
      (comparison) =>
        comparison.fromVersionId === source.versionId ||
        comparison.toVersionId === source.versionId,
    );

    const totalSimilarity = matchingComparisons.reduce(
      (sum, comparison) => sum + comparison.similarityPercent,
      0,
    );

    const averageSimilarityPercent =
      matchingComparisons.length > 0
        ? Math.round(totalSimilarity / matchingComparisons.length)
        : 0;

    const strongestIdea = [...matchingIdeas].sort((firstIdea, secondIdea) => {
      const firstScore = getMultiTrackPatternGenomeConfidenceScore(
        firstIdea.confidenceBucket,
      );
      const secondScore = getMultiTrackPatternGenomeConfidenceScore(
        secondIdea.confidenceBucket,
      );
      return secondScore - firstScore;
    })[0];

    return {
      versionId: source.versionId,
      sourceTitle: source.title,
      ideaCount: matchingIdeas.length,
      strongestIdeaTitle: strongestIdea?.title ?? "No idea matched yet",
      averageSimilarityPercent,
      readinessStatus:
        matchingIdeas.length > 0 ? source.readinessStatus : "needs-review",
    };
  });
}

export function getMultiTrackPatternGenomeConfidenceScore(
  bucket: MultiTrackPatternGenomeConfidenceBucket,
): number {
  if (bucket === "verified") return 100;
  if (bucket === "strong") return 85;
  if (bucket === "moderate") return 65;
  if (bucket === "weak") return 35;
  if (bucket === "blocked") return 0;
  return 10;
}

export function getMultiTrackPatternGenomeReadinessScore(
  status: MultiTrackPatternGenomeReadinessStatus,
): number {
  if (status === "ready") return 100;
  if (status === "needs-review") return 55;
  if (status === "future") return 25;
  return 0;
}

export function filterMultiTrackPatternGenomeIdeas(
  ideas: MultiTrackPatternGenomeIdea[],
  filter: MultiTrackPatternGenomeFilter,
): MultiTrackPatternGenomeIdea[] {
  const searchText = filter.searchText.trim().toLowerCase();

  return ideas.filter((idea) => {
    const matchesSearch =
      searchText.length === 0 ||
      idea.title.toLowerCase().includes(searchText) ||
      idea.summary.toLowerCase().includes(searchText);

    const matchesRole = filter.role === "all" || idea.role === filter.role;
    const matchesColor = filter.color === "all" || idea.color === filter.color;
    const matchesConfidence =
      filter.confidenceBucket === "all" ||
      idea.confidenceBucket === filter.confidenceBucket;
    const matchesReadiness =
      filter.readinessStatus === "all" ||
      idea.readinessStatus === filter.readinessStatus;

    return (
      matchesSearch &&
      matchesRole &&
      matchesColor &&
      matchesConfidence &&
      matchesReadiness
    );
  });
}

export function buildMultiTrackPatternGenomeBoard(
  state: MultiTrackPatternGenomeWorkspaceState,
): MultiTrackPatternGenomeBoard {
  return {
    columns: [
      {
        id: "column-ready",
        title: "Ready",
        detail: "Ideas safe to show or color-code.",
        ideaIds: state.ideas
          .filter((idea) => idea.readinessStatus === "ready")
          .map((idea) => idea.id),
        readinessStatus: "ready",
      },
      {
        id: "column-review",
        title: "Needs Review",
        detail: "Ideas that need user or analyzer confirmation.",
        ideaIds: state.ideas
          .filter((idea) => idea.readinessStatus === "needs-review")
          .map((idea) => idea.id),
        readinessStatus: "needs-review",
      },
      {
        id: "column-future",
        title: "Future",
        detail: "Ideas waiting for future engine work.",
        ideaIds: state.ideas
          .filter((idea) => idea.readinessStatus === "future")
          .map((idea) => idea.id),
        readinessStatus: "future",
      },
      {
        id: "column-blocked",
        title: "Blocked",
        detail: "Ideas that should not move forward yet.",
        ideaIds: state.ideas
          .filter((idea) => idea.readinessStatus === "blocked")
          .map((idea) => idea.id),
        readinessStatus: "blocked",
      },
    ],
  };
}

export function validateMultiTrackPatternGenomeState(
  state: MultiTrackPatternGenomeWorkspaceState,
): MultiTrackPatternGenomeValidationResult {
  const messages: string[] = [];
  const sourceIds = new Set(state.sources.map((source) => source.id));
  const ideaIds = new Set(state.ideas.map((idea) => idea.id));
  const evidenceIds = new Set(state.evidence.map((evidence) => evidence.id));
  const actionIds = new Set(state.actions.map((action) => action.id));
  const riskIds = new Set(state.risks.map((risk) => risk.id));

  state.evidence.forEach((evidenceItem) => {
    if (!sourceIds.has(evidenceItem.sourceId)) {
      messages.push(`Missing source for evidence: ${evidenceItem.id}`);
    }
  });

  state.ideas.forEach((idea) => {
    idea.evidenceIds.forEach((evidenceId) => {
      if (!evidenceIds.has(evidenceId)) {
        messages.push(`Missing evidence ${evidenceId} for idea ${idea.id}`);
      }
    });

    idea.actionIds.forEach((actionId) => {
      if (!actionIds.has(actionId)) {
        messages.push(`Missing action ${actionId} for idea ${idea.id}`);
      }
    });

    idea.riskIds.forEach((riskId) => {
      if (!riskIds.has(riskId)) {
        messages.push(`Missing risk ${riskId} for idea ${idea.id}`);
      }
    });
  });

  state.actions.forEach((action) => {
    if (!ideaIds.has(action.targetIdeaId)) {
      messages.push(`Missing target idea for action: ${action.id}`);
    }
  });

  const readyCount = state.ideas.filter(
    (idea) => idea.readinessStatus === "ready",
  ).length;

  const reviewCount = state.ideas.filter(
    (idea) => idea.readinessStatus === "needs-review",
  ).length;

  const blockedCount = state.ideas.filter(
    (idea) => idea.readinessStatus === "blocked",
  ).length;

  return {
    isValid: messages.length === 0,
    readyCount,
    reviewCount,
    blockedCount,
    messages,
  };
}