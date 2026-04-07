export function selectTopLinkedTracks(tracks: any[], limit = 5) {
  if (!Array.isArray(tracks)) return [];
  return tracks.slice(0, limit);
}

export function selectOrderedTracks(
  linkedTracks: any[],
  order: string[]
) {
  if (!linkedTracks.length) return [];

  const map = new Map<string, any>();
  for (const t of linkedTracks) {
    map.set(String(t.id), t);
  }

  const ordered = order
    .map((id) => map.get(String(id)))
    .filter(Boolean);

  const missing = linkedTracks.filter(
    (t) => !order.includes(String(t.id))
  );

  return [...ordered, ...missing];
}

export function selectNowPlayingTrack(
  tracks: any[],
  nowPlayingId: string | null
) {
  if (!nowPlayingId) return null;
  return tracks.find((t) => String(t.id) === nowPlayingId) ?? null;
}