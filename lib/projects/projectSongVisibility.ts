export type ProjectSongVisibility = "private" | "public";

export function normalizeProjectSongVisibility(
  value: unknown,
): ProjectSongVisibility {
  return String(value ?? "").trim().toLowerCase() === "public"
    ? "public"
    : "private";
}

export function isProjectSongPublic(args: {
  projectVisibility: unknown;
  songVisibility: unknown;
}): boolean {
  return (
    String(args.projectVisibility ?? "").trim().toLowerCase() === "public" &&
    normalizeProjectSongVisibility(args.songVisibility) === "public"
  );
}

export function summarizeProjectSongVisibility(
  linkedTrackIds: Iterable<string>,
  visibilityByTrackId: Record<string, ProjectSongVisibility>,
): { privateCount: number; publicCount: number; totalCount: number } {
  let privateCount = 0;
  let publicCount = 0;
  for (const trackId of linkedTrackIds) {
    if (normalizeProjectSongVisibility(visibilityByTrackId[trackId]) === "public") publicCount += 1;
    else privateCount += 1;
  }
  return { privateCount, publicCount, totalCount: privateCount + publicCount };
}
