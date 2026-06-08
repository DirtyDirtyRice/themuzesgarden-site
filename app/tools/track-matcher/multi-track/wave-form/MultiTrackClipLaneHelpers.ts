import type {
  MultiTrackClipLane,
  MultiTrackClipLaneClip,
  MultiTrackClipLaneDuplicatePlan,
  MultiTrackClipLaneEditTarget,
  MultiTrackClipLaneMetrics,
  MultiTrackClipLaneRenderPlan,
  MultiTrackClipLaneRenderStatus,
  MultiTrackClipLaneSelection,
  MultiTrackClipLaneStatus,
  MultiTrackClipLaneWorkspaceState,
} from "./MultiTrackClipLaneTypes";

export function getMultiTrackClipLaneStatusLabel(
  status: MultiTrackClipLaneStatus,
): string {
  if (status === "ready") return "Ready";
  if (status === "needs-review") return "Needs Review";
  if (status === "empty") return "Empty";
  if (status === "editing") return "Editing";
  if (status === "experiment") return "Experiment";
  if (status === "blocked") return "Blocked";
  return "Future";
}

export function getMultiTrackClipLaneRenderStatusLabel(
  status: MultiTrackClipLaneRenderStatus,
): string {
  if (status === "not-ready") return "Not Ready";
  if (status === "preview-ready") return "Preview Ready";
  if (status === "render-ready") return "Render Ready";
  if (status === "keeper") return "Keeper";
  if (status === "rejected") return "Rejected";
  return "Future";
}

export function getMultiTrackClipLaneEditTargetLabel(
  target: MultiTrackClipLaneEditTarget,
): string {
  if (target === "trim-start") return "Trim Start";
  if (target === "trim-end") return "Trim End";
  if (target === "nudge") return "Nudge";
  if (target === "gain") return "Gain";
  if (target === "mute") return "Mute";
  if (target === "solo") return "Solo";
  if (target === "pitch") return "Pitch";
  if (target === "stretch") return "Stretch";
  if (target === "reverse-future") return "Reverse Future";
  if (target === "filter-future") return "Filter Future";
  return "Texture Future";
}

export function getAllMultiTrackClipLaneClips(
  lanes: MultiTrackClipLane[],
): MultiTrackClipLaneClip[] {
  return lanes.flatMap((lane) => lane.clips);
}

export function getSelectedMultiTrackClipLaneClips(
  lanes: MultiTrackClipLane[],
): MultiTrackClipLaneClip[] {
  return getAllMultiTrackClipLaneClips(lanes).filter((clip) => clip.selected);
}

export function getReadyMultiTrackClipLaneClips(
  lanes: MultiTrackClipLane[],
): MultiTrackClipLaneClip[] {
  return getAllMultiTrackClipLaneClips(lanes).filter(
    (clip) => clip.status === "ready" || clip.status === "experiment",
  );
}

export function getReviewMultiTrackClipLaneClips(
  lanes: MultiTrackClipLane[],
): MultiTrackClipLaneClip[] {
  return getAllMultiTrackClipLaneClips(lanes).filter(
    (clip) => clip.status === "needs-review",
  );
}

export function getRenderReadyMultiTrackClipLaneClips(
  lanes: MultiTrackClipLane[],
): MultiTrackClipLaneClip[] {
  return getAllMultiTrackClipLaneClips(lanes).filter(
    (clip) =>
      clip.renderStatus === "preview-ready" ||
      clip.renderStatus === "render-ready" ||
      clip.renderStatus === "keeper",
  );
}

export function getKeeperMultiTrackClipLaneClips(
  lanes: MultiTrackClipLane[],
): MultiTrackClipLaneClip[] {
  return getAllMultiTrackClipLaneClips(lanes).filter(
    (clip) => clip.renderStatus === "keeper",
  );
}

export function getMultiTrackClipLaneMetrics(
  state: MultiTrackClipLaneWorkspaceState,
): MultiTrackClipLaneMetrics {
  const clips = getAllMultiTrackClipLaneClips(state.lanes);

  return {
    laneCount: state.lanes.length,
    clipCount: clips.length,
    selectedClipCount: clips.filter((clip) => clip.selected).length,
    readyClipCount: getReadyMultiTrackClipLaneClips(state.lanes).length,
    reviewClipCount: getReviewMultiTrackClipLaneClips(state.lanes).length,
    experimentClipCount: clips.filter((clip) => clip.status === "experiment").length,
    renderReadyClipCount: getRenderReadyMultiTrackClipLaneClips(state.lanes).length,
    keeperClipCount: getKeeperMultiTrackClipLaneClips(state.lanes).length,
  };
}

export function getMultiTrackClipLaneReadyPercent(
  state: MultiTrackClipLaneWorkspaceState,
): number {
  const metrics = getMultiTrackClipLaneMetrics(state);
  if (metrics.clipCount === 0) return 0;

  return Math.round((metrics.readyClipCount / metrics.clipCount) * 100);
}

export function getMultiTrackClipLaneRenderPercent(
  state: MultiTrackClipLaneWorkspaceState,
): number {
  const metrics = getMultiTrackClipLaneMetrics(state);
  if (metrics.clipCount === 0) return 0;

  return Math.round((metrics.renderReadyClipCount / metrics.clipCount) * 100);
}

export function getMultiTrackClipLaneById(
  lanes: MultiTrackClipLane[],
  laneId: string,
): MultiTrackClipLane | null {
  return lanes.find((lane) => lane.id === laneId) ?? null;
}

export function getMultiTrackClipById(
  lanes: MultiTrackClipLane[],
  clipId: string,
): MultiTrackClipLaneClip | null {
  return getAllMultiTrackClipLaneClips(lanes).find((clip) => clip.id === clipId) ?? null;
}

export function getMultiTrackClipsForSelection(
  lanes: MultiTrackClipLane[],
  selection: MultiTrackClipLaneSelection,
): MultiTrackClipLaneClip[] {
  return selection.clipIds
    .map((clipId) => getMultiTrackClipById(lanes, clipId))
    .filter((clip): clip is MultiTrackClipLaneClip => Boolean(clip));
}

export function getMultiTrackClipLaneSelectionSummary(
  lanes: MultiTrackClipLane[],
  selection: MultiTrackClipLaneSelection,
): string {
  const clips = getMultiTrackClipsForSelection(lanes, selection);

  return `${clips.length} clips · ${selection.microEditStepSeconds}s edit steps · ${selection.editTargets
    .map(getMultiTrackClipLaneEditTargetLabel)
    .join(", ")}`;
}

export function getMultiTrackClipLaneDuplicatePlanSummary(
  plan: MultiTrackClipLaneDuplicatePlan,
): string {
  return `${plan.duplicateCount} duplicate lanes · ${plan.knobTargets
    .map(getMultiTrackClipLaneEditTargetLabel)
    .join(", ")}`;
}

export function getMultiTrackClipLaneRenderPlanSummary(
  plan: MultiTrackClipLaneRenderPlan,
): string {
  return `${plan.clipIds.length} clips · ${getMultiTrackClipLaneRenderStatusLabel(
    plan.renderStatus,
  )} · ${plan.outputLabel}`;
}

export function getMultiTrackClipLaneDurationSeconds(lane: MultiTrackClipLane): number {
  if (lane.clips.length === 0) return 0;

  const endSeconds = Math.max(...lane.clips.map((clip) => clip.laneTimeRange.endSeconds));
  return Number(endSeconds.toFixed(2));
}

export function getMultiTrackClipLaneSelectedCount(lane: MultiTrackClipLane): number {
  return lane.clips.filter((clip) => clip.selected).length;
}

export function getMultiTrackClipLaneRenderCount(lane: MultiTrackClipLane): number {
  return lane.clips.filter(
    (clip) =>
      clip.renderStatus === "preview-ready" ||
      clip.renderStatus === "render-ready" ||
      clip.renderStatus === "keeper",
  ).length;
}

export function getMultiTrackClipLaneExperimentDistanceLabel(
  state: MultiTrackClipLaneWorkspaceState,
): string {
  const metrics = getMultiTrackClipLaneMetrics(state);

  if (metrics.experimentClipCount >= 10 && metrics.keeperClipCount > 0) {
    return "Experiment engine seeded";
  }

  if (metrics.experimentClipCount > 0) {
    return "Experiment lanes started";
  }

  if (metrics.readyClipCount > 0) {
    return "Extraction lanes started";
  }

  return "Planning only";
}