export type TimelineDawTrackFolderRouting = { laneIds: string[]; busId: string | null };

export function parseTimelineDawTrackFolderRouting(value: unknown): TimelineDawTrackFolderRouting {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Folder routing is required.");
  const input = value as Record<string, unknown>;
  const laneIds = Array.isArray(input.laneIds) ? [...new Set(input.laneIds.filter((id): id is string => typeof id === "string").map((id) => id.trim()).filter(Boolean))] : [];
  if (laneIds.length < 2 || laneIds.length > 500) throw new Error("Folder routing requires between 2 and 500 current tracks.");
  const busId = typeof input.busId === "string" && input.busId.trim() ? input.busId.trim() : null;
  if (busId && busId.length > 160) throw new Error("Folder bus identifier is too long.");
  return { laneIds, busId };
}

export function parseTimelineDawTrackFolderSend(sourceBusId: string, destinationBusId: string, level = 0.5) {
  const sourceId = sourceBusId.trim();
  const destinationId = destinationBusId.trim();
  if (!sourceId || !destinationId || sourceId === destinationId) throw new Error("Folder send requires two different buses.");
  if (!Number.isFinite(level) || level < 0 || level > 2) throw new Error("Folder send level must be between 0 and 2.");
  return { sourceKind: "bus" as const, sourceId, destinationBusId: destinationId, level, preFader: false, muted: false };
}

export function updateTimelineDawTrackFolderSend(
  send: { id: string; sourceKind: "lane" | "bus"; sourceId: string; destinationBusId: string; level: number; preFader: boolean; muted: boolean },
  update: Partial<Pick<typeof send, "level" | "preFader" | "muted">>,
) {
  if (send.sourceKind !== "bus") throw new Error("Folder sends must originate from a shared bus.");
  const level = update.level ?? send.level;
  if (!Number.isFinite(level) || level < 0 || level > 2) throw new Error("Folder send level must be between 0 and 2.");
  return { ...send, ...update, level };
}

export function resolveTimelineDawTrackFolderSendDestinations(
  sourceBusId: string,
  busIds: string[],
  sends: Array<{ sourceKind: "lane" | "bus"; sourceId: string; destinationBusId: string; muted: boolean }>,
) {
  const sourceId = sourceBusId.trim();
  const existingDestinations = new Set(sends.filter((send) => send.sourceKind === "bus" && send.sourceId === sourceId).map((send) => send.destinationBusId));
  const activeEdges = new Map<string, string[]>();
  for (const send of sends) {
    if (send.muted || send.sourceKind !== "bus") continue;
    activeEdges.set(send.sourceId, [...(activeEdges.get(send.sourceId) ?? []), send.destinationBusId]);
  }
  const reachesSource = (start: string) => {
    const pending = [start];
    const visited = new Set<string>();
    while (pending.length) {
      const current = pending.pop()!;
      if (current === sourceId) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      pending.push(...(activeEdges.get(current) ?? []));
    }
    return false;
  };
  return [...new Set(busIds.map((id) => id.trim()).filter(Boolean))].filter((id) => id !== sourceId && !existingDestinations.has(id) && !reachesSource(id));
}
