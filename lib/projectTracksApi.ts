// lib/projectTracksApi.ts

import * as supabaseClientModule from "./supabaseClient";

function getSupabaseClient(): any {
  const anyMod = supabaseClientModule as any;
  return anyMod?.supabase ?? anyMod?.default ?? null;
}

function looksLikeUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export async function listLinkedProjectTrackIds(projectId: string): Promise<Set<string>> {
  if (!looksLikeUuid(projectId)) throw new Error("Invalid project id format.");

  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not found.");

  const { data, error } = await supabase
    .from("project_tracks")
    .select("track_id")
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);

  return new Set<string>((data ?? []).map((r: any) => String(r.track_id)));
}

export async function linkProjectTrack(projectId: string, trackId: string): Promise<void> {
  if (!looksLikeUuid(projectId)) throw new Error("Invalid project id format.");
  if (!trackId) throw new Error("Missing track id.");

  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not found.");

  const { data: existing, error: existingErr } = await supabase
    .from("project_tracks")
    .select("track_id")
    .eq("project_id", projectId)
    .eq("track_id", trackId)
    .limit(1);

  if (existingErr) throw new Error(existingErr.message);
  if (Array.isArray(existing) && existing.length > 0) return;

  const { error } = await supabase
    .from("project_tracks")
    .insert({ project_id: projectId, track_id: trackId });

  if (error) throw new Error(error.message);
}