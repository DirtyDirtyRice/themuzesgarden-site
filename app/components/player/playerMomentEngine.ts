import type { AnyTrack } from "./playerTypes";
import { buildAllMomentsIndex, type IndexedMoment } from "./playerMomentIndex";
import {
  searchIndexedMoments,
  type MomentSearchFilters,
  type MomentSearchResult,
} from "./playerMomentSearch";

export function formatMomentTime(sec: number | null | undefined): string {
  const safe = Number(sec);
  const total = Number.isFinite(safe) ? Math.max(0, Math.floor(safe)) : 0;

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function debugMomentPlayback(payload: {
  trackId?: string | null;
  sectionId?: string | null;
  startTime?: number | null;
  source?: string | null;
}) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "production") return;

  const trackId = String(payload.trackId ?? "").trim() || "(none)";
  const sectionId = String(payload.sectionId ?? "").trim() || "(none)";
  const source = String(payload.source ?? "").trim() || "unknown";

  const startTime =
    typeof payload.startTime === "number" && Number.isFinite(payload.startTime)
      ? payload.startTime
      : null;

  console.log("[MomentPlayback]", {
    source,
    trackId,
    sectionId,
    startTime,
    startLabel: startTime === null ? "(none)" : formatMomentTime(startTime),
  });
}

export type MomentEngineSnapshot = {
  moments: IndexedMoment[];
  totalMoments: number;
  totalTracks: number;
};

export function buildMomentEngineSnapshot(
  tracks: AnyTrack[]
): MomentEngineSnapshot {
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const moments = buildAllMomentsIndex(safeTracks);

  return {
    moments,
    totalMoments: moments.length,
    totalTracks: safeTracks.length,
  };
}

export function searchMomentEngine(
  snapshot: MomentEngineSnapshot,
  filters: MomentSearchFilters = {}
): MomentSearchResult[] {
  const moments = Array.isArray(snapshot?.moments) ? snapshot.moments : [];
  return searchIndexedMoments(moments, filters);
}

export function findTopMomentMatches(
  snapshot: MomentEngineSnapshot,
  filters: MomentSearchFilters = {},
  limit = 10
): MomentSearchResult[] {
  const safeLimit =
    typeof limit === "number" && Number.isFinite(limit)
      ? Math.max(1, Math.floor(limit))
      : 10;

  return searchMomentEngine(snapshot, filters).slice(0, safeLimit);
}

export function getMomentEngineTrackIds(snapshot: MomentEngineSnapshot): string[] {
  const seen = new Set<string>();

  for (const moment of snapshot.moments) {
    const trackId = String(moment.trackId ?? "").trim();
    if (trackId) {
      seen.add(trackId);
    }
  }

  return Array.from(seen);
}