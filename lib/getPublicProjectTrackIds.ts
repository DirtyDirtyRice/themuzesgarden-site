import { supabase } from "./supabaseClient";

export async function getPublicProjectTrackIds(): Promise<string[]> {
  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("visibility", "public");

  if (projectError) throw new Error(projectError.message);

  const projectIds = (projects ?? [])
    .map((project) => String(project.id ?? "").trim())
    .filter(Boolean);

  if (projectIds.length === 0) return [];

  const { data: links, error: linkError } = await supabase
    .from("project_tracks")
    .select("track_id")
    .in("project_id", projectIds);

  if (linkError) throw new Error(linkError.message);

  return Array.from(
    new Set(
      (links ?? [])
        .map((link) => String(link.track_id ?? "").trim())
        .filter(Boolean),
    ),
  );
}