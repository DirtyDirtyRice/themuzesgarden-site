import { supabase } from "./supabaseClient";

export type SupabaseTrack = {
  id: string; // stable id
  title: string;
  artist: string;
  url: string;
  tags: string[];
  path: string; // storage path
  bucket: string;
  updatedAt?: string;
};

function titleFromFilename(name: string) {
  const noExt = name.replace(/\.[^.]+$/, "");
  return noExt.replace(/[_]+/g, " ").trim() || "Untitled";
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function tagsFromPath(path: string) {
  // path like: "rock/song.mp3" or "demo/foo/bar.mp3"
  const parts = path.split("/").filter(Boolean);
  const folders = parts.slice(0, -1);
  return uniq(["supabase", "mp3", ...folders.map((s) => s.toLowerCase())]);
}

async function listAllMp3sFromBucket(bucket: string) {
  const results: { path: string; name: string; updatedAt?: string }[] = [];

  const seenPrefixes = new Set<string>();
  const queue: { prefix: string; depth: number }[] = [{ prefix: "", depth: 0 }];

  const MAX_DEPTH = 5;
  const MAX_ITEMS = 2000;

  while (queue.length && results.length < MAX_ITEMS) {
    const { prefix, depth } = queue.shift()!;
    if (seenPrefixes.has(prefix)) continue;
    seenPrefixes.add(prefix);

    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw new Error(error.message);

    for (const item of data ?? []) {
      const isFolder = !item.id;
      const itemName = item.name;

      if (isFolder) {
        if (depth < MAX_DEPTH) {
          queue.push({ prefix: `${prefix}${itemName}/`, depth: depth + 1 });
        }
        continue;
      }

      if (!itemName.toLowerCase().endsWith(".mp3")) continue;

      results.push({
        path: `${prefix}${itemName}`,
        name: itemName,
        updatedAt: (item as any).updated_at ?? (item as any).updatedAt,
      });

      if (results.length >= MAX_ITEMS) break;
    }
  }

  return results;
}

/**
 * Shared, client-side Supabase track fetch.
 * Requires Storage SELECT policy (you already added it).
 */
export async function getSupabaseTracksClient(options?: {
  bucket?: string;
}): Promise<SupabaseTrack[]> {
  const bucket = options?.bucket ?? "audio";

  const files = await listAllMp3sFromBucket(bucket);

  return files.map((f) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(f.path);
    const publicUrl = data.publicUrl;

    return {
      id: `sb:${bucket}:${f.path}`,
      title: titleFromFilename(f.name),
      artist: "Supabase",
      url: publicUrl,
      tags: tagsFromPath(f.path),
      path: f.path,
      bucket,
      updatedAt: f.updatedAt,
    };
  });
}