import * as supabaseClientModule from "@/lib/supabaseClient";

export const metadataSupabase: any =
  (supabaseClientModule as any).supabase ??
  (supabaseClientModule as any).default ??
  (supabaseClientModule as any).client ??
  (supabaseClientModule as any).supabaseClient;

export function requireMetadataSupabase() {
  if (!metadataSupabase) {
    throw new Error("Metadata Supabase client not found.");
  }

  return metadataSupabase;
}