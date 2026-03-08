import type { Persisted } from "./playerTypes";

export const LS_KEY = "muzes.globalPlayer.v1";

function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function readPersisted(): Persisted {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    const json = JSON.parse(raw) as Persisted;
    return json && typeof json === "object" ? json : {};
  } catch {
    return {};
  }
}

/**
 * Writes only if the resulting JSON payload actually changes.
 * This prevents churn (and avoids needless "storage write" side effects).
 */
export function writePersisted(patch: Partial<Persisted>) {
  if (typeof window === "undefined") return;

  const prev = readPersisted();
  const next: Persisted = { ...prev, ...patch };

  const prevStr = safeJsonStringify(prev);
  const nextStr = safeJsonStringify(next);
  if (!nextStr) return;

  // If we can stringify both and they're identical, skip writing.
  if (prevStr && prevStr === nextStr) return;

  try {
    localStorage.setItem(LS_KEY, nextStr);
  } catch {
    // ignore
  }
}

export function readProjectOrder(projectId: string): string[] | undefined {
  const persisted = readPersisted();
  const saved = persisted.projectOrder?.[projectId];
  return Array.isArray(saved) ? saved.map(String) : undefined;
}

export function writeProjectOrder(projectId: string, orderedIds: string[]) {
  if (!projectId) return;

  const persisted = readPersisted();
  const prevOrder = persisted.projectOrder?.[projectId];

  // If identical order already saved, do nothing.
  if (Array.isArray(prevOrder)) {
    if (
      prevOrder.length === orderedIds.length &&
      prevOrder.every((v, i) => String(v) === String(orderedIds[i]))
    ) {
      return;
    }
  }

  const nextProjectOrder = {
    ...(persisted.projectOrder ?? {}),
    [projectId]: orderedIds.map(String),
  };

  writePersisted({
    lastProjectId: projectId,
    projectOrder: nextProjectOrder,
  });
}

export function stableMergeOrder(
  existingIds: string[],
  savedOrder: string[] | undefined
): string[] {
  const existingSet = new Set(existingIds.map(String));
  const seen = new Set<string>();
  const out: string[] = [];

  if (Array.isArray(savedOrder)) {
    for (const id of savedOrder) {
      const sid = String(id);
      if (!existingSet.has(sid)) continue;
      if (seen.has(sid)) continue;
      seen.add(sid);
      out.push(sid);
    }
  }

  for (const id of existingIds) {
    const sid = String(id);
    if (seen.has(sid)) continue;
    if (!existingSet.has(sid)) continue;
    seen.add(sid);
    out.push(sid);
  }

  return out;
}