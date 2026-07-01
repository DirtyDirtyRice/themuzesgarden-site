export function normalizeTrack(track: any) {
  const normalized = {
    ...track,
    id: String(track.id ?? ""),
    title: String(track.title ?? "Untitled"),
    artist: String(track.artist ?? ""),
    album: String(track.album ?? ""),
    genre: String(track.genre ?? ""),
    tags: String(track.tags ?? ""),
    source: String(track.source ?? "library"),
    visibility: String(track.visibility ?? "shared"),
    duration: Number(track.duration ?? 0),
    bpm: Number(track.bpm ?? 0),
    key: String(track.key ?? ""),
    favorite: Boolean(track.favorite ?? false),
    createdAt: String(track.createdAt ?? ""),
    updatedAt: String(track.updatedAt ?? ""),
  };

  normalized.title = normalized.title.trim();
  normalized.artist = normalized.artist.trim();
  normalized.album = normalized.album.trim();
  normalized.genre = normalized.genre.trim();
  normalized.tags = normalized.tags.trim();

  return normalized;
}

export function normalizeTrackList(tracks: any[]) {
  return (Array.isArray(tracks) ? tracks : []).map(normalizeTrack);
}

export function normalizeTrackMap(
  tracks: any[]
): Map<string, any> {
  const map = new Map<string, any>();

  for (const track of normalizeTrackList(tracks)) {
    map.set(track.id, track);
  }

  return map;
}

export function normalizeTrackLookup(
  tracks: any[]
): Record<string, any> {
  const lookup: Record<string, any> = {};

  for (const track of normalizeTrackList(tracks)) {
    lookup[track.id] = track;
  }

  return lookup;
}

export function normalizeTrackTitles(
  tracks: any[]
): string[] {
  return normalizeTrackList(tracks).map((track) => track.title);
}

export function normalizeTrackArtists(
  tracks: any[]
): string[] {
  return normalizeTrackList(tracks).map((track) => track.artist);
}

export function normalizeUniqueTracks(
  tracks: any[]
): any[] {
  const seen = new Set<string>();
  const results: any[] = [];

  for (const track of normalizeTrackList(tracks)) {
    const key =
      track.id ||
      `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    results.push(track);
  }

  return results;
}

export function normalizeTrackStatistics(tracks: any[]) {
  const normalized = normalizeTrackList(tracks);

  const artists = new Set<string>();
  const albums = new Set<string>();
  const genres = new Set<string>();

  for (const track of normalized) {
    if (track.artist) artists.add(track.artist);
    if (track.album) albums.add(track.album);
    if (track.genre) genres.add(track.genre);
  }

  return {
    totalTracks: normalized.length,
    uniqueArtists: artists.size,
    uniqueAlbums: albums.size,
    uniqueGenres: genres.size,
  };
}

export function normalizeTrackForExport(track: any) {
  const normalized = normalizeTrack(track);

  return {
    id: normalized.id,
    title: normalized.title,
    artist: normalized.artist,
    album: normalized.album,
    genre: normalized.genre,
    bpm: normalized.bpm,
    key: normalized.key,
    source: normalized.source,
    visibility: normalized.visibility,
  };
}