// lib/performanceState.ts
// Performance Mode: LocalStorage helpers for project player state.
// Additive-only. Safe defaults. Versioned payload.

export type LoopMode = "off" | "one" | "all";

export type PerformanceStateV1 = {
  v: 1;

  // Queue / playback position
  trackIds: string[]; // ordered list of track ids (e.g. "sb:bucket:path")
  currentTrackId: string | null;
  currentIndex: number; // index into trackIds (best-effort)
  lastSeekSeconds: number; // best-effort (optional use)

  // Toggles / modes
  isShuffle: boolean;
  loopMode: LoopMode;

  // Audio preferences
  volume: number; // 0..1
  isMuted: boolean;

  // Metadata
  updatedAt: number; // Date.now()
};

const VERSION = 1;

// Keep keys stable + namespaced by project id
function key(projectId: string) {
  return `muzes.performance.${VERSION}.project.${projectId}`;
}

// Safe JSON parse
function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 1;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function defaultPerformanceState(): PerformanceStateV1 {
  return {
    v: 1,
    trackIds: [],
    currentTrackId: null,
    currentIndex: 0,
    lastSeekSeconds: 0,
    isShuffle: false,
    loopMode: "off",
    volume: 1,
    isMuted: false,
    updatedAt: Date.now(),
  };
}

/**
 * Load state for a project. Returns defaults if missing/corrupt.
 * Never throws.
 */
export function loadPerformanceState(projectId: string): PerformanceStateV1 {
  if (typeof window === "undefined") return defaultPerformanceState();

  const raw = window.localStorage.getItem(key(projectId));
  const parsed = safeParse<PerformanceStateV1>(raw);

  const base = defaultPerformanceState();

  if (!parsed || parsed.v !== 1) return base;

  // Validate + sanitize fields defensively
  const trackIds = Array.isArray(parsed.trackIds)
    ? parsed.trackIds.filter((x) => typeof x === "string")
    : base.trackIds;

  const currentTrackId =
    typeof parsed.currentTrackId === "string" ? parsed.currentTrackId : null;

  const currentIndex =
    Number.isInteger(parsed.currentIndex) && parsed.currentIndex >= 0
      ? parsed.currentIndex
      : 0;

  const lastSeekSeconds =
    typeof parsed.lastSeekSeconds === "number" && parsed.lastSeekSeconds >= 0
      ? parsed.lastSeekSeconds
      : 0;

  const isShuffle = typeof parsed.isShuffle === "boolean" ? parsed.isShuffle : false;

  const loopMode: LoopMode =
    parsed.loopMode === "off" || parsed.loopMode === "one" || parsed.loopMode === "all"
      ? parsed.loopMode
      : "off";

  const volume = clamp01(typeof parsed.volume === "number" ? parsed.volume : 1);

  const isMuted = typeof parsed.isMuted === "boolean" ? parsed.isMuted : false;

  const updatedAt =
    typeof parsed.updatedAt === "number" && parsed.updatedAt > 0
      ? parsed.updatedAt
      : Date.now();

  return {
    v: 1,
    trackIds,
    currentTrackId,
    currentIndex,
    lastSeekSeconds,
    isShuffle,
    loopMode,
    volume,
    isMuted,
    updatedAt,
  };
}

/**
 * Save full state for a project. Never throws.
 */
export function savePerformanceState(projectId: string, state: PerformanceStateV1) {
  if (typeof window === "undefined") return;
  try {
    const payload: PerformanceStateV1 = {
      ...state,
      v: 1,
      volume: clamp01(state.volume),
      currentIndex: Math.max(0, Math.floor(state.currentIndex || 0)),
      lastSeekSeconds: Math.max(0, state.lastSeekSeconds || 0),
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(key(projectId), JSON.stringify(payload));
  } catch {
    // ignore storage failures (private mode / quota / disabled)
  }
}

/**
 * Patch update helper (merge + save).
 * Useful when you only want to update one field.
 */
export function patchPerformanceState(
  projectId: string,
  patch: Partial<Omit<PerformanceStateV1, "v" | "updatedAt">>
): PerformanceStateV1 {
  const current = loadPerformanceState(projectId);
  const next: PerformanceStateV1 = {
    ...current,
    ...patch,
    v: 1,
    updatedAt: Date.now(),
    volume: clamp01(typeof patch.volume === "number" ? patch.volume : current.volume),
  };
  savePerformanceState(projectId, next);
  return next;
}

/**
 * Clear state for a project (rarely needed).
 */
export function clearPerformanceState(projectId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(projectId));
  } catch {
    // ignore
  }
}