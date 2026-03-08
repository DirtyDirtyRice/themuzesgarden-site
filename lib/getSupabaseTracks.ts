import * as supabaseClientModule from "./supabaseClient";

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

function titleFromFilename(name: string) {
  const noExt = name.replace(/\.[^.]+$/, "");
  return noExt.replace(/[_]+/g, " ").trim() || "Untitled";
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

function normalizeTagPart(value: string): string[] {
  const cleaned = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[_]+/g, " ")
    .replace(/[-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  const parts = cleaned
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean);

  const out = [cleaned, ...parts].filter(Boolean);

  return uniq(out);
}

function tagsFromPath(path: string) {
  const parts = path.split("/").filter(Boolean);
  const folders = parts.slice(0, -1);

  const rawTags = ["supabase", "mp3", ...folders.flatMap(normalizeTagPart)];

  return uniq(
    rawTags.filter((tag) => {
      const t = String(tag ?? "").trim();
      if (!t) return false;
      if (t === "audio") return false;
      return true;
    })
  );
}

function compareTracks(a: SupabaseTrack, b: SupabaseTrack) {
  const byTitle = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  if (byTitle !== 0) return byTitle;

  const byPath = a.path.localeCompare(b.path, undefined, { sensitivity: "base" });
  if (byPath !== 0) return byPath;

  return a.id.localeCompare(b.id, undefined, { sensitivity: "base" });
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
      const isFolder = !(item as any).id;
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

export async function getSupabaseTracksClient(options?: {
  bucket?: string;
}): Promise<SupabaseTrack[]> {
  const bucket = options?.bucket ?? "audio";

  const files = await listAllMp3sFromBucket(bucket);

  const mapped: SupabaseTrack[] = files.map((f) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(f.path);
    const publicUrl = String(data?.publicUrl ?? "");

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

  const deduped = new Map<string, SupabaseTrack>();

  for (const track of mapped) {
    if (!track.id) continue;
    if (!track.url) continue;
    if (!deduped.has(track.id)) {
      deduped.set(track.id, track);
    }
  }

  return Array.from(deduped.values()).sort(compareTracks);
}

// EXTEND ONLY: aliases so any import name works
export const getSupabaseTracks = getSupabaseTracksClient;
export const getSupabaseTracksClients = getSupabaseTracksClient;