import { getSupabaseTracks } from "../getSupabaseTracks";
import { getUploadedTracks } from "../uploadedTracks";
import { mergeTrackLists } from "../../app/library/libraryUtils";

export type ProjectTrackResolverStats = {
  requested: number;
  resolved: number;
  missing: number;
  duplicates: number;
};

export type ProjectTrackResolverResult = {
  tracks: any[];
  lookup: Map<string, any>;
  missingIds: string[];
  duplicateIds: string[];
  stats: ProjectTrackResolverStats;
};

async function buildUnifiedLibrary(): Promise<any[]> {
  const supabaseTracks = await getSupabaseTracks();
  const uploadedTracks = getUploadedTracks();

  return mergeTrackLists(
    (Array.isArray(supabaseTracks) ? supabaseTracks : []).map((track: any) => ({
      ...track,
      artist: track.artist ?? "",
    })),
    (Array.isArray(uploadedTracks) ? uploadedTracks : []).map((track: any) => ({
      ...track,
      artist: track.artist ?? "",
    }))
  );
}

export async function buildProjectTrackLookup(): Promise<Map<string, any>> {
  const library = await buildUnifiedLibrary();

  const lookup = new Map<string, any>();

  for (const track of library) {
    if (!track) continue;

    lookup.set(String(track.id), track);
  }

  return lookup;
}

export async function resolveProjectTracks(
  projectTrackIds: string[]
): Promise<any[]> {
  const lookup = await buildProjectTrackLookup();

  return (Array.isArray(projectTrackIds) ? projectTrackIds : [])
    .map((id) => lookup.get(String(id)))
    .filter(Boolean);
}

export async function resolveProjectTrackById(
  trackId: string
): Promise<any | null> {
  const lookup = await buildProjectTrackLookup();

  return lookup.get(String(trackId)) ?? null;
}

export async function resolveProjectTracksAsMap(
  projectTrackIds: string[]
): Promise<Map<string, any>> {
  const resolved = await resolveProjectTracks(projectTrackIds);

  const map = new Map<string, any>();

  for (const track of resolved) {
    map.set(String(track.id), track);
  }

  return map;
}

export async function resolveUniqueProjectTracks(
  projectTrackIds: string[]
): Promise<any[]> {
  const resolved = await resolveProjectTracks(projectTrackIds);

  const ids = new Set<string>();

  return resolved.filter((track) => {
    const id = String(track.id);

    if (ids.has(id)) {
      return false;
    }

    ids.add(id);

    return true;
  });
}

export async function findMissingProjectTrackIds(
  projectTrackIds: string[]
): Promise<string[]> {
  const lookup = await buildProjectTrackLookup();

  return (Array.isArray(projectTrackIds) ? projectTrackIds : []).filter(
    (id) => !lookup.has(String(id))
  );
}

export async function hasMissingProjectTracks(
  projectTrackIds: string[]
): Promise<boolean> {
  return (await findMissingProjectTrackIds(projectTrackIds)).length > 0;
}

export async function countResolvedTracks(
  projectTrackIds: string[]
): Promise<number> {
  return (await resolveProjectTracks(projectTrackIds)).length;
}

export async function countMissingTracks(
  projectTrackIds: string[]
): Promise<number> {
  return (await findMissingProjectTrackIds(projectTrackIds)).length;
}

export async function getProjectTrackResolverStatistics(
  projectTrackIds: string[]
): Promise<ProjectTrackResolverStats> {
  const resolved = await resolveProjectTracks(projectTrackIds);
  const missing = await findMissingProjectTrackIds(projectTrackIds);

  const seen = new Set<string>();
  let duplicates = 0;

  for (const id of projectTrackIds) {
    const value = String(id);

    if (seen.has(value)) {
      duplicates++;
    } else {
      seen.add(value);
    }
  }

  return {
    requested: projectTrackIds.length,
    resolved: resolved.length,
    missing: missing.length,
    duplicates,
  };
}

export async function getProjectTrackResolverResult(
  projectTrackIds: string[]
): Promise<ProjectTrackResolverResult> {
  const lookup = await buildProjectTrackLookup();
  const tracks = await resolveProjectTracks(projectTrackIds);
  const missingIds = await findMissingProjectTrackIds(projectTrackIds);

  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  for (const id of projectTrackIds) {
    const value = String(id);

    if (seen.has(value)) {
      duplicateIds.push(value);
    } else {
      seen.add(value);
    }
  }

  return {
    tracks,
    lookup,
    missingIds,
    duplicateIds,
    stats: {
      requested: projectTrackIds.length,
      resolved: tracks.length,
      missing: missingIds.length,
      duplicates: duplicateIds.length,
    },
  };
}

export async function sortResolvedTracks(
  projectTrackIds: string[],
  field: "title" | "artist" = "title"
): Promise<any[]> {
  const tracks = await resolveProjectTracks(projectTrackIds);

  return [...tracks].sort((a, b) =>
    String(a?.[field] ?? "").localeCompare(String(b?.[field] ?? ""))
  );
}

export async function filterResolvedTracks(
  projectTrackIds: string[],
  predicate: (track: any) => boolean
): Promise<any[]> {
  const tracks = await resolveProjectTracks(projectTrackIds);

  return tracks.filter(predicate);
}