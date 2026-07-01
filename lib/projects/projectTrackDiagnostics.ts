export type ProjectTrackDiagnosticsResult = {
  projectId: string;
  totalTracks: number;
  uniqueTracks: number;
  duplicateTracks: number;
  ids: string[];
  titles: string[];
  artists: string[];
  missingIds: number;
  missingTitles: number;
  missingArtists: number;
  missingSources: number;
  privateTracks: number;
  publicTracks: number;
  averageTitleLength: number;
  averageArtistLength: number;
};

export function projectTrackDiagnostics(
  projectId: string,
  tracks: any[]
): ProjectTrackDiagnosticsResult {
  const list = Array.isArray(tracks) ? tracks : [];

  const ids = list.map((track) => String(track.id ?? ""));
  const titles = list.map((track) => String(track.title ?? ""));
  const artists = list.map((track) => String(track.artist ?? ""));

  const uniqueIds = new Set(ids.filter(Boolean));

  const duplicateTracks = ids.length - uniqueIds.size;

  const missingIds = list.filter(
    (track) => !String(track.id ?? "").trim()
  ).length;

  const missingTitles = list.filter(
    (track) => !String(track.title ?? "").trim()
  ).length;

  const missingArtists = list.filter(
    (track) => !String(track.artist ?? "").trim()
  ).length;

  const missingSources = list.filter(
    (track) => !String(track.source ?? "").trim()
  ).length;

  const privateTracks = list.filter(
    (track) =>
      String(track.visibility ?? "shared").toLowerCase() === "private"
  ).length;

  const publicTracks = list.length - privateTracks;

  const averageTitleLength =
    titles.length === 0
      ? 0
      : Math.round(
          titles.reduce((sum, title) => sum + title.length, 0) /
            titles.length
        );

  const averageArtistLength =
    artists.length === 0
      ? 0
      : Math.round(
          artists.reduce((sum, artist) => sum + artist.length, 0) /
            artists.length
        );

  return {
    projectId: String(projectId),
    totalTracks: list.length,
    uniqueTracks: uniqueIds.size,
    duplicateTracks,
    ids,
    titles,
    artists,
    missingIds,
    missingTitles,
    missingArtists,
    missingSources,
    privateTracks,
    publicTracks,
    averageTitleLength,
    averageArtistLength,
  };
}

export function hasProjectTrackIssues(
  projectId: string,
  tracks: any[]
): boolean {
  const diagnostics = projectTrackDiagnostics(projectId, tracks);

  return (
    diagnostics.duplicateTracks > 0 ||
    diagnostics.missingIds > 0 ||
    diagnostics.missingTitles > 0 ||
    diagnostics.missingArtists > 0 ||
    diagnostics.missingSources > 0
  );
}

export function getProjectTrackIssueSummary(
  projectId: string,
  tracks: any[]
): string[] {
  const diagnostics = projectTrackDiagnostics(projectId, tracks);

  const issues: string[] = [];

  if (diagnostics.duplicateTracks) {
    issues.push(`${diagnostics.duplicateTracks} duplicate tracks`);
  }

  if (diagnostics.missingIds) {
    issues.push(`${diagnostics.missingIds} missing IDs`);
  }

  if (diagnostics.missingTitles) {
    issues.push(`${diagnostics.missingTitles} missing titles`);
  }

  if (diagnostics.missingArtists) {
    issues.push(`${diagnostics.missingArtists} missing artists`);
  }

  if (diagnostics.missingSources) {
    issues.push(`${diagnostics.missingSources} missing sources`);
  }

  return issues;
}

export function printProjectTrackDiagnostics(
  projectId: string,
  tracks: any[]
): void {
  console.table(projectTrackDiagnostics(projectId, tracks));
}