import {
  buildLibraryTrackAccess,
  type LibraryTrackAccess,
} from "./libraryTrackAccess";
import {
  getLibraryTrackSourceLabel,
  normalizeLibraryTrackSource,
  type LibraryTrackSource,
} from "./libraryTrackSource";

export type DecoratedLibraryTrack<TTrack> = TTrack & {
  libraryAccess: LibraryTrackAccess;
  librarySource: LibraryTrackSource;
  librarySourceLabel: string;
  libraryVisibilityLabel: string;
};

export function getLibraryVisibilityLabel(access: LibraryTrackAccess): string {
  return access.visibility === "private" ? "Private" : "Public";
}

export function decorateLibraryTrack<TTrack extends Record<string, unknown>>(
  track: TTrack,
  options?: {
    visibility?: unknown;
    sharedWithMemberIds?: unknown;
    source?: unknown;
  }
): DecoratedLibraryTrack<TTrack> {
  const libraryAccess = buildLibraryTrackAccess({
    visibility: options?.visibility,
    sharedWithMemberIds: options?.sharedWithMemberIds,
  });

  const librarySource = normalizeLibraryTrackSource(options?.source);

  return {
    ...track,
    libraryAccess,
    librarySource,
    librarySourceLabel: getLibraryTrackSourceLabel(librarySource),
    libraryVisibilityLabel: getLibraryVisibilityLabel(libraryAccess),
  };
}

export function decorateLibraryTracks<TTrack extends Record<string, unknown>>(
  tracks: TTrack[],
  getOptions?: (
    track: TTrack,
    index: number
  ) => {
    visibility?: unknown;
    sharedWithMemberIds?: unknown;
    source?: unknown;
  }
): Array<DecoratedLibraryTrack<TTrack>> {
  return tracks.map((track, index) => {
    const options = getOptions ? getOptions(track, index) : undefined;
    return decorateLibraryTrack(track, options);
  });
}