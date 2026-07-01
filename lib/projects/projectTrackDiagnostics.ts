export function projectTrackDiagnostics(
  projectId: string,
  tracks: any[]
) {
  return {
    projectId,
    totalTracks: tracks.length,
    ids: tracks.map((t) => String(t.id)),
    missingTitles: tracks.filter((t) => !t.title).length,
    missingArtists: tracks.filter((t) => !t.artist).length,
  };
}