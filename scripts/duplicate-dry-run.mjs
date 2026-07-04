import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const envText = fs.readFileSync(envPath, "utf8");

function env(name) {
  const line = envText.split(/\r?\n/).find((item) => item.startsWith(`${name}=`));
  return line ? line.slice(name.length + 1).trim() : "";
}

const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const supabase = createClient(supabaseUrl, supabaseKey);

const bucket = "audio";
const searchText = (process.argv[2] ?? "8.5").toLowerCase();
const limit = Number(process.argv[3] ?? 100);

async function listAllMp3s() {
  const results = [];
  const queue = [{ prefix: "", depth: 0 }];
  const seen = new Set();

  while (queue.length && results.length < 3000) {
    const { prefix, depth } = queue.shift();

    if (seen.has(prefix)) continue;
    seen.add(prefix);

    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw new Error(error.message);

    for (const item of data ?? []) {
      const name = String(item.name ?? "");
      if (!name) continue;

      const isFolder = !item.id;
      if (isFolder) {
        if (depth < 6) queue.push({ prefix: `${prefix}${name}/`, depth: depth + 1 });
        continue;
      }

      if (!name.toLowerCase().endsWith(".mp3")) continue;

      const filePath = `${prefix}${name}`;
      const haystack = `${filePath} ${name}`.toLowerCase();

      if (haystack.includes(searchText)) {
        results.push({
          name,
          path: filePath,
          updatedAt: item.updated_at ?? item.updatedAt ?? "",
        });
      }
    }
  }

  return results;
}

async function hashTrack(track) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(track.path);
  const url = data?.publicUrl;

  if (!url) throw new Error(`No public URL for ${track.path}`);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${track.path}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");

  return {
    ...track,
    bytes: bytes.length,
    sizeMb: Number((bytes.length / 1024 / 1024).toFixed(2)),
    sha256,
  };
}

const candidates = (await listAllMp3s()).slice(0, limit);
const hashed = [];

for (let i = 0; i < candidates.length; i += 1) {
  const track = candidates[i];
  console.log(`Hashing ${i + 1}/${candidates.length}: ${track.name}`);
  hashed.push(await hashTrack(track));
}

const groups = new Map();

for (const track of hashed) {
  if (!groups.has(track.sha256)) groups.set(track.sha256, []);
  groups.get(track.sha256).push(track);
}

const duplicateGroups = Array.from(groups.values()).filter((group) => group.length > 1);
const keepCount = groups.size;
const duplicateExtraCount = hashed.length - keepCount;

const reportDir = path.join(root, "duplicate-reports");
fs.mkdirSync(reportDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const jsonPath = path.join(reportDir, `duplicate-dry-run-${searchText.replace(/[^a-z0-9]+/g, "-")}-${stamp}.json`);
const mdPath = jsonPath.replace(/\.json$/, ".md");

const report = {
  searchText,
  bucket,
  dryRun: true,
  deletesNothing: true,
  beforeCount: hashed.length,
  afterExactHashKeepCount: keepCount,
  duplicateExtraCount,
  duplicateGroupCount: duplicateGroups.length,
  duplicateGroups,
  allChecked: hashed,
};

fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

const lines = [];
lines.push(`# Duplicate Dry Run: ${searchText}`);
lines.push("");
lines.push(`Dry run only. Nothing was deleted.`);
lines.push("");
lines.push(`Before: ${hashed.length} files`);
lines.push(`After exact-hash cleanup would keep: ${keepCount} files`);
lines.push(`Duplicate extras found: ${duplicateExtraCount}`);
lines.push(`Duplicate groups found: ${duplicateGroups.length}`);
lines.push("");

if (duplicateGroups.length === 0) {
  lines.push("No exact byte-for-byte duplicate groups found in this sample.");
} else {
  duplicateGroups.forEach((group, index) => {
    lines.push(`## Duplicate Group ${index + 1}`);
    lines.push("");
    lines.push(`Hash: ${group[0].sha256}`);
    lines.push(`Size: ${group[0].sizeMb} MB`);
    lines.push("");
    group.forEach((track, trackIndex) => {
      lines.push(`${trackIndex === 0 ? "KEEP CANDIDATE" : "DUPLICATE"}: ${track.name}`);
      lines.push(`Path: ${track.path}`);
      lines.push("");
    });
  });
}

fs.writeFileSync(mdPath, lines.join("\n"));

console.log("");
console.log(`Report created: ${mdPath}`);
console.log(`JSON created: ${jsonPath}`);
console.log(`Before: ${hashed.length}`);
console.log(`After keep count: ${keepCount}`);
console.log(`Duplicate extras: ${duplicateExtraCount}`);
