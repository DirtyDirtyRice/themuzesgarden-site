export function canViewTrack(
  track: any,
  userId?: string | null,
  ownerId?: string | null
): boolean {
  if (!track) {
    return false;
  }

  const visibility = String(track.visibility ?? "shared").toLowerCase();

  switch (visibility) {
    case "public":
    case "shared":
    case "library":
      return true;

    case "private":
      return (
        !!userId &&
        !!ownerId &&
        String(userId) === String(ownerId)
      );

    default:
      return true;
  }
}

export function isPrivateTrack(track: any): boolean {
  return (
    String(track?.visibility ?? "shared").toLowerCase() === "private"
  );
}

export function isPublicTrack(track: any): boolean {
  return (
    String(track?.visibility ?? "shared").toLowerCase() !== "private"
  );
}

export function filterVisibleTracks(
  tracks: any[],
  userId?: string | null,
  ownerId?: string | null
): any[] {
  return (Array.isArray(tracks) ? tracks : []).filter((track) =>
    canViewTrack(track, userId, ownerId)
  );
}

export function filterPrivateTracks(tracks: any[]): any[] {
  return (Array.isArray(tracks) ? tracks : []).filter(isPrivateTrack);
}

export function filterPublicTracks(tracks: any[]): any[] {
  return (Array.isArray(tracks) ? tracks : []).filter(isPublicTrack);
}

export function countVisibleTracks(
  tracks: any[],
  userId?: string | null,
  ownerId?: string | null
): number {
  return filterVisibleTracks(tracks, userId, ownerId).length;
}

export function countHiddenTracks(
  tracks: any[],
  userId?: string | null,
  ownerId?: string | null
): number {
  const list = Array.isArray(tracks) ? tracks : [];

  return (
    list.length -
    filterVisibleTracks(list, userId, ownerId).length
  );
}

export function groupTracksByVisibility(
  tracks: any[]
): {
  publicTracks: any[];
  privateTracks: any[];
} {
  const list = Array.isArray(tracks) ? tracks : [];

  return {
    publicTracks: filterPublicTracks(list),
    privateTracks: filterPrivateTracks(list),
  };
}

export function getTrackVisibilityStatistics(
  tracks: any[],
  userId?: string | null,
  ownerId?: string | null
) {
  const list = Array.isArray(tracks) ? tracks : [];

  return {
    totalTracks: list.length,
    visibleTracks: countVisibleTracks(
      list,
      userId,
      ownerId
    ),
    hiddenTracks: countHiddenTracks(
      list,
      userId,
      ownerId
    ),
    publicTracks: filterPublicTracks(list).length,
    privateTracks: filterPrivateTracks(list).length,
  };
}

export function sortVisibleTracks(
  tracks: any[],
  userId?: string | null,
  ownerId?: string | null
): any[] {
  return [...filterVisibleTracks(tracks, userId, ownerId)].sort(
    (a, b) =>
      String(a.title ?? "").localeCompare(
        String(b.title ?? "")
      )
  );
}