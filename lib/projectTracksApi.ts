// lib/projectTracksApi.ts

import * as supabaseClientModule from "./supabaseClient";

function getSupabaseClient(): any {
  const anyMod = supabaseClientModule as any;
  return anyMod?.supabase ?? anyMod?.default ?? null;
}

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function looksLikeUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function requireProjectId(projectId: unknown): string {
  const clean = cleanString(projectId);
  if (!looksLikeUuid(clean)) {
    throw new Error("Invalid project id format.");
  }
  return clean;
}

function requireTrackId(trackId: unknown): string {
  const clean = cleanString(trackId);
  if (!clean) {
    throw new Error("Missing track id.");
  }
  return clean;
}

function emitProjectTracksChanged(projectId: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("muzes:projectTracksChanged", {
      detail: { projectId },
    })
  );
}

export async function listLinkedProjectTrackIds(
  projectId: string
): Promise<Set<string>> {
  const cleanProjectId = requireProjectId(projectId);

  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not found.");

  const { data, error } = await supabase
    .from("project_tracks")
    .select("track_id")
    .eq("project_id", cleanProjectId);

  if (error) throw new Error(error.message);

  const ids = (data ?? [])
    .map((row: any) => cleanString(row?.track_id))
    .filter(Boolean);

  return new Set<string>(ids);
}

export async function linkProjectTrack(
  projectId: string,
  trackId: string
): Promise<void> {
  const cleanProjectId = requireProjectId(projectId);
  const cleanTrackId = requireTrackId(trackId);

  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not found.");

  const { data: existing, error: existingErr } = await supabase
    .from("project_tracks")
    .select("track_id")
    .eq("project_id", cleanProjectId)
    .eq("track_id", cleanTrackId)
    .limit(1);

  if (existingErr) throw new Error(existingErr.message);

  if (Array.isArray(existing) && existing.length > 0) {
    emitProjectTracksChanged(cleanProjectId);
    return;
  }

  const { error } = await supabase.from("project_tracks").insert({
    project_id: cleanProjectId,
    track_id: cleanTrackId,
  });

  if (error) throw new Error(error.message);

  emitProjectTracksChanged(cleanProjectId);
}

export async function unlinkProjectTrack(
  projectId: string,
  trackId: string
): Promise<void> {
  const cleanProjectId = requireProjectId(projectId);
  const cleanTrackId = requireTrackId(trackId);

  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not found.");

  const { error } = await supabase
    .from("project_tracks")
    .delete()
    .eq("project_id", cleanProjectId)
    .eq("track_id", cleanTrackId);

  if (error) throw new Error(error.message);

  emitProjectTracksChanged(cleanProjectId);
}

export async function replaceProjectTracks(
  projectId: string,
  trackIds: Iterable<unknown>
): Promise<void> {
  const cleanProjectId = requireProjectId(projectId);

  const nextIds: string[] = [];
  const seen = new Set<string>();

  for (const value of trackIds) {
    const clean = cleanString(value);
    if (!clean) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    nextIds.push(clean);
  }

  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase client not found.");

  const { data: existingRows, error: readErr } = await supabase
    .from("project_tracks")
    .select("track_id")
    .eq("project_id", cleanProjectId);

  if (readErr) throw new Error(readErr.message);

  const existingIds = new Set<string>(
    (existingRows ?? [])
      .map((row: any) => cleanString(row?.track_id))
      .filter(Boolean)
  );

  const nextIdSet = new Set<string>(nextIds);

  const idsToDelete = [...existingIds].filter((id) => !nextIdSet.has(id));
  const idsToInsert = nextIds.filter((id) => !existingIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteErr } = await supabase
      .from("project_tracks")
      .delete()
      .eq("project_id", cleanProjectId)
      .in("track_id", idsToDelete);

    if (deleteErr) throw new Error(deleteErr.message);
  }

  if (idsToInsert.length > 0) {
    const rows = idsToInsert.map((id) => ({
      project_id: cleanProjectId,
      track_id: id,
    }));

    const { error: insertErr } = await supabase
      .from("project_tracks")
      .insert(rows);

    if (insertErr) throw new Error(insertErr.message);
  }

  emitProjectTracksChanged(cleanProjectId);
}