export type TimelineDawTrackConsolidationPlan = {
  laneIds: string[];
  busName: string;
};

export function createTimelineDawTrackConsolidationPlan(laneIds: string[]): TimelineDawTrackConsolidationPlan {
  const normalized = [...new Set(laneIds.map((laneId) => laneId.trim()).filter(Boolean))];
  if (normalized.length < 2) throw new Error("Select at least two tracks to consolidate.");
  if (normalized.length > 64) throw new Error("Consolidate no more than 64 tracks at once.");
  if (normalized.some((laneId) => laneId.length > 200)) throw new Error("A selected track identifier is invalid.");
  return { laneIds: normalized, busName: `Consolidated ${normalized.length} Tracks` };
}
