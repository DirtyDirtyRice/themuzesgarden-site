import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

if (url && anon) {
  client = createClient(url, anon);
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    // During Vercel build / SSR, env vars may be missing.
    // We don't want the build to crash. We only fail when code actually tries to use supabase.
    if (!client) {
      const msg =
        "Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY";
      // If we're in a browser, throw so you notice immediately.
      if (typeof window !== "undefined") throw new Error(msg);
      // If we're on the server/build, return a function that throws only if called.
      return () => {
        throw new Error(msg);
      };
    }

    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});