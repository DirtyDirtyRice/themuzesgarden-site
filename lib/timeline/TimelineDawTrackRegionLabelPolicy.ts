import { TIMELINE_DAW_TRACK_COLORS, type TimelineDawTrackColorName } from "./TimelineDawTrackColorPolicy";

export type TimelineDawTrackRegionLabel = {
  id: string;
  laneId: string;
  name: string;
  startSeconds: number;
  endSeconds: number;
  color: TimelineDawTrackColorName;
};

export type TimelineDawTrackRegionLabels = Record<string, TimelineDawTrackRegionLabel[]>;

export function timelineDawTrackLocalSeconds(input: {
  playheadSeconds: number;
  timelineStartSeconds: number;
  sourceDurationSeconds: number;
  stretchRatio: number;
  transformBypassed: boolean;
}): number {
  const rate = input.transformBypassed ? 1 : input.stretchRatio;
  const local = (input.playheadSeconds - input.timelineStartSeconds) / (Number.isFinite(rate) && rate > 0 ? rate : 1);
  return Math.min(Math.max(0, local), Math.max(0, input.sourceDurationSeconds));
}

export function parseTimelineDawTrackRegionLabels(value: string | null, validLanes: Record<string, number>): TimelineDawTrackRegionLabels {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: TimelineDawTrackRegionLabels = {};
    for (const [laneId, candidate] of Object.entries(parsed)) {
      const duration = validLanes[laneId];
      if (!Number.isFinite(duration) || !Array.isArray(candidate)) continue;
      const labels = candidate.filter((item): item is TimelineDawTrackRegionLabel => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return false;
        const label = item as Partial<TimelineDawTrackRegionLabel>;
        return typeof label.id === "string" && label.id.length > 0 && label.id.length <= 100
          && label.laneId === laneId
          && typeof label.name === "string" && label.name.trim().length > 0 && label.name.trim().length <= 80
          && typeof label.startSeconds === "number" && Number.isFinite(label.startSeconds) && label.startSeconds >= 0
          && typeof label.endSeconds === "number" && Number.isFinite(label.endSeconds) && label.endSeconds > label.startSeconds && label.endSeconds <= duration
          && typeof label.color === "string" && label.color in TIMELINE_DAW_TRACK_COLORS;
      }).map((label) => ({ ...label, name: label.name.trim() }));
      if (labels.length) result[laneId] = labels;
    }
    return result;
  } catch {
    return {};
  }
}

export function addTimelineDawTrackRegionLabel(labels: TimelineDawTrackRegionLabels, label: TimelineDawTrackRegionLabel): TimelineDawTrackRegionLabels {
  const name = label.name.trim();
  if (!name || name.length > 80 || !Number.isFinite(label.startSeconds) || !Number.isFinite(label.endSeconds) || label.startSeconds < 0 || label.endSeconds <= label.startSeconds || !(label.color in TIMELINE_DAW_TRACK_COLORS)) return labels;
  return { ...labels, [label.laneId]: [...(labels[label.laneId] ?? []), { ...label, name }] };
}

export function removeTimelineDawTrackRegionLabel(labels: TimelineDawTrackRegionLabels, laneId: string, id: string): TimelineDawTrackRegionLabels {
  const remaining = (labels[laneId] ?? []).filter((label) => label.id !== id);
  if (remaining.length === (labels[laneId] ?? []).length) return labels;
  const next = { ...labels };
  if (remaining.length) next[laneId] = remaining;
  else delete next[laneId];
  return next;
}
