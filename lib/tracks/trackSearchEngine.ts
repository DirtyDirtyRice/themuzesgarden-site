import { getUnifiedTrackLibrary } from "./unifiedTrackLibrary";
import { normalizeTrack } from "./trackNormalizer";

export type TrackSearchOptions = {
  query?: string;
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  tags?: string;
  source?: string;
  visibility?: string;
  favorite?: boolean;
  sortBy?: "title" | "artist" | "album" | "genre";
  limit?: number;
};

function contains(value: any, search: string): boolean {
  return String(value ?? "")
    .toLowerCase()
    .includes(search.toLowerCase());
}

function scoreTrack(track: any, query: string): number {
  if (!query) return 0;

  let score = 0;

  if (contains(track.title, query)) score += 10;
  if (contains(track.artist, query)) score += 8;
  if (contains(track.album, query)) score += 6;
  if (contains(track.genre, query)) score += 5;
  if (contains(track.tags, query)) score += 4;
  if (contains(track.source, query)) score += 2;

  return score;
}

export async function searchTracks(
  options: TrackSearchOptions = {}
): Promise<any[]> {
  let tracks = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  if (options.query) {
    tracks = tracks
      .map((track) => ({
        ...track,
        __score: scoreTrack(track, options.query!),
      }))
      .filter((track) => track.__score > 0)
      .sort((a, b) => b.__score - a.__score);
  }

  if (options.title) {
    tracks = tracks.filter((t) => contains(t.title, options.title!));
  }

  if (options.artist) {
    tracks = tracks.filter((t) => contains(t.artist, options.artist!));
  }

  if (options.album) {
    tracks = tracks.filter((t) => contains(t.album, options.album!));
  }

  if (options.genre) {
    tracks = tracks.filter((t) => contains(t.genre, options.genre!));
  }

  if (options.tags) {
    tracks = tracks.filter((t) => contains(t.tags, options.tags!));
  }

  if (options.source) {
    tracks = tracks.filter((t) => t.source === options.source);
  }

  if (options.visibility) {
    tracks = tracks.filter(
      (t) => t.visibility === options.visibility
    );
  }

  if (typeof options.favorite === "boolean") {
    tracks = tracks.filter(
      (t) => t.favorite === options.favorite
    );
  }

  switch (options.sortBy) {
    case "artist":
      tracks.sort((a, b) => a.artist.localeCompare(b.artist));
      break;

    case "album":
      tracks.sort((a, b) => a.album.localeCompare(b.album));
      break;

    case "genre":
      tracks.sort((a, b) => a.genre.localeCompare(b.genre));
      break;

    default:
      tracks.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (options.limit && options.limit > 0) {
    tracks = tracks.slice(0, options.limit);
  }

  return tracks;
}

export async function searchTrackById(
  id: string
): Promise<any | null> {
  const tracks = await getUnifiedTrackLibrary();

  return (
    tracks.find((track) => String(track.id) === String(id)) ??
    null
  );
}

export async function searchTrackByExactTitle(
  title: string
): Promise<any[]> {
  const value = title.toLowerCase();

  return (await getUnifiedTrackLibrary()).filter(
    (track) =>
      String(track.title).toLowerCase() === value
  );
}

export async function searchTrackByArtist(
  artist: string
): Promise<any[]> {
  const value = artist.toLowerCase();

  return (await getUnifiedTrackLibrary()).filter(
    (track) =>
      String(track.artist).toLowerCase().includes(value)
  );
}

export async function searchTrackByTag(
  tag: string
): Promise<any[]> {
  const value = tag.toLowerCase();

  return (await getUnifiedTrackLibrary()).filter(
    (track) =>
      String(track.tags ?? "").toLowerCase().includes(value)
  );
}

export async function searchTrackBySource(
  source: string
): Promise<any[]> {
  return (await getUnifiedTrackLibrary()).filter(
    (track) =>
      String(track.source ?? "").toLowerCase() ===
      source.toLowerCase()
  );
}

export async function getTrackSearchStatistics() {
  const tracks = await getUnifiedTrackLibrary();

  return {
    totalTracks: tracks.length,
    titles: new Set(
      tracks.map((t) => String(t.title))
    ).size,
    artists: new Set(
      tracks.map((t) => String(t.artist))
    ).size,
    albums: new Set(
      tracks.map((t) => String(t.album ?? ""))
    ).size,
    genres: new Set(
      tracks.map((t) => String(t.genre ?? ""))
    ).size,
  };
}