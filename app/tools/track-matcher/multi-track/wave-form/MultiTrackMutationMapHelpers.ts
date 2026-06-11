import type {
  MultiTrackMutationMapConfidenceBucket,
  MultiTrackMutationMapIdeaKind,
  MultiTrackMutationMapMutationKind,
  MultiTrackMutationMapPath,
  MultiTrackMutationMapPathSummary,
  MultiTrackMutationMapPoint,
  MultiTrackMutationMapPointSummary,
  MultiTrackMutationMapReadinessStatus,
  MultiTrackMutationMapReviewPacket,
  MultiTrackMutationMapRisk,
  MultiTrackMutationMapSignal,
  MultiTrackMutationMapValidationResult,
  MultiTrackMutationMapWorkspaceState,
} from "./MultiTrackMutationMapTypes";

export function getMultiTrackMutationMapReadinessLabel(
  status: MultiTrackMutationMapReadinessStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackMutationMapConfidenceLabel(
  bucket: MultiTrackMutationMapConfidenceBucket,
): string {
  if (bucket === "verified") return "Verified";
  if (bucket === "strong") return "Strong";
  if (bucket === "moderate") return "Moderate";
  if (bucket === "weak") return "Weak";
  if (bucket === "blocked") return "Blocked";
  return "Unknown";
}

export function getMultiTrackMutationMapIdeaKindLabel(
  kind: MultiTrackMutationMapIdeaKind,
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

export function getMultiTrackMutationMapMutationLabel(
  mutation: MultiTrackMutationMapMutationKind,
): string {
  if (mutation === "preserved") return "Preserved";
  if (mutation === "expanded") return "Expanded";
  if (mutation === "simplified") return "Simplified";
  if (mutation === "tempo-shifted") return "Tempo Shifted";
  if (mutation === "key-shifted") return "Key Shifted";
  if (mutation === "rhythm-shifted") return "Rhythm Shifted";
  if (mutation === "melody-shifted") return "Melody Shifted";
  if (mutation === "lyric-shifted") return "Lyric Shifted";
  if (mutation === "instrument-shifted") return "Instrument Shifted";
  if (mutation === "energy-shifted") return "Energy Shifted";
  if (mutation === "weakened") return "Weakened";
  return "Lost";
}

export function formatMultiTrackMutationMapSeconds(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatMultiTrackMutationMapRange(
  startSeconds: number,
  endSeconds: number,
): string {
  return `${formatMultiTrackMutationMapSeconds(
    startSeconds,
  )} - ${formatMultiTrackMutationMapSeconds(endSeconds)}`;
}

export function findMultiTrackMutationMapPointById(
  state: MultiTrackMutationMapWorkspaceState,
  pointId: string,
): MultiTrackMutationMapPoint | null {
  return state.points.find((point) => point.id === pointId) ?? null;
}

export function findMultiTrackMutationMapPathById(
  state: MultiTrackMutationMapWorkspaceState,
  pathId: string,
): MultiTrackMutationMapPath | null {
  return state.paths.find((path) => path.id === pathId) ?? null;
}

export function getMultiTrackMutationMapSignalsForPoint(
  state: MultiTrackMutationMapWorkspaceState,
  pointId: string,
): MultiTrackMutationMapSignal[] {
  return state.signals.filter((signal) => signal.pointId === pointId);
}

export function getMultiTrackMutationMapRisksForPath(
  state: MultiTrackMutationMapWorkspaceState,
  path: MultiTrackMutationMapPath,
): MultiTrackMutationMapRisk[] {
  return path.riskIds
    .map((riskId) => state.risks.find((risk) => risk.id === riskId))
    .filter((risk): risk is MultiTrackMutationMapRisk => Boolean(risk));
}

export function buildMultiTrackMutationMapPointSummaries(
  state: MultiTrackMutationMapWorkspaceState,
): MultiTrackMutationMapPointSummary[] {
  return state.points.map((point) => ({
    pointId: point.id,
    title: point.title,
    versionId: point.versionId,
    mutationKind: point.mutationKind,
    mutationStrength: point.mutationStrength,
    keeperScore: point.keeperScore,
    confidenceBucket: point.confidenceBucket,
    readinessStatus: point.readinessStatus,
  }));
}

export function buildMultiTrackMutationMapPathSummaries(
  state: MultiTrackMutationMapWorkspaceState,
): MultiTrackMutationMapPathSummary[] {
  return state.paths.map((path) => {
    const strongestPoint = path.strongestPointId
      ? findMultiTrackMutationMapPointById(state, path.strongestPointId)
      : null;

    return {
      pathId: path.id,
      title: path.title,
      pointCount: path.pointIds.length,
      strongestPointTitle: strongestPoint?.title ?? "No strongest point yet",
      color: path.color,
      readinessStatus: path.readinessStatus,
    };
  });
}

export function buildMultiTrackMutationMapReviewPacket(
  state: MultiTrackMutationMapWorkspaceState,
  pathId: string,
  pointId: string,
): MultiTrackMutationMapReviewPacket {
  const activePath = findMultiTrackMutationMapPathById(state, pathId);
  const activePoint = findMultiTrackMutationMapPointById(state, pointId);
  const pathPoints = activePath
    ? activePath.pointIds
        .map((pathPointId) =>
          findMultiTrackMutationMapPointById(state, pathPointId),
        )
        .filter((point): point is MultiTrackMutationMapPoint => Boolean(point))
    : [];

  return {
    activePath,
    activePoint,
    pathPoints,
    signals: activePoint
      ? getMultiTrackMutationMapSignalsForPoint(state, activePoint.id)
      : [],
    risks: activePath ? getMultiTrackMutationMapRisksForPath(state, activePath) : [],
  };
}

export function validateMultiTrackMutationMapState(
  state: MultiTrackMutationMapWorkspaceState,
): MultiTrackMutationMapValidationResult {
  const messages: string[] = [];
  const pointIds = new Set(state.points.map((point) => point.id));
  const riskIds = new Set(state.risks.map((risk) => risk.id));
  const pathIds = new Set(state.paths.map((path) => path.id));

  state.points.forEach((point) => {
    if (point.parentPointId && !pointIds.has(point.parentPointId)) {
      messages.push(`Missing parent point for ${point.id}`);
    }
  });

  state.signals.forEach((signal) => {
    if (!pointIds.has(signal.pointId)) {
      messages.push(`Missing point for signal ${signal.id}`);
    }
  });

  state.paths.forEach((path) => {
    path.pointIds.forEach((pointId) => {
      if (!pointIds.has(pointId)) {
        messages.push(`Missing point ${pointId} for path ${path.id}`);
      }
    });

    if (path.strongestPointId && !pointIds.has(path.strongestPointId)) {
      messages.push(`Missing strongest point for path ${path.id}`);
    }

    path.riskIds.forEach((riskId) => {
      if (!riskIds.has(riskId)) {
        messages.push(`Missing risk ${riskId} for path ${path.id}`);
      }
    });
  });

  state.lanes.forEach((lane) => {
    lane.pathIds.forEach((pathId) => {
      if (!pathIds.has(pathId)) {
        messages.push(`Missing path ${pathId} for lane ${lane.id}`);
      }
    });
  });

  const readyCount = state.points.filter(
    (point) => point.readinessStatus === "ready",
  ).length;

  const reviewCount = state.points.filter(
    (point) => point.readinessStatus === "needs-review",
  ).length;

  const futureCount = state.points.filter(
    (point) => point.readinessStatus === "future",
  ).length;

  const blockedCount = state.points.filter(
    (point) => point.readinessStatus === "blocked",
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