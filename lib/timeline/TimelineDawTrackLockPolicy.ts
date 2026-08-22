export function parseTimelineDawTrackLocks(value: string | null, validLaneIds: string[]): Set<string> {
  if (!value) return new Set();
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    const valid = new Set(validLaneIds);
    return new Set(parsed.filter((id): id is string => typeof id === "string" && valid.has(id)));
  } catch {
    return new Set();
  }
}

export function toggleTimelineDawTrackLock(lockedIds: Set<string>, laneId: string): Set<string> {
  const next = new Set(lockedIds);
  if (next.has(laneId)) next.delete(laneId);
  else next.add(laneId);
  return next;
}

export function serializeTimelineDawTrackLocks(lockedIds: Set<string>): string {
  return JSON.stringify([...lockedIds].sort());
}
