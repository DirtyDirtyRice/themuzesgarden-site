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

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const userId = cleanId(authData?.user?.id);

  if (authError || !userId) {
    throw new Error("Sign in before sending songs to a project.");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, owner_id, visibility")
    .eq("id", cleanProjectId)
    .single();

  if (projectError || !project) {
    throw new Error("The destination project could not be verified.");
  }

  if (cleanId(project.owner_id) !== userId) {
    throw new Error("Only the project owner can send songs to this project.");
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

  const { data: verifiedRows, error: verificationError } = await supabase
    .from("project_tracks")
    .select("track_id")
    .eq("project_id", cleanProjectId)
    .in("track_id", cleanTrackIds);

  if (verificationError) {
    throw new Error(`Could not verify the project links: ${verificationError.message}`);
  }

  const verifiedTrackIds = cleanUniqueIds(
    (verifiedRows ?? []).map((row: { track_id?: unknown }) => row.track_id),
  );
  const verifiedSet = new Set(verifiedTrackIds);
  const missingTrackIds = cleanTrackIds.filter(
    (trackId) => !verifiedSet.has(trackId),
  );

  if (missingTrackIds.length > 0) {
    throw new Error(
      `Supabase did not confirm ${missingTrackIds.length} of ${cleanTrackIds.length} project links. No success was reported.`,
    );
  }

  return {
    projectId: cleanProjectId,
    trackIds: verifiedTrackIds,
    linkedCount: verifiedTrackIds.length,
  };
}