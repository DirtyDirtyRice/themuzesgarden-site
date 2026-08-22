import {
  moveSelectedTimelineClips,
  snapTimelineSeconds,
  type TimelineDawClipState,
} from "./TimelineDawMultitrackViewModel";

export type TimelineDawEditMode = "grid" | "slip" | "shuffle" | "spot";

type EditMove = {
  mode: TimelineDawEditMode;
  deltaSeconds: number;
  gridSeconds: number;
  spotSeconds?: number;
};

const precision = (value: number) => Math.round(value * 100) / 100;

export function parseTimelineDawEditMode(value: unknown): TimelineDawEditMode {
  return value === "slip" || value === "shuffle" || value === "spot" ? value : "grid";
}

export function applyTimelineDawEditModeMove(
  clips: TimelineDawClipState[],
  input: EditMove,
): TimelineDawClipState[] {
  const selected = clips.filter((clip) => clip.selected && !clip.archived);
  if (!selected.length) return clips.map((clip) => ({ ...clip }));

  const earliest = Math.min(...selected.map((clip) => clip.timelineStartSeconds));
  if (input.mode === "slip") {
    const minimumSource = Math.min(...selected.map((clip) => clip.sourceStartSeconds));
    const applied = precision(Math.max(input.deltaSeconds, -minimumSource));
    return clips.map((clip) => clip.selected && !clip.archived
      ? {
          ...clip,
          sourceStartSeconds: precision(clip.sourceStartSeconds + applied),
          sourceEndSeconds: precision(clip.sourceEndSeconds + applied),
        }
      : { ...clip });
  }

  const requestedStart = input.mode === "spot"
    ? Math.max(0, Number.isFinite(input.spotSeconds) ? input.spotSeconds! : earliest)
    : input.mode === "grid"
      ? Math.max(0, snapTimelineSeconds(earliest + input.deltaSeconds, input.gridSeconds))
      : Math.max(0, precision(earliest + input.deltaSeconds));
  const delta = precision(requestedStart - earliest);
  if (input.mode !== "shuffle") return moveSelectedTimelineClips(clips, delta);

  const selectedIds = new Set(selected.map((clip) => clip.id));
  const affectedTracks = new Set(selected.map((clip) => clip.trackId));
  const moved = moveSelectedTimelineClips(clips, delta);
  return moved.map((clip) => {
    if (clip.archived || selectedIds.has(clip.id) || !affectedTracks.has(clip.trackId)) {
      return { ...clip };
    }
    const originalSelected = selected.filter((item) => item.trackId === clip.trackId);
    if (!originalSelected.length) return { ...clip };
    const oldStart = Math.min(...originalSelected.map((item) => item.timelineStartSeconds));
    const oldEnd = Math.max(...originalSelected.map((item) => item.timelineEndSeconds));
    const blockDuration = oldEnd - oldStart;
    let start = clip.timelineStartSeconds;
    if (delta > 0 && start >= oldEnd && start < requestedStart + blockDuration) {
      start -= blockDuration;
    } else if (delta < 0 && start >= requestedStart && start < oldStart) {
      start += blockDuration;
    }
    const duration = clip.timelineEndSeconds - clip.timelineStartSeconds;
    return {
      ...clip,
      timelineStartSeconds: precision(Math.max(0, start)),
      timelineEndSeconds: precision(Math.max(0, start) + duration),
    };
  });
}

export function timelineDawEditModeDescription(mode: TimelineDawEditMode): string {
  if (mode === "slip") return "Move source audio while the clip stays fixed.";
  if (mode === "shuffle") return "Move clips while closing the old gap and opening the destination.";
  if (mode === "spot") return "Place selected clips at an exact timeline position.";
  return "Snap clip placement to the selected timeline grid.";
}
