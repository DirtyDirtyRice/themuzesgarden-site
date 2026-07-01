import { getUnifiedTrackLibrary } from "../tracks/unifiedTrackLibrary";
import { normalizeTrack } from "../tracks/trackNormalizer";

export type ProjectTrackAnalytics = {
  totalTracks: number;
  uniqueTitles: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  uniqueGenres: number;
  uniqueSources: number;
  averageTitleLength: number;
  averageArtistLength: number;
  favoriteTracks: number;
  privateTracks: number;
  publicTracks: number;
};

export async function buildProjectTrackAnalytics(): Promise<ProjectTrackAnalytics> {
  const tracks = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const titles = new Set<string>();
  const artists = new Set<string>();
  const albums = new Set<string>();
  const genres = new Set<string>();
  const sources = new Set<string>();

  let favoriteTracks = 0;
  let privateTracks = 0;

  let totalTitleLength = 0;
  let totalArtistLength = 0;

  for (const track of tracks) {
    titles.add(track.title);
    artists.add(track.artist);
    albums.add(track.album);
    genres.add(track.genre);
    sources.add(track.source);

    totalTitleLength += track.title.length;
    totalArtistLength += track.artist.length;

    if (track.favorite) {
      favoriteTracks++;
    }

    if (String(track.visibility).toLowerCase() === "private") {
      privateTracks++;
    }
  }

  return {
    totalTracks: tracks.length,
    uniqueTitles: titles.size,
    uniqueArtists: artists.size,
    uniqueAlbums: albums.size,
    uniqueGenres: genres.size,
    uniqueSources: sources.size,
    averageTitleLength:
      tracks.length === 0
        ? 0
        : Math.round(totalTitleLength / tracks.length),
    averageArtistLength:
      tracks.length === 0
        ? 0
        : Math.round(totalArtistLength / tracks.length),
    favoriteTracks,
    privateTracks,
    publicTracks: tracks.length - privateTracks,
  };
}

export async function getTracksByGenre(): Promise<Record<string, number>> {
  const tracks = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const results: Record<string, number> = {};

  for (const track of tracks) {
    const genre = track.genre || "Unknown";

    results[genre] = (results[genre] ?? 0) + 1;
  }

  return results;
}

export async function getTracksBySource(): Promise<Record<string, number>> {
  const tracks = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const results: Record<string, number> = {};

  for (const track of tracks) {
    const source = track.source || "Unknown";

    results[source] = (results[source] ?? 0) + 1;
  }

  return results;
}

export async function getArtistLeaderboard(
  limit = 10
): Promise<{ artist: string; tracks: number }[]> {
  const tracks = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const counts = new Map<string, number>();

  for (const track of tracks) {
    counts.set(
      track.artist,
      (counts.get(track.artist) ?? 0) + 1
    );
  }

  return [...counts.entries()]
    .map(([artist, tracks]) => ({
      artist,
      tracks,
    }))
    .sort((a, b) => b.tracks - a.tracks)
    .slice(0, limit);
}

export async function getAlbumLeaderboard(
  limit = 10
): Promise<{ album: string; tracks: number }[]> {
  const tracks = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const counts = new Map<string, number>();

  for (const track of tracks) {
    counts.set(
      track.album,
      (counts.get(track.album) ?? 0) + 1
    );
  }

  return [...counts.entries()]
    .map(([album, tracks]) => ({
      album,
      tracks,
    }))
    .sort((a, b) => b.tracks - a.tracks)
    .slice(0, limit);
}

export async function getProjectTrackHealthScore(): Promise<number> {
  const analytics = await buildProjectTrackAnalytics();

  if (analytics.totalTracks === 0) {
    return 100;
  }

  let score = 100;

  score -= analytics.privateTracks;

  return Math.max(0, score);
}

export async function getProjectAnalyticsSnapshot() {
  return {
    analytics: await buildProjectTrackAnalytics(),
    genres: await getTracksByGenre(),
    sources: await getTracksBySource(),
    topArtists: await getArtistLeaderboard(5),
    topAlbums: await getAlbumLeaderboard(5),
    healthScore: await getProjectTrackHealthScore(),
    generatedAt: new Date().toISOString(),
  };
}