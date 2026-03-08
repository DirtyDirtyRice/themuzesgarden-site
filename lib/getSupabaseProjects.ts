import * as supabaseClientModule from "./supabaseClient";

export type ProjectKind = "music" | "education" | "game" | "experiment" | "collab";
export type ProjectVisibility = "private" | "shared" | "public";

export type ProjectRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  kind: ProjectKind;
  visibility: ProjectVisibility;
  modules_enabled: string[] | null;
  shared: boolean | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
};

// Match existing pattern used in your Supabase tracks helper
const supabase: any =
  (supabaseClientModule as any).supabase ??
  (supabaseClientModule as any).default ??
  (supabaseClientModule as any).client ??
  (supabaseClientModule as any).supabaseClient;

if (!supabase) {
  throw new Error(
    "supabaseClient.ts export not found. Expected default export or named export like supabase/client/supabaseClient."
  );
}

function normalizeKind(v: unknown): ProjectKind {
  if (
    v === "music" ||
    v === "education" ||
    v === "game" ||
    v === "experiment" ||
    v === "collab"
  )
    return v;
  return "music";
}

function normalizeVisibility(v: unknown): ProjectVisibility {
  if (v === "private" || v === "shared" || v === "public") return v;
  return "private";
}

function normalizeRow(r: any): ProjectRow {
  return {
    id: String(r.id),
    owner_id: String(r.owner_id),
    title: String(r.title ?? ""),
    description: r.description ?? null,
    kind: normalizeKind(r.kind),
    visibility: normalizeVisibility(r.visibility),
    modules_enabled: Array.isArray(r.modules_enabled)
      ? r.modules_enabled.map(String)
      : null,
    shared: typeof r.shared === "boolean" ? r.shared : (r.shared ?? null),
    template_id: r.template_id ?? null,
    created_at: String(r.created_at ?? ""),
    updated_at: String(r.updated_at ?? ""),
  };
}

/**
 * Read-only: relies on RLS to return only the signed-in user's rows.
 * IMPORTANT: Do not pass owner_id from client; insert should use auth.uid() via RLS check.
 */
export async function getSupabaseProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, owner_id, title, description, kind, visibility, modules_enabled, shared, template_id, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeRow);
}

// EXTEND ONLY: aliases so any import name works (matches your existing style)
export const getSupabaseProjectsClient = getSupabaseProjects;
export const getSupabaseProjectsClients = getSupabaseProjects;