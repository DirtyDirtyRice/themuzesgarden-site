import type { Persisted } from "./playerTypes";

export const LS_KEY = "muzes.globalPlayer.v1";

function safeJsonStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function asString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  return clean ? clean : undefined;
}

function asNullableString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return asString(value);
}

function asNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asPlayerTab(value: unknown): Persisted["tab"] {
  return value === "project" || value === "search" ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const out = value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

  return out;
}

function asProjectOrder(value: unknown): Record<string, string[]> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

  const out: Record<string, string[]> = {};

  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = String(rawKey ?? "").trim();
    if (!key) continue;

    const arr = asStringArray(rawValue);
    if (!arr || arr.length === 0) continue;

    out[key] = arr;
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function sanitizePersisted(value: unknown): Persisted {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const raw = value as Record<string, unknown>;

  const sanitized: Persisted = {};

  const tab = asPlayerTab(raw.tab);
  if (tab) sanitized.tab = tab;

  const lastProjectId = asString(raw.lastProjectId);
  if (lastProjectId) sanitized.lastProjectId = lastProjectId;

  if (raw.nowId === null) sanitized.nowId = null;
  else {
    const nowId = asString(raw.nowId);
    if (nowId) sanitized.nowId = nowId;
  }

  const volume = asNumber(raw.volume);
  if (typeof volume === "number") sanitized.volume = volume;

  const currentTime = asNumber(raw.currentTime);
  if (typeof currentTime === "number") sanitized.currentTime = currentTime;

  const shuffle = asBoolean(raw.shuffle);
  if (typeof shuffle === "boolean") sanitized.shuffle = shuffle;

  const loop = asBoolean(raw.loop);
  if (typeof loop === "boolean") sanitized.loop = loop;

  const projectOrder = asProjectOrder(raw.projectOrder);
  if (projectOrder) sanitized.projectOrder = projectOrder;

  if (raw.currentSectionId === null) sanitized.currentSectionId = null;
  else {
    const currentSectionId = asString(raw.currentSectionId);
    if (currentSectionId) sanitized.currentSectionId = currentSectionId;
  }

  if (raw.sectionStartTime === null) sanitized.sectionStartTime = null;
  else {
    const sectionStartTime = asNumber(raw.sectionStartTime);
    if (typeof sectionStartTime === "number") {
      sanitized.sectionStartTime = sectionStartTime;
    }
  }

  const lastSearchQuery = asString(raw.lastSearchQuery);
  if (lastSearchQuery) sanitized.lastSearchQuery = lastSearchQuery;

  if (raw.lastMatchedSectionId === null) sanitized.lastMatchedSectionId = null;
  else {
    const lastMatchedSectionId = asString(raw.lastMatchedSectionId);
    if (lastMatchedSectionId) sanitized.lastMatchedSectionId = lastMatchedSectionId;
  }

  if (raw.lastMatchedSectionStartTime === null) {
    sanitized.lastMatchedSectionStartTime = null;
  } else {
    const lastMatchedSectionStartTime = asNumber(raw.lastMatchedSectionStartTime);
    if (typeof lastMatchedSectionStartTime === "number") {
      sanitized.lastMatchedSectionStartTime = lastMatchedSectionStartTime;
    }
  }

  return sanitized;
}

export function readPersisted(): Persisted {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};

    const json = JSON.parse(raw);
    return sanitizePersisted(json);
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
  const cleanPatch = sanitizePersisted(patch);
  const next: Persisted = sanitizePersisted({ ...prev, ...cleanPatch });

  const prevStr = safeJsonStringify(prev);
  const nextStr = safeJsonStringify(next);
  if (!nextStr) return;

  if (prevStr && prevStr === nextStr) return;

  try {
    localStorage.setItem(LS_KEY, nextStr);
  } catch {
    // ignore
  }
}

export function readProjectOrder(projectId: string): string[] | undefined {
  const cleanProjectId = String(projectId ?? "").trim();
  if (!cleanProjectId) return undefined;

  const persisted = readPersisted();
  const saved = persisted.projectOrder?.[cleanProjectId];
  if (!Array.isArray(saved)) return undefined;

  const normalized = saved.map((id) => String(id ?? "").trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

export function writeProjectOrder(projectId: string, orderedIds: string[]) {
  const cleanProjectId = String(projectId ?? "").trim();
  if (!cleanProjectId) return;

  const normalizedOrderedIds = orderedIds
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);

  const persisted = readPersisted();
  const prevOrder = persisted.projectOrder?.[cleanProjectId];

  if (Array.isArray(prevOrder)) {
    if (
      prevOrder.length === normalizedOrderedIds.length &&
      prevOrder.every((v, i) => String(v) === String(normalizedOrderedIds[i]))
    ) {
      return;
    }
  }

  const nextProjectOrder = {
    ...(persisted.projectOrder ?? {}),
    [cleanProjectId]: normalizedOrderedIds,
  };

  writePersisted({
    lastProjectId: cleanProjectId,
    projectOrder: nextProjectOrder,
  });
}

export function stableMergeOrder(
  existingIds: string[],
  savedOrder: string[] | undefined
): string[] {
  const normalizedExistingIds = existingIds
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);

  const existingSet = new Set(normalizedExistingIds);
  const seen = new Set<string>();
  const out: string[] = [];

  if (Array.isArray(savedOrder)) {
    for (const id of savedOrder) {
      const sid = String(id ?? "").trim();
      if (!sid) continue;
      if (!existingSet.has(sid)) continue;
      if (seen.has(sid)) continue;
      seen.add(sid);
      out.push(sid);
    }
  }

  for (const id of normalizedExistingIds) {
    if (seen.has(id)) continue;
    if (!existingSet.has(id)) continue;
    seen.add(id);
    out.push(id);
  }

  return out;
}