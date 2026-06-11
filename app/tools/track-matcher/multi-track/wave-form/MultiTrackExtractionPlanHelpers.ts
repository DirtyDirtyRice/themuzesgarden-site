import type {
  MultiTrackExtractionPlanConfidenceBucket,
  MultiTrackExtractionPlanEditInstruction,
  MultiTrackExtractionPlanFilter,
  MultiTrackExtractionPlanMarker,
  MultiTrackExtractionPlanReadinessStatus,
  MultiTrackExtractionPlanRenderInstruction,
  MultiTrackExtractionPlanReviewPacket,
  MultiTrackExtractionPlanRisk,
  MultiTrackExtractionPlanSourceClip,
  MultiTrackExtractionPlanStep,
  MultiTrackExtractionPlanTarget,
  MultiTrackExtractionPlanTargetKind,
  MultiTrackExtractionPlanTargetSummary,
  MultiTrackExtractionPlanValidationResult,
  MultiTrackExtractionPlanVersionCoverage,
  MultiTrackExtractionPlanVersionId,
  MultiTrackExtractionPlanWorkspaceState,
} from "./MultiTrackExtractionPlanTypes";

export function getMultiTrackExtractionPlanReadinessLabel(
  status: MultiTrackExtractionPlanReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackExtractionPlanConfidenceLabel(
  bucket: MultiTrackExtractionPlanConfidenceBucket,
): string {
  if (bucket === "verified") return "Verified";
  if (bucket === "strong") return "Strong";
  if (bucket === "moderate") return "Moderate";
  if (bucket === "weak") return "Weak";
  if (bucket === "blocked") return "Blocked";
  return "Unknown";
}

export function getMultiTrackExtractionPlanTargetKindLabel(
  kind: MultiTrackExtractionPlanTargetKind,
): string {
  if (kind === "hook") return "Hook";
  if (kind === "riff") return "Riff";
  if (kind === "vocal-phrase") return "Vocal Phrase";
  if (kind === "bass-groove") return "Bass Groove";
  if (kind === "drum-pocket") return "Drum Pocket";
  if (kind === "melody") return "Melody";
  if (kind === "transition") return "Transition";
  return "Hybrid Section";
}

export function formatMultiTrackExtractionPlanSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatMultiTrackExtractionPlanRange(
  startSeconds: number,
  endSeconds: number,
): string {
  return `${formatMultiTrackExtractionPlanSeconds(
    startSeconds,
  )} - ${formatMultiTrackExtractionPlanSeconds(endSeconds)}`;
}

export function findMultiTrackExtractionPlanTargetById(
  state: MultiTrackExtractionPlanWorkspaceState,
  targetId: string,
): MultiTrackExtractionPlanTarget | null {
  return state.targets.find((target) => target.id === targetId) ?? null;
}

export function findMultiTrackExtractionPlanSourceClipById(
  state: MultiTrackExtractionPlanWorkspaceState,
  sourceClipId: string,
): MultiTrackExtractionPlanSourceClip | null {
  return state.sourceClips.find((clip) => clip.id === sourceClipId) ?? null;
}

export function getMultiTrackExtractionPlanSourceClipsForTarget(
  state: MultiTrackExtractionPlanWorkspaceState,
  target: MultiTrackExtractionPlanTarget,
): MultiTrackExtractionPlanSourceClip[] {
  return target.sourceClipIds
    .map((clipId) => findMultiTrackExtractionPlanSourceClipById(state, clipId))
    .filter((clip): clip is MultiTrackExtractionPlanSourceClip =>
      Boolean(clip),
    );
}

export function getMultiTrackExtractionPlanMarkersForTarget(
  state: MultiTrackExtractionPlanWorkspaceState,
  target: MultiTrackExtractionPlanTarget,
): MultiTrackExtractionPlanMarker[] {
  return target.markerIds
    .map((markerId) =>
      state.markers.find((markerItem) => markerItem.id === markerId),
    )
    .filter((marker): marker is MultiTrackExtractionPlanMarker =>
      Boolean(marker),
    );
}

export function getMultiTrackExtractionPlanStepsForTarget(
  state: MultiTrackExtractionPlanWorkspaceState,
  target: MultiTrackExtractionPlanTarget,
): MultiTrackExtractionPlanStep[] {
  return target.stepIds
    .map((stepId) => state.steps.find((stepItem) => stepItem.id === stepId))
    .filter((step): step is MultiTrackExtractionPlanStep => Boolean(step))
    .sort((firstStep, secondStep) => firstStep.stepNumber - secondStep.stepNumber);
}

export function getMultiTrackExtractionPlanEditInstructionsForTarget(
  state: MultiTrackExtractionPlanWorkspaceState,
  target: MultiTrackExtractionPlanTarget,
): MultiTrackExtractionPlanEditInstruction[] {
  return target.editInstructionIds
    .map((instructionId) =>
      state.editInstructions.find(
        (instruction) => instruction.id === instructionId,
      ),
    )
    .filter(
      (
        instruction,
      ): instruction is MultiTrackExtractionPlanEditInstruction =>
        Boolean(instruction),
    );
}

export function getMultiTrackExtractionPlanRenderInstructionsForTarget(
  state: MultiTrackExtractionPlanWorkspaceState,
  target: MultiTrackExtractionPlanTarget,
): MultiTrackExtractionPlanRenderInstruction[] {
  return target.renderInstructionIds
    .map((instructionId) =>
      state.renderInstructions.find(
        (instruction) => instruction.id === instructionId,
      ),
    )
    .filter(
      (
        instruction,
      ): instruction is MultiTrackExtractionPlanRenderInstruction =>
        Boolean(instruction),
    );
}

export function getMultiTrackExtractionPlanRisksForTarget(
  state: MultiTrackExtractionPlanWorkspaceState,
  target: MultiTrackExtractionPlanTarget,
): MultiTrackExtractionPlanRisk[] {
  return target.riskIds
    .map((riskId) => state.risks.find((riskItem) => riskItem.id === riskId))
    .filter((risk): risk is MultiTrackExtractionPlanRisk => Boolean(risk));
}

export function buildMultiTrackExtractionPlanReviewPacket(
  state: MultiTrackExtractionPlanWorkspaceState,
  targetId: string,
): MultiTrackExtractionPlanReviewPacket {
  const activeTarget = findMultiTrackExtractionPlanTargetById(state, targetId);

  if (!activeTarget) {
    return {
      activeTarget: null,
      sourceClips: [],
      markers: [],
      steps: [],
      editInstructions: [],
      renderInstructions: [],
      risks: [],
    };
  }

  return {
    activeTarget,
    sourceClips: getMultiTrackExtractionPlanSourceClipsForTarget(
      state,
      activeTarget,
    ),
    markers: getMultiTrackExtractionPlanMarkersForTarget(state, activeTarget),
    steps: getMultiTrackExtractionPlanStepsForTarget(state, activeTarget),
    editInstructions: getMultiTrackExtractionPlanEditInstructionsForTarget(
      state,
      activeTarget,
    ),
    renderInstructions: getMultiTrackExtractionPlanRenderInstructionsForTarget(
      state,
      activeTarget,
    ),
    risks: getMultiTrackExtractionPlanRisksForTarget(state, activeTarget),
  };
}

export function buildMultiTrackExtractionPlanTargetSummaries(
  state: MultiTrackExtractionPlanWorkspaceState,
): MultiTrackExtractionPlanTargetSummary[] {
  return state.targets.map((target) => ({
    targetId: target.id,
    title: target.title,
    targetKind: target.targetKind,
    color: target.color,
    clipCount: target.sourceClipIds.length,
    stepCount: target.stepIds.length,
    confidenceBucket: target.confidenceBucket,
    readinessStatus: target.readinessStatus,
  }));
}

export function buildMultiTrackExtractionPlanVersionCoverage(
  state: MultiTrackExtractionPlanWorkspaceState,
): MultiTrackExtractionPlanVersionCoverage[] {
  const versionIds: MultiTrackExtractionPlanVersionId[] = [
    "version-01",
    "version-02",
    "version-03",
    "version-04",
    "version-05",
    "version-06",
    "version-07",
    "version-08",
    "version-09",
    "version-10",
  ];

  return versionIds.map((versionId) => {
    const clips = state.sourceClips.filter((clip) => clip.versionId === versionId);
    const clipIds = new Set(clips.map((clip) => clip.id));
    const markers = state.markers.filter((marker) =>
      clipIds.has(marker.sourceClipId),
    );
    const targets = state.targets.filter((target) =>
      target.sourceClipIds.some((clipId) => clipIds.has(clipId)),
    );

    const strongestTarget =
      [...targets].sort(
        (firstTarget, secondTarget) =>
          getMultiTrackExtractionPlanConfidenceScore(
            secondTarget.confidenceBucket,
          ) -
          getMultiTrackExtractionPlanConfidenceScore(firstTarget.confidenceBucket),
      )[0] ?? null;

    return {
      versionId,
      clipCount: clips.length,
      markerCount: markers.length,
      strongestTargetTitle: strongestTarget?.title ?? "No extraction target yet",
      readinessStatus:
        strongestTarget?.readinessStatus ??
        (clips.length > 0 ? "needs-review" : "future"),
    };
  });
}

export function getMultiTrackExtractionPlanConfidenceScore(
  bucket: MultiTrackExtractionPlanConfidenceBucket,
): number {
  if (bucket === "verified") return 100;
  if (bucket === "strong") return 85;
  if (bucket === "moderate") return 65;
  if (bucket === "weak") return 35;
  if (bucket === "blocked") return 0;
  return 10;
}

export function filterMultiTrackExtractionPlanTargets(
  targets: MultiTrackExtractionPlanTarget[],
  filter: MultiTrackExtractionPlanFilter,
): MultiTrackExtractionPlanTarget[] {
  const searchText = filter.searchText.trim().toLowerCase();

  return targets.filter((target) => {
    const matchesSearch =
      searchText.length === 0 ||
      target.title.toLowerCase().includes(searchText) ||
      target.summary.toLowerCase().includes(searchText);

    const matchesKind =
      filter.targetKind === "all" || target.targetKind === filter.targetKind;

    const matchesColor =
      filter.color === "all" || target.color === filter.color;

    const matchesConfidence =
      filter.confidenceBucket === "all" ||
      target.confidenceBucket === filter.confidenceBucket;

    const matchesReadiness =
      filter.readinessStatus === "all" ||
      target.readinessStatus === filter.readinessStatus;

    return (
      matchesSearch &&
      matchesKind &&
      matchesColor &&
      matchesConfidence &&
      matchesReadiness
    );
  });
}

export function validateMultiTrackExtractionPlanState(
  state: MultiTrackExtractionPlanWorkspaceState,
): MultiTrackExtractionPlanValidationResult {
  const messages: string[] = [];
  const sourceClipIds = new Set(state.sourceClips.map((clip) => clip.id));
  const markerIds = new Set(state.markers.map((marker) => marker.id));
  const stepIds = new Set(state.steps.map((step) => step.id));
  const editInstructionIds = new Set(
    state.editInstructions.map((instruction) => instruction.id),
  );
  const renderInstructionIds = new Set(
    state.renderInstructions.map((instruction) => instruction.id),
  );
  const riskIds = new Set(state.risks.map((risk) => risk.id));
  const targetIds = new Set(state.targets.map((target) => target.id));

  state.markers.forEach((marker) => {
    if (!sourceClipIds.has(marker.sourceClipId)) {
      messages.push(`Missing source clip for marker ${marker.id}`);
    }
  });

  state.steps.forEach((step) => {
    if (!sourceClipIds.has(step.targetClipId)) {
      messages.push(`Missing target clip for step ${step.id}`);
    }

    if (step.markerId && !markerIds.has(step.markerId)) {
      messages.push(`Missing marker for step ${step.id}`);
    }
  });

  state.editInstructions.forEach((instruction) => {
    if (!sourceClipIds.has(instruction.sourceClipId)) {
      messages.push(`Missing source clip for edit instruction ${instruction.id}`);
    }
  });

  state.renderInstructions.forEach((instruction) => {
    if (!sourceClipIds.has(instruction.sourceClipId)) {
      messages.push(
        `Missing source clip for render instruction ${instruction.id}`,
      );
    }
  });

  state.targets.forEach((target) => {
    target.sourceClipIds.forEach((clipId) => {
      if (!sourceClipIds.has(clipId)) {
        messages.push(`Missing clip ${clipId} for target ${target.id}`);
      }
    });

    target.markerIds.forEach((markerId) => {
      if (!markerIds.has(markerId)) {
        messages.push(`Missing marker ${markerId} for target ${target.id}`);
      }
    });

    target.stepIds.forEach((stepId) => {
      if (!stepIds.has(stepId)) {
        messages.push(`Missing step ${stepId} for target ${target.id}`);
      }
    });

    target.editInstructionIds.forEach((instructionId) => {
      if (!editInstructionIds.has(instructionId)) {
        messages.push(
          `Missing edit instruction ${instructionId} for target ${target.id}`,
        );
      }
    });

    target.renderInstructionIds.forEach((instructionId) => {
      if (!renderInstructionIds.has(instructionId)) {
        messages.push(
          `Missing render instruction ${instructionId} for target ${target.id}`,
        );
      }
    });

    target.riskIds.forEach((riskId) => {
      if (!riskIds.has(riskId)) {
        messages.push(`Missing risk ${riskId} for target ${target.id}`);
      }
    });
  });

  state.lanes.forEach((lane) => {
    lane.targetIds.forEach((targetId) => {
      if (!targetIds.has(targetId)) {
        messages.push(`Missing target ${targetId} for lane ${lane.id}`);
      }
    });
  });

  const readyCount = state.targets.filter(
    (target) => target.readinessStatus === "ready",
  ).length;

  const reviewCount = state.targets.filter(
    (target) => target.readinessStatus === "needs-review",
  ).length;

  const futureCount = state.targets.filter(
    (target) => target.readinessStatus === "future",
  ).length;

  const blockedCount = state.targets.filter(
    (target) => target.readinessStatus === "blocked",
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