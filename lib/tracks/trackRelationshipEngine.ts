import { getUnifiedTrackLibrary } from "./unifiedTrackLibrary";
import { normalizeTrack } from "./trackNormalizer";

export type TrackRelationship = {
  parent: any;
  related: any[];
};

function normalize(value: any): string {
  return String(value ?? "").trim().toLowerCase();
}

function sameTitle(a: any, b: any): boolean {
  return normalize(a.title) === normalize(b.title);
}

function sameArtist(a: any, b: any): boolean {
  return normalize(a.artist) === normalize(b.artist);
}

function sameAlbum(a: any, b: any): boolean {
  return normalize(a.album) === normalize(b.album);
}

function sameSource(a: any, b: any): boolean {
  return normalize(a.source) === normalize(b.source);
}

export async function getRelatedTracks(
  trackId: string
): Promise<any[]> {
  const library = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const parent =
    library.find((track) => String(track.id) === String(trackId)) ??
    null;

  if (!parent) {
    return [];
  }

  return library.filter((track) => {
    if (track.id === parent.id) {
      return false;
    }

    return (
      sameTitle(parent, track) ||
      sameArtist(parent, track) ||
      sameAlbum(parent, track)
    );
  });
}

export async function getTrackRelationship(
  trackId: string
): Promise<TrackRelationship | null> {
  const library = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const parent =
    library.find((track) => String(track.id) === String(trackId)) ??
    null;

  if (!parent) {
    return null;
  }

  return {
    parent,
    related: await getRelatedTracks(trackId),
  };
}

export async function findDuplicateTracks(): Promise<any[]> {
  const library = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const seen = new Set<string>();
  const duplicates: any[] = [];

  for (const track of library) {
    const key =
      `${normalize(track.title)}::${normalize(track.artist)}`;

    if (seen.has(key)) {
      duplicates.push(track);
    } else {
      seen.add(key);
    }
  }

  return duplicates;
}

export async function findAlternateVersions(
  title: string
): Promise<any[]> {
  const value = normalize(title);

  return (await getUnifiedTrackLibrary())
    .map(normalizeTrack)
    .filter((track) => normalize(track.title) === value);
}

export async function groupTracksByArtist(): Promise<
  Record<string, any[]>
> {
  const library = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const groups: Record<string, any[]> = {};

  for (const track of library) {
    const artist = track.artist || "Unknown";

    if (!groups[artist]) {
      groups[artist] = [];
    }

    groups[artist].push(track);
  }

  return groups;
}

export async function groupTracksByAlbum(): Promise<
  Record<string, any[]>
> {
  const library = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const groups: Record<string, any[]> = {};

  for (const track of library) {
    const album = track.album || "Unknown";

    if (!groups[album]) {
      groups[album] = [];
    }

    groups[album].push(track);
  }

  return groups;
}

export async function groupTracksBySource(): Promise<
  Record<string, any[]>
> {
  const library = (await getUnifiedTrackLibrary()).map(normalizeTrack);

  const groups: Record<string, any[]> = {};

  for (const track of library) {
    const source = track.source || "library";

    if (!groups[source]) {
      groups[source] = [];
    }

    groups[source].push(track);
  }

  return groups;
}

export async function getRelationshipStatistics() {
  const duplicates = await findDuplicateTracks();
  const artistGroups = await groupTracksByArtist();
  const albumGroups = await groupTracksByAlbum();
  const sourceGroups = await groupTracksBySource();

  return {
    duplicateTracks: duplicates.length,
    artists: Object.keys(artistGroups).length,
    albums: Object.keys(albumGroups).length,
    sources: Object.keys(sourceGroups).length,
  };
}

export async function areTracksRelated(
  firstId: string,
  secondId: string
): Promise<boolean> {
  const relationship = await getTrackRelationship(firstId);

  if (!relationship) {
    return false;
  }

  return relationship.related.some(
    (track) => String(track.id) === String(secondId)
  );
}