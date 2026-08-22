export const TIMELINE_DAW_TRACK_COLORS = {
  cyan: "#67e8f9",
  violet: "#c4b5fd",
  rose: "#fda4af",
  amber: "#fcd34d",
  emerald: "#6ee7b7",
  blue: "#93c5fd",
} as const;

export type TimelineDawTrackColorName = keyof typeof TIMELINE_DAW_TRACK_COLORS;
export type TimelineDawTrackColors = Record<string, TimelineDawTrackColorName>;

export function parseTimelineDawTrackColors(value: string | null, validLaneIds: string[]): TimelineDawTrackColors {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const validIds = new Set(validLaneIds);
    const validColors = new Set(Object.keys(TIMELINE_DAW_TRACK_COLORS));
    return Object.fromEntries(Object.entries(parsed).filter(([laneId, color]) => validIds.has(laneId) && typeof color === "string" && validColors.has(color))) as TimelineDawTrackColors;
  } catch {
    return {};
  }
}

export function setTimelineDawTrackColor(colors: TimelineDawTrackColors, laneId: string, color: TimelineDawTrackColorName): TimelineDawTrackColors {
  if (!(color in TIMELINE_DAW_TRACK_COLORS)) return colors;
  return { ...colors, [laneId]: color };
}
