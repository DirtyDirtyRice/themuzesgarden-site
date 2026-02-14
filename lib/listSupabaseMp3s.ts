import { supabase } from "@/lib/supabaseClient";

export type SupabaseMp3Item = {
  name: string;      // file name only (ex: song.mp3)
  path: string;      // full path inside bucket (ex: rock/song.mp3)
  publicUrl: string; // full public URL
};

const BUCKET = "audio";

/**
 * Client-only: lists mp3s in the bucket root AND one level deep in folders.
 * This solves the common case: bucket has folders like "demo" and "rock".
 */
export async function listSupabaseMp3sClient(): Promise<SupabaseMp3Item[]> {
  if (typeof window === "undefined") {
    throw new Error("listSupabaseMp3sClient must run in the browser.");
  }

  // 1) List root
  const { data: root, error: rootErr } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

  if (rootErr) throw rootErr;
  if (!root) return [];

  const results: SupabaseMp3Item[] = [];

  const addFile = (path: string) => {
    const name = path.split("/").pop() || path;
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    results.push({
      name,
      path,
      publicUrl: pub.publicUrl,
    });
  };

  const isMp3 = (name: string) => name.toLowerCase().endsWith(".mp3");

  // 2) Add mp3s found in root, and collect potential folders
  const folderNames: string[] = [];

  for (const item of root) {
    const name = item?.name ?? "";
    if (!name) continue;

    if (isMp3(name)) {
      addFile(name); // root file
    } else {
      // likely folder (or non-mp3 file). We'll try listing it as a folder.
      folderNames.push(name);
    }
  }

  // 3) For each folder in root, list its contents and add mp3s
  for (const folder of folderNames) {
    const { data: inside, error: insideErr } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 1000, sortBy: { column: "name", order: "asc" } });

    // If it's not actually a folder, Supabase may return an error — ignore that folder.
    if (insideErr || !inside) continue;

    for (const item of inside) {
      const name = item?.name ?? "";
      if (!name) continue;
      if (isMp3(name)) {
        addFile(`${folder}/${name}`);
      }
    }
  }

  // 4) Sort results by path (stable)
  results.sort((a, b) => a.path.localeCompare(b.path));

  return results;
}