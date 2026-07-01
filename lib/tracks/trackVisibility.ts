export function canViewTrack(
  track: any,
  userId?: string | null,
  ownerId?: string | null
) {
  if (!track) return false;

  if (String(track.visibility ?? "shared") !== "private") {
    return true;
  }

  return (
    !!userId &&
    !!ownerId &&
    String(userId) === String(ownerId)
  );
}

export function filterVisibleTracks(
  tracks: any[],
  userId?: string | null,
  ownerId?: string | null
) {
  return (Array.isArray(tracks) ? tracks : []).filter((track) =>
    canViewTrack(track, userId, ownerId)
  );
}