import "server-only";
import { createClient } from "@supabase/supabase-js";
import { TimelineDawWorkspaceService } from "./TimelineDawWorkspaceService";
import { TimelineDawWorkspaceSupabaseStore } from "./TimelineDawWorkspaceSupabaseStore";
import type { TimelineUserId } from "./TimelineTypes";

function environment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function createTimelineDawWorkspaceServer(ownerId: TimelineUserId, accessToken: string) {
  const client = createClient(
    environment("NEXT_PUBLIC_SUPABASE_URL"),
    environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
  return new TimelineDawWorkspaceService(new TimelineDawWorkspaceSupabaseStore(client, ownerId));
}

export function createTimelineDawWorkspaceStore(ownerId: TimelineUserId, accessToken: string) {
  const client = createClient(
    environment("NEXT_PUBLIC_SUPABASE_URL"),
    environment("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
  return new TimelineDawWorkspaceSupabaseStore(client, ownerId);
}
