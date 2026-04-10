export type LibraryTrackSource =
  | "seed"
  | "upload"
  | "supabase"
  | "project"
  | "unknown";

export function normalizeLibraryTrackSource(
  value: unknown
): LibraryTrackSource {
  const clean = String(value ?? "").trim().toLowerCase();

  if (clean === "seed") return "seed";
  if (clean === "upload") return "upload";
  if (clean === "supabase") return "supabase";
  if (clean === "project") return "project";

  return "unknown";
}

export function getLibraryTrackSourceLabel(
  source: LibraryTrackSource
): string {
  switch (source) {
    case "seed":
      return "Seed Library";
    case "upload":
      return "Uploaded";
    case "supabase":
      return "Supabase";
    case "project":
      return "Project";
    default:
      return "Library";
  }
}