import * as supabaseClientModule from "./supabaseClient";

const supabase: any =
  (supabaseClientModule as any).supabase ??
  (supabaseClientModule as any).default ??
  (supabaseClientModule as any).client ??
  (supabaseClientModule as any).supabaseClient;

if (!supabase) {
  throw new Error(
    "supabaseClient.ts export not found. Expected default export or named export."
  );
}

export type AddTracksToSupabaseProjectInput = {
  projectId: string;
  trackIds: string[];
};

export type AddTracksToSupabaseProjectResult = {
  projectId: string;
  trackIds: string[];
  linkedCount: number;
};

function cleanId(value: unknown): string {
  return String(value ?? "").trim();
}

function cleanUniqueIds(values: unknown[]): string[] {
  return Array.from(new Set(values.map(cleanId).filter(Boolean)));
}

export async function addTracksToSupabaseProject({
  projectId,
  trackIds,
}: AddTracksToSupabaseProjectInput): Promise<AddTracksToSupabaseProjectResult> {
  const cleanProjectId = cleanId(projectId);
  const cleanTrackIds = cleanUniqueIds(trackIds);

  if (!cleanProjectId) {
    throw new Error("Missing project id.");
  }

  if (cleanTrackIds.length === 0) {
    throw new Error("Choose at least one track first.");
  }

  const rows = cleanTrackIds.map((trackId) => ({
    project_id: cleanProjectId,
    track_id: trackId,
  }));

  const { error } = await supabase.from("project_tracks").upsert(rows, {
    onConflict: "project_id,track_id",
    ignoreDuplicates: true,
  });

  if (error) throw new Error(error.message);

  return {
    projectId: cleanProjectId,
    trackIds: cleanTrackIds,
    linkedCount: cleanTrackIds.length,
  };
}