import { getSupabaseTracks } from "../getSupabaseTracks";
import { getUploadedTracks } from "../uploadedTracks";
import {
  getUnifiedTrackLibrary,
  refreshUnifiedTrackLibrary,
} from "./unifiedTrackLibrary";

export type TrackSourceName = "supabase" | "uploaded";

export type TrackSourceState = {
  enabled: boolean;
  priority: number;
  lastLoaded: number | null;
  trackCount: number;
};

const sourceRegistry: Record<TrackSourceName, TrackSourceState> = {
  supabase: {
    enabled: true,
    priority: 1,
    lastLoaded: null,
    trackCount: 0,
  },
  uploaded: {
    enabled: true,
    priority: 2,
    lastLoaded: null,
    trackCount: 0,
  },
};

export function enableTrackSource(source: TrackSourceName): void {
  sourceRegistry[source].enabled = true;
}

export function disableTrackSource(source: TrackSourceName): void {
  sourceRegistry[source].enabled = false;
}

export function isTrackSourceEnabled(
  source: TrackSourceName
): boolean {
  return sourceRegistry[source].enabled;
}

export function setTrackSourcePriority(
  source: TrackSourceName,
  priority: number
): void {
  sourceRegistry[source].priority = priority;
}

export function getTrackSourcePriority(
  source: TrackSourceName
): number {
  return sourceRegistry[source].priority;
}

export function getTrackSourceRegistry() {
  return structuredClone(sourceRegistry);
}

export async function loadTrackSources() {
  let supabaseTracks: any[] = [];
  let uploadedTracks: any[] = [];

  if (sourceRegistry.supabase.enabled) {
    supabaseTracks = Array.isArray(await getSupabaseTracks())
      ? await getSupabaseTracks()
      : [];

    sourceRegistry.supabase.trackCount = supabaseTracks.length;
    sourceRegistry.supabase.lastLoaded = Date.now();
  }

  if (sourceRegistry.uploaded.enabled) {
    uploadedTracks = Array.isArray(getUploadedTracks())
      ? getUploadedTracks()
      : [];

    sourceRegistry.uploaded.trackCount = uploadedTracks.length;
    sourceRegistry.uploaded.lastLoaded = Date.now();
  }

  const unifiedTracks = await getUnifiedTrackLibrary();

  return {
    supabaseTracks,
    uploadedTracks,
    unifiedTracks,
  };
}

export async function reloadTrackSource(
  source: TrackSourceName
): Promise<any[]> {
  switch (source) {
    case "supabase": {
      const tracks = Array.isArray(await getSupabaseTracks())
        ? await getSupabaseTracks()
        : [];

      sourceRegistry.supabase.trackCount = tracks.length;
      sourceRegistry.supabase.lastLoaded = Date.now();

      await refreshUnifiedTrackLibrary();

      return tracks;
    }

    case "uploaded": {
      const tracks = Array.isArray(getUploadedTracks())
        ? getUploadedTracks()
        : [];

      sourceRegistry.uploaded.trackCount = tracks.length;
      sourceRegistry.uploaded.lastLoaded = Date.now();

      await refreshUnifiedTrackLibrary();

      return tracks;
    }
  }
}

export async function reloadAllTrackSources() {
  await reloadTrackSource("supabase");
  await reloadTrackSource("uploaded");

  return getUnifiedTrackLibrary(true);
}

export function getTrackSourceStatistics() {
  return {
    totalSources: Object.keys(sourceRegistry).length,
    enabledSources: Object.values(sourceRegistry).filter(
      (s) => s.enabled
    ).length,
    disabledSources: Object.values(sourceRegistry).filter(
      (s) => !s.enabled
    ).length,
    registry: structuredClone(sourceRegistry),
  };
}

export function resetTrackSourceRegistry(): void {
  sourceRegistry.supabase.enabled = true;
  sourceRegistry.supabase.priority = 1;
  sourceRegistry.supabase.lastLoaded = null;
  sourceRegistry.supabase.trackCount = 0;

  sourceRegistry.uploaded.enabled = true;
  sourceRegistry.uploaded.priority = 2;
  sourceRegistry.uploaded.lastLoaded = null;
  sourceRegistry.uploaded.trackCount = 0;
}