import type { DecoratedLibraryTrack } from "./libraryTrackDecorators";
import type { LibraryTrackSource } from "./libraryTrackSource";

export type LibraryVisibilityFilter = "all" | "public" | "private";

export function filterTracksByVisibility<TTrack>(
  tracks: Array<DecoratedLibraryTrack<TTrack>>,
  visibility: LibraryVisibilityFilter
): Array<DecoratedLibraryTrack<TTrack>> {
  if (visibility === "all") return tracks;
  return tracks.filter((track) => track.libraryAccess.visibility === visibility);
}

export function filterTracksBySource<TTrack>(
  tracks: Array<DecoratedLibraryTrack<TTrack>>,
  source: LibraryTrackSource | "all"
): Array<DecoratedLibraryTrack<TTrack>> {
  if (source === "all") return tracks;
  return tracks.filter((track) => track.librarySource === source);
}

export function splitTracksByVisibility<TTrack>(
  tracks: Array<DecoratedLibraryTrack<TTrack>>
) {
  return {
    publicTracks: tracks.filter(
      (track) => track.libraryAccess.visibility === "public"
    ),
    privateTracks: tracks.filter(
      (track) => track.libraryAccess.visibility === "private"
    ),
  };
}