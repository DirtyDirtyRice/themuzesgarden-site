export function getProjectTrackSourceLabel(track: any): string {
  const src =
    track?.source ??
    track?.librarySource ??
    track?.origin ??
    "";

  const clean = String(src).toLowerCase();

  if (clean.includes("supabase")) return "Supabase";
  if (clean.includes("upload")) return "Upload";
  if (clean.includes("project")) return "Project";

  return "Library";
}

export function getProjectTrackVisibilityLabel(track: any): string {
  const v = String(track?.visibility ?? "public").toLowerCase();

  if (v === "private") return "Private";
  if (v === "shared") return "Shared";

  return "Public";
}