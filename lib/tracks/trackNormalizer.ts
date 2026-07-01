export function normalizeTrack(track: any) {
  return {
    ...track,
    id: String(track.id ?? ""),
    title: String(track.title ?? "Untitled"),
    artist: String(track.artist ?? ""),
    visibility: String(track.visibility ?? "shared"),
    source: String(track.source ?? "library"),
  };
}

export function normalizeTrackList(tracks: any[]) {
  return (Array.isArray(tracks) ? tracks : []).map(normalizeTrack);
}