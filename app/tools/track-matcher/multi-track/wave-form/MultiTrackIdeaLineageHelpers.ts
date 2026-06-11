import type {
  MultiTrackIdeaLineageBranch,
  MultiTrackIdeaLineageBranchSummary,
  MultiTrackIdeaLineageConfidenceBucket,
  MultiTrackIdeaLineageIdeaKind,
  MultiTrackIdeaLineageMutationKind,
  MultiTrackIdeaLineageNode,
  MultiTrackIdeaLineageNodeSummary,
  MultiTrackIdeaLineageReadinessStatus,
  MultiTrackIdeaLineageReviewPacket,
  MultiTrackIdeaLineageRisk,
  MultiTrackIdeaLineageScore,
  MultiTrackIdeaLineageValidationResult,
  MultiTrackIdeaLineageWorkspaceState,
} from "./MultiTrackIdeaLineageTypes";

export function getMultiTrackIdeaLineageReadinessLabel(
  status: MultiTrackIdeaLineageReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackIdeaLineageConfidenceLabel(
  bucket: MultiTrackIdeaLineageConfidenceBucket,
): string {
  if (bucket === "verified") return "Verified";
  if (bucket === "strong") return "Strong";
  if (bucket === "moderate") return "Moderate";
  if (bucket === "weak") return "Weak";
  if (bucket === "blocked") return "Blocked";
  return "Unknown";
}

export function getMultiTrackIdeaLineageKindLabel(
  kind: MultiTrackIdeaLineageIdeaKind,
): string {
  if (kind === "hook") return "Hook";
  if (kind === "riff") return "Riff";
  if (kind === "melody") return "Melody";
  if (kind === "bass-motion") return "Bass Motion";
  if (kind === "drum-pocket") return "Drum Pocket";
  if (kind === "vocal-phrase") return "Vocal Phrase";
  if (kind === "section-shape") return "Section Shape";
  return "Hybrid";
}

export function getMultiTrackIdeaLineageMutationLabel(
  mutation: MultiTrackIdeaLineageMutationKind,
): string {
  if (mutation === "preserved") return "Preserved";
  if (mutation === "expanded") return "Expanded";
  if (mutation === "simplified") return "Simplified";
  if (mutation === "tempo-shifted") return "Tempo Shifted";
  if (mutation === "key-shifted") return "Key Shifted";
  if (mutation === "rhythm-shifted") return "Rhythm Shifted";
  if (mutation === "lyric-shifted") return "Lyric Shifted";
  if (mutation === "instrument-shifted") return "Instrument Shifted";
  if (mutation === "weakened") return "Weakened";
  return "Lost";
}

export function formatMultiTrackIdeaLineageSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatMultiTrackIdeaLineageRange(
  startSeconds: number,
  endSeconds: number,
): string {
  return `${formatMultiTrackIdeaLineageSeconds(
    startSeconds,
  )} - ${formatMultiTrackIdeaLineageSeconds(endSeconds)}`;
}

export function findMultiTrackIdeaLineageNodeById(
  state: MultiTrackIdeaLineageWorkspaceState,
  nodeId: string,
): MultiTrackIdeaLineageNode | null {
  return state.nodes.find((node) => node.id === nodeId) ?? null;
}

export function findMultiTrackIdeaLineageBranchById(
  state: MultiTrackIdeaLineageWorkspaceState,
  branchId: string,
): MultiTrackIdeaLineageBranch | null {
  return state.branches.find((branch) => branch.id === branchId) ?? null;
}

export function getMultiTrackIdeaLineageScoresForNode(
  state: MultiTrackIdeaLineageWorkspaceState,
  nodeId: string,
): MultiTrackIdeaLineageScore[] {
  return state.scores.filter((score) => score.nodeId === nodeId);
}

export function getMultiTrackIdeaLineageRisksForBranch(
  state: MultiTrackIdeaLineageWorkspaceState,
  branch: MultiTrackIdeaLineageBranch,
): MultiTrackIdeaLineageRisk[] {
  return branch.riskIds
    .map((riskId) => state.risks.find((risk) => risk.id === riskId))
    .filter((risk): risk is MultiTrackIdeaLineageRisk => Boolean(risk));
}

export function getMultiTrackIdeaLineageAverageScore(
  scores: MultiTrackIdeaLineageScore[],
): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, score) => sum + score.value, 0);
  return Math.round(total / scores.length);
}

export function buildMultiTrackIdeaLineageNodeSummaries(
  state: MultiTrackIdeaLineageWorkspaceState,
): MultiTrackIdeaLineageNodeSummary[] {
  return state.nodes.map((node) => ({
    nodeId: node.id,
    title: node.title,
    versionId: node.versionId,
    ideaKind: node.ideaKind,
    mutationKind: node.mutationKind,
    averageScore: getMultiTrackIdeaLineageAverageScore(
      getMultiTrackIdeaLineageScoresForNode(state, node.id),
    ),
    confidenceBucket: node.confidenceBucket,
    readinessStatus: node.readinessStatus,
  }));
}

export function buildMultiTrackIdeaLineageBranchSummaries(
  state: MultiTrackIdeaLineageWorkspaceState,
): MultiTrackIdeaLineageBranchSummary[] {
  return state.branches.map((branch) => {
    const rootNode = findMultiTrackIdeaLineageNodeById(
      state,
      branch.rootNodeId,
    );
    const survivorNode = branch.survivorNodeId
      ? findMultiTrackIdeaLineageNodeById(state, branch.survivorNodeId)
      : null;

    return {
      branchId: branch.id,
      title: branch.title,
      rootTitle: rootNode?.title ?? "Missing root",
      survivorTitle: survivorNode?.title ?? "No survivor selected",
      nodeCount: branch.nodeIds.length,
      color: branch.color,
      readinessStatus: branch.readinessStatus,
    };
  });
}

export function buildMultiTrackIdeaLineageReviewPacket(
  state: MultiTrackIdeaLineageWorkspaceState,
  branchId: string,
  nodeId: string,
): MultiTrackIdeaLineageReviewPacket {
  const activeBranch = findMultiTrackIdeaLineageBranchById(state, branchId);
  const activeNode = findMultiTrackIdeaLineageNodeById(state, nodeId);
  const branchNodes = activeBranch
    ? activeBranch.nodeIds
        .map((branchNodeId) =>
          findMultiTrackIdeaLineageNodeById(state, branchNodeId),
        )
        .filter((node): node is MultiTrackIdeaLineageNode => Boolean(node))
    : [];

  return {
    activeBranch,
    activeNode,
    branchNodes,
    scores: activeNode
      ? getMultiTrackIdeaLineageScoresForNode(state, activeNode.id)
      : [],
    risks: activeBranch
      ? getMultiTrackIdeaLineageRisksForBranch(state, activeBranch)
      : [],
  };
}

export function validateMultiTrackIdeaLineageState(
  state: MultiTrackIdeaLineageWorkspaceState,
): MultiTrackIdeaLineageValidationResult {
  const messages: string[] = [];
  const nodeIds = new Set(state.nodes.map((node) => node.id));
  const riskIds = new Set(state.risks.map((risk) => risk.id));
  const branchIds = new Set(state.branches.map((branch) => branch.id));

  state.nodes.forEach((node) => {
    if (node.parentNodeId && !nodeIds.has(node.parentNodeId)) {
      messages.push(`Missing parent node for ${node.id}`);
    }

    node.childNodeIds.forEach((childNodeId) => {
      if (!nodeIds.has(childNodeId)) {
        messages.push(`Missing child node ${childNodeId} for ${node.id}`);
      }
    });
  });

  state.scores.forEach((score) => {
    if (!nodeIds.has(score.nodeId)) {
      messages.push(`Missing node for score ${score.id}`);
    }
  });

  state.branches.forEach((branch) => {
    if (!nodeIds.has(branch.rootNodeId)) {
      messages.push(`Missing root node for branch ${branch.id}`);
    }

    if (branch.survivorNodeId && !nodeIds.has(branch.survivorNodeId)) {
      messages.push(`Missing survivor node for branch ${branch.id}`);
    }

    branch.nodeIds.forEach((nodeId) => {
      if (!nodeIds.has(nodeId)) {
        messages.push(`Missing node ${nodeId} for branch ${branch.id}`);
      }
    });

    branch.riskIds.forEach((riskId) => {
      if (!riskIds.has(riskId)) {
        messages.push(`Missing risk ${riskId} for branch ${branch.id}`);
      }
    });
  });

  state.lanes.forEach((lane) => {
    lane.branchIds.forEach((branchId) => {
      if (!branchIds.has(branchId)) {
        messages.push(`Missing branch ${branchId} for lane ${lane.id}`);
      }
    });
  });

  const readyCount = state.nodes.filter(
    (node) => node.readinessStatus === "ready",
  ).length;

  const reviewCount = state.nodes.filter(
    (node) => node.readinessStatus === "needs-review",
  ).length;

  const futureCount = state.nodes.filter(
    (node) => node.readinessStatus === "future",
  ).length;

  const blockedCount = state.nodes.filter(
    (node) => node.readinessStatus === "blocked",
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