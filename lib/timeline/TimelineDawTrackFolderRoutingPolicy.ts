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

export function copyTimelineDawTrackFolderSend(
  send: { sourceKind: "lane" | "bus"; sourceId: string; destinationBusId: string; level: number; preFader: boolean; muted: boolean },
  destinationBusId: string,
) {
  if (send.sourceKind !== "bus") throw new Error("Folder sends must originate from a shared bus.");
  const destinationId = destinationBusId.trim();
  if (!destinationId || destinationId === send.sourceId) throw new Error("Copied folder send requires a different destination bus.");
  if (!Number.isFinite(send.level) || send.level < 0 || send.level > 2) throw new Error("Folder send level must be between 0 and 2.");
  return { sourceKind: "bus" as const, sourceId: send.sourceId, destinationBusId: destinationId, level: send.level, preFader: send.preFader, muted: send.muted };
}

export function resolveTimelineDawTrackFolderSendRemoval(pending: { sendId: string; expiresAt: number } | undefined, selectedSendId: string, now: number) {
  const sendId = selectedSendId.trim();
  if (!sendId) throw new Error("Folder send identifier is required.");
  if (!Number.isFinite(now)) throw new Error("Folder send confirmation time is required.");
  return pending?.sendId === sendId && pending.expiresAt > now ? "remove" as const : "confirm" as const;
}

export function timelineDawTrackFolderSendLevelToDb(level: number) {
  if (!Number.isFinite(level) || level < 0 || level > 2) throw new Error("Folder send level must be between 0 and 2.");
  return level === 0 ? null : 20 * Math.log10(level);
}

export function timelineDawTrackFolderSendDbToLevel(decibels: number) {
  if (!Number.isFinite(decibels) || decibels < -60 || decibels > 20 * Math.log10(2)) throw new Error("Folder send decibels must be between -60 and +6.02 dB.");
  return decibels === -60 ? 0 : 10 ** (decibels / 20);
}

export function createTimelineDawTrackFolderSendDryCheck<T extends { id: string; sourceKind: "lane" | "bus"; sourceId: string; muted: boolean }>(sends: T[], sourceBusId: string) {
  const sourceId = sourceBusId.trim();
  if (!sourceId) throw new Error("Folder dry check requires a shared bus.");
  const snapshot: Record<string, boolean> = {};
  const next = sends.map((send) => {
    if (send.sourceKind !== "bus" || send.sourceId !== sourceId) return send;
    snapshot[send.id] = send.muted;
    return { ...send, muted: true };
  });
  if (!Object.keys(snapshot).length) throw new Error("Folder dry check requires at least one shared send.");
  return { sends: next, snapshot };
}

export function restoreTimelineDawTrackFolderSendDryCheck<T extends { id: string; muted: boolean }>(sends: T[], snapshot: Record<string, boolean>) {
  return sends.map((send) => Object.prototype.hasOwnProperty.call(snapshot, send.id) ? { ...send, muted: snapshot[send.id] } : send);
}

export function createTimelineDawTrackFolderSendFocusCheck<T extends { id: string; sourceKind: "lane" | "bus"; sourceId: string; muted: boolean }>(sends: T[], sourceBusId: string, focusedSendId: string) {
  const sourceId = sourceBusId.trim(), focusId = focusedSendId.trim();
  if (!sourceId || !focusId) throw new Error("Folder send focus requires a shared bus and send.");
  const folderSends = sends.filter((send) => send.sourceKind === "bus" && send.sourceId === sourceId);
  if (!folderSends.some((send) => send.id === focusId)) throw new Error("Focused send must belong to the folder bus.");
  const snapshot = Object.fromEntries(folderSends.map((send) => [send.id, send.muted]));
  return { sends: sends.map((send) => send.sourceKind === "bus" && send.sourceId === sourceId ? { ...send, muted: send.id !== focusId } : send), snapshot, focusedSendId: focusId };
}

export function switchTimelineDawTrackFolderSendFocus<T extends { id: string; sourceKind: "lane" | "bus"; sourceId: string; muted: boolean }>(sends: T[], sourceBusId: string, focusedSendId: string) {
  const sourceId = sourceBusId.trim(), focusId = focusedSendId.trim();
  if (!sends.some((send) => send.id === focusId && send.sourceKind === "bus" && send.sourceId === sourceId)) throw new Error("Focused send must belong to the folder bus.");
  return sends.map((send) => send.sourceKind === "bus" && send.sourceId === sourceId ? { ...send, muted: send.id !== focusId } : send);
}

export function cycleTimelineDawTrackFolderSendFocus<T extends { id: string; sourceKind: "lane" | "bus"; sourceId: string; muted: boolean }>(sends: T[], sourceBusId: string, focusedSendId: string, direction: -1 | 1) {
  const sourceId = sourceBusId.trim(), focusId = focusedSendId.trim();
  const folderSendIds = sends.filter((send) => send.sourceKind === "bus" && send.sourceId === sourceId).map((send) => send.id);
  const currentIndex = folderSendIds.indexOf(focusId);
  if (currentIndex < 0) throw new Error("Focused send must belong to the folder bus.");
  const nextId = folderSendIds[(currentIndex + direction + folderSendIds.length) % folderSendIds.length];
  return { sends: switchTimelineDawTrackFolderSendFocus(sends, sourceId, nextId), focusedSendId: nextId };
}

export function jumpTimelineDawTrackFolderSendFocus<T extends { id: string; sourceKind: "lane" | "bus"; sourceId: string; muted: boolean }>(sends: T[], sourceBusId: string, edge: "first" | "last") {
  const sourceId = sourceBusId.trim();
  const folderSendIds = sends.filter((send) => send.sourceKind === "bus" && send.sourceId === sourceId).map((send) => send.id);
  if (!folderSendIds.length) throw new Error("Folder send focus requires at least one shared send.");
  const focusedSendId = edge === "first" ? folderSendIds[0] : folderSendIds[folderSendIds.length - 1];
  return { sends: switchTimelineDawTrackFolderSendFocus(sends, sourceId, focusedSendId), focusedSendId };
}
