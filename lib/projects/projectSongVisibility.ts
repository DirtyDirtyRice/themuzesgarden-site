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
