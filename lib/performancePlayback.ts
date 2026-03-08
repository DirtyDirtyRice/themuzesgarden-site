// lib/performancePlayback.ts
export type LoopMode = "off" | "track" | "setlist";

function shuffled<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

export function buildShuffleOrder(ids: string[], keepFirstId?: string | null) {
  const unique = Array.from(new Set(ids.map(String))).filter(Boolean);
  if (!unique.length) return [];
  const keep = keepFirstId ? String(keepFirstId) : null;

  if (!keep || !unique.includes(keep)) {
    return shuffled(unique);
  }

  const rest = unique.filter((x) => x !== keep);
  return [keep, ...shuffled(rest)];
}

export function normalizeOrder(order: string[], validIds: string[]) {
  const set = new Set(validIds.map(String));
  const filtered = order.map(String).filter((tid) => set.has(tid));
  const missing = validIds.map(String).filter((tid) => !filtered.includes(tid));
  return [...filtered, ...missing];
}

export function findIndexById(tracks: { id: string }[], id: string | null) {
  if (!id) return -1;
  return tracks.findIndex((t) => String(t.id) === String(id));
}

export function getUpNextId(opts: {
  currentId: string | null;
  ids: string[]; // playback order ids
  loopMode: LoopMode;
}) {
  const { currentId, ids, loopMode } = opts;
  if (!currentId) return null;
  const idx = ids.findIndex((x) => String(x) === String(currentId));
  if (idx < 0) return null;

  const atEnd = idx + 1 >= ids.length;
  if (atEnd) {
    if (loopMode === "setlist") return ids[0] ?? null;
    return null;
  }

  return ids[idx + 1] ?? null;
}

export function getNextId(opts: {
  currentId: string | null;
  ids: string[];
  loopMode: LoopMode;
  wrap?: boolean;
}) {
  const { currentId, ids, loopMode, wrap } = opts;
  if (!ids.length) return null;
  const idx = currentId ? ids.findIndex((x) => String(x) === String(currentId)) : -1;
  let nextIdx = Math.min(ids.length - 1, idx + 1);

  if (wrap && loopMode === "setlist") {
    if (idx >= ids.length - 1) nextIdx = 0;
  }
  return ids[nextIdx] ?? null;
}

export function getPrevId(opts: {
  currentId: string | null;
  ids: string[];
}) {
  const { currentId, ids } = opts;
  if (!ids.length) return null;
  const idx = currentId ? ids.findIndex((x) => String(x) === String(currentId)) : 0;
  const prevIdx = Math.max(0, idx - 1);
  return ids[prevIdx] ?? null;
}
// Compatibility export: some pages expect a factory named createPerformancePlayback.
// This returns the existing helper functions without changing behavior.
export function createPerformancePlayback() {
  return {
    buildShuffleOrder,
    normalizeOrder,
    findIndexById,
    getUpNextId,
    getNextId,
    getPrevId,
  };
}