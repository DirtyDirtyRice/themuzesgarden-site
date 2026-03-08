import * as supabaseClientModule from "./supabaseClient";

export type ProjectKind = "music" | "education" | "game" | "experiment" | "collab";
export type ProjectVisibility = "private" | "shared" | "public";

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

export async function createSupabaseProject(input: {
  title: string;
  description?: string;
  kind?: ProjectKind;
  visibility?: ProjectVisibility;
}): Promise<{ id: string }> {
  const payload = {
    title: input.title,
    description: input.description ?? null,
    kind: input.kind ?? "music",
    visibility: input.visibility ?? "private",
    modules_enabled: ["library"],
    shared: false,
    template_id: null,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return data as { id: string };
}