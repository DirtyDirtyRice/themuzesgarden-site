import { supabase } from "./supabaseClient";

export type Profile = {
  id: string;
  email: string | null;
  created_at?: string;
};

export type EnsureProfileResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: string };

export async function getProfileById(id: string): Promise<EnsureProfileResult> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Profile not found." };

    return { ok: true, profile: data as Profile };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error reading profile." };
  }
}

/**
 * Idempotent: safe to call every time a user loads Workspace.
 * - If profile exists → returns it
 * - If missing → creates it → returns it
 */
export async function ensureProfile(opts: {
  userId: string;
  email?: string | null;
}): Promise<EnsureProfileResult> {
  const { userId, email = null } = opts;

  // 1) Try read first
  const existing = await getProfileById(userId);
  if (existing.ok) return existing;

  // 2) Create (upsert) then re-read
  try {
    const { error: upsertError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
      },
      { onConflict: "id" }
    );

    if (upsertError) return { ok: false, error: upsertError.message };

    return await getProfileById(userId);
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error creating profile." };
  }
}