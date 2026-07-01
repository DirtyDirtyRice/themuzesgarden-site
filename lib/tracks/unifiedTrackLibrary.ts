import { getSupabaseTracks } from "../getSupabaseTracks";
import { getUploadedTracks } from "../uploadedTracks";
import { mergeTrackLists } from "../../app/library/libraryUtils";

let cachedTracks: any[] | null = null;
let lastLoadedAt = 0;

const CACHE_LIFETIME_MS = 5 * 60 * 1000;

function normalizeTracks(tracks: any[]): any[] {
  return (Array.isArray(tracks) ? tracks : []).map((track: any) => ({
    ...track,
    id: String(track.id ?? ""),
    title: String(track.title ?? ""),
    artist: String(track.artist ?? ""),
    source: String(track.source ?? "library"),
  }));
}

function deduplicateTracks(tracks: any[]): any[] {
  const seen = new Set<string>();
  const results: any[] = [];

  for (const track of tracks) {
    const key =
      String(track.id) ||
      `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(track);
  }

  return results;
}

async function loadLibrary(): Promise<any[]> {
  const supabaseTracks = await getSupabaseTracks();
  const uploadedTracks = getUploadedTracks();

  const merged = mergeTrackLists(
    normalizeTracks(supabaseTracks),
    normalizeTracks(uploadedTracks)
  );

  return deduplicateTracks(merged);
}

export async function getUnifiedTrackLibrary(
  forceRefresh = false
): Promise<any[]> {
  const expired = Date.now() - lastLoadedAt > CACHE_LIFETIME_MS;

  if (!forceRefresh && cachedTracks && !expired) {
    return cachedTracks;
  }

  cachedTracks = await loadLibrary();
  lastLoadedAt = Date.now();

  return cachedTracks;
}

export async function refreshUnifiedTrackLibrary(): Promise<any[]> {
  return getUnifiedTrackLibrary(true);
}

export async function getUnifiedTrackLookup(): Promise<Map<string, any>> {
  const library = await getUnifiedTrackLibrary();

  const lookup = new Map<string, any>();

  for (const track of library) {
    lookup.set(String(track.id), track);
  }

  return lookup;
}

export async function getUnifiedTrackById(
  trackId: string
): Promise<any | null> {
  const lookup = await getUnifiedTrackLookup();
  return lookup.get(String(trackId)) ?? null;
}

export async function findTracksByTitle(
  title: string
): Promise<any[]> {
  const value = title.toLowerCase();

  return (await getUnifiedTrackLibrary()).filter((track) =>
    String(track.title).toLowerCase().includes(value)
  );
}

export async function findTracksByArtist(
  artist: string
): Promise<any[]> {
  const value = artist.toLowerCase();

  return (await getUnifiedTrackLibrary()).filter((track) =>
    String(track.artist).toLowerCase().includes(value)
  );
}

export async function filterUnifiedTracks(
  predicate: (track: any) => boolean
): Promise<any[]> {
  return (await getUnifiedTrackLibrary()).filter(predicate);
}

export async function sortUnifiedTracks(
  field: "title" | "artist" = "title"
): Promise<any[]> {
  const tracks = await getUnifiedTrackLibrary();

  return [...tracks].sort((a, b) =>
    String(a[field] ?? "").localeCompare(String(b[field] ?? ""))
  );
}

export async function getUnifiedTrackStatistics() {
  const tracks = await getUnifiedTrackLibrary();

  const artists = new Set<string>();
  const titles = new Set<string>();
  const sources = new Map<string, number>();

  for (const track of tracks) {
    artists.add(String(track.artist));
    titles.add(String(track.title));

    const source = String(track.source ?? "library");

    sources.set(source, (sources.get(source) ?? 0) + 1);
  }

  return {
    totalTracks: tracks.length,
    uniqueArtists: artists.size,
    uniqueTitles: titles.size,
    sources: Object.fromEntries(sources),
    cacheLoaded: cachedTracks !== null,
    lastLoadedAt,
  };
}

export function clearUnifiedTrackLibraryCache(): void {
  cachedTracks = null;
  lastLoadedAt = 0;
}

export function hasUnifiedTrackCache(): boolean {
  return cachedTracks !== null;
}

export function getUnifiedTrackCacheSize(): number {
  return cachedTracks?.length ?? 0;
}