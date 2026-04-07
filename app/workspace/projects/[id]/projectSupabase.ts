import * as supabaseClientModule from "../../../../lib/supabaseClient";

export const projectSupabase: any =
  (supabaseClientModule as any).supabase ??
  (supabaseClientModule as any).default ??
  (supabaseClientModule as any).client ??
  (supabaseClientModule as any).supabaseClient;

export function requireProjectSupabase() {
  if (!projectSupabase) {
    throw new Error("Supabase client not found.");
  }

  return projectSupabase;
}