import { getUnifiedTrackLibrary } from "../tracks/unifiedTrackLibrary";
import { normalizeTrack } from "../tracks/trackNormalizer";

export type ProjectTrackIndex = {
  byId: Map<string, any>;
  byTitle: Map<string, any[]>;
  byArtist: Map<string, any[]>;
  byAlbum: Map<string, any[]>;
  bySource: Map<string, any[]>;
};

let cachedIndex: ProjectTrackIndex | null = null;
let lastBuilt = 0;

const CACHE_TIME = 5 * 60 * 1000;

function addToGroup(
  map: Map<string, any[]>,
  key: string,
  track: any
) {
  const value = key.trim() || "Unknown";

  if (!map.has(value)) {
    map.set(value, []);
  }

  map.get(value)!.push(track);
}

export async function buildProjectTrackIndex(
  forceRefresh = false
): Promise<ProjectTrackIndex> {
  const expired = Date.now() - lastBuilt > CACHE_TIME;

  if (!forceRefresh && cachedIndex && !expired) {
    return cachedIndex;
  }

  const tracks = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const byId = new Map<string, any>();
  const byTitle = new Map<string, any[]>();
  const byArtist = new Map<string, any[]>();
  const byAlbum = new Map<string, any[]>();
  const bySource = new Map<string, any[]>();

  for (const track of tracks) {
    byId.set(track.id, track);

    addToGroup(byTitle, track.title, track);
    addToGroup(byArtist, track.artist, track);
    addToGroup(byAlbum, track.album, track);
    addToGroup(bySource, track.source, track);
  }

  cachedIndex = {
    byId,
    byTitle,
    byArtist,
    byAlbum,
    bySource,
  };

  lastBuilt = Date.now();

  return cachedIndex;
}

export async function getIndexedTrackById(
  id: string
): Promise<any | null> {
  const index = await buildProjectTrackIndex();

  return index.byId.get(String(id)) ?? null;
}

export async function getIndexedTracksByTitle(
  title: string
): Promise<any[]> {
  const index = await buildProjectTrackIndex();

  return index.byTitle.get(title.trim()) ?? [];
}

export async function getIndexedTracksByArtist(
  artist: string
): Promise<any[]> {
  const index = await buildProjectTrackIndex();

  return index.byArtist.get(artist.trim()) ?? [];
}

export async function getIndexedTracksByAlbum(
  album: string
): Promise<any[]> {
  const index = await buildProjectTrackIndex();

  return index.byAlbum.get(album.trim()) ?? [];
}

export async function getIndexedTracksBySource(
  source: string
): Promise<any[]> {
  const index = await buildProjectTrackIndex();

  return index.bySource.get(source.trim()) ?? [];
}

export async function getProjectTrackIndexStatistics() {
  const index = await buildProjectTrackIndex();

  return {
    totalTracks: index.byId.size,
    titles: index.byTitle.size,
    artists: index.byArtist.size,
    albums: index.byAlbum.size,
    sources: index.bySource.size,
    cacheAgeMs: Date.now() - lastBuilt,
  };
}

export function clearProjectTrackIndex(): void {
  cachedIndex = null;
  lastBuilt = 0;
}

export function hasProjectTrackIndex(): boolean {
  return cachedIndex !== null;
}