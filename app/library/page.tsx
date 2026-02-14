"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { TRACKS_SEED } from "../../lib/tracksSeed";
import type { Track } from "../../types/track";

type LibraryItem = {
  id: string; // use path as stable id
  title: string; // derived from filename
  artist: string;
  path: string;
  publicUrl: string;
  tags: string[];
};

const LS_LAST_TRACK_PUBLIC_URL = "tmz_player_last_track_public_url";

function isMp3(name: string) {
  return /\.mp3$/i.test(name);
}

function stripExt(name: string) {
  return name.replace(/\.[^/.]+$/, "");
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function uniq(list: string[]) {
  return Array.from(new Set(list));
}

function splitToTokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

// Remove marker groups like "(soft)" "[live]" "{demo}" for matching
function removeMarkers(titleNoExt: string): string {
  return titleNoExt
    .replace(/\(([^)]+)\)|\[([^\]]+)\]|\{([^}]+)\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ✅ Tags from title markers only: (hard) [live] {demo}
function deriveTagsFromTitleMarkers(titleNoExt: string): string[] {
  const matches = titleNoExt.match(/\(([^)]+)\)|\[([^\]]+)\]|\{([^}]+)\}/g);
  if (!matches) return [];

  const out: string[] = [];
  for (const m of matches) {
    const inner = m.slice(1, -1);
    const parts = inner
      .split(/[,/|&]/g)
      .map((x) => normalize(x))
      .filter(Boolean);
    for (const p of parts) out.push(p);
  }
  return uniq(out);
}

// ✅ Tags from folder names in the path: rock/demo/etc
function deriveTagsFromPathFolders(path: string): string[] {
  const parts = path.split("/").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return [];

  const folders = parts.slice(0, -1);

  // ignore the bucket itself and empty
  const ignore = new Set(["", "audio"]);

  // If folders have separators (rare), split them too:
  const tags: string[] = [];
  for (const folder of folders) {
    const f = normalize(folder);
    if (!f || ignore.has(f)) continue;

    // split folder into tokens on common separators, but keep the full folder too
    tags.push(f);

    const tokenParts = folder
      .split(/[_\-.,]+/g)
      .map((x) => normalize(x))
      .filter(Boolean);

    for (const t of tokenParts) {
      if (!ignore.has(t)) tags.push(t);
    }
  }

  return uniq(tags);
}

function mergeTags(...tagLists: Array<string[] | undefined>) {
  const set = new Set<string>();
  for (const list of tagLists) {
    for (const t of list ?? []) {
      const n = normalize(t);
      if (n) set.add(n);
    }
  }
  return Array.from(set);
}

// ✅ Detect known tags (vocabulary) appearing in title/path tokens
function deriveTagsFromVocabulary(params: {
  titleNoExt: string;
  path: string;
  vocab: Set<string>;
}): string[] {
  const { titleNoExt, path, vocab } = params;

  const tokenSet = new Set<string>([
    ...splitToTokens(titleNoExt),
    ...splitToTokens(path),
  ]);

  const found: string[] = [];
  for (const tag of vocab) {
    const t = normalize(tag);
    if (!t) continue;

    if (t.includes(" ")) {
      const titleNorm = normalize(titleNoExt);
      const pathNorm = normalize(path);
      if (titleNorm.includes(t) || pathNorm.includes(t)) found.push(t);
    } else {
      if (tokenSet.has(t)) found.push(t);
    }
  }

  return uniq(found);
}

// Recursively list files in a Supabase Storage bucket (client-side).
async function listAllFilesInBucket(params: {
  bucket: string;
  prefix?: string;
}): Promise<{ path: string; name: string }[]> {
  const { bucket } = params;
  const prefix = (params.prefix ?? "").replace(/^\/+|\/+$/g, "");

  const results: { path: string; name: string }[] = [];

  async function walk(folder: string) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 1000,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;
    if (!data) return;

    for (const entry of data) {
      const fullPath = folder ? `${folder}/${entry.name}` : entry.name;

      // heuristic: if it has an extension, treat as file; otherwise treat as folder
      if (/\.[a-z0-9]+$/i.test(entry.name)) {
        results.push({ path: fullPath, name: entry.name });
      } else {
        try {
          await walk(fullPath);
        } catch {
          // ignore folder read errors
        }
      }
    }
  }

  await walk(prefix);
  return results;
}

export default function LibraryPage() {
  const router = useRouter();

  // text search
  const [query, setQuery] = useState<string>("");

  // ✅ tag browsing (single “selected tag” filter)
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState<string>("");

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [nowPlayingPublicUrl, setNowPlayingPublicUrl] = useState<string>("");
  const restoredScrollRef = useRef(false);

  // -----------------------------
  // Seed support:
  // - vocab: all known tags
  // - seed entries list for "best match" title matching
  // -----------------------------
  const seedSupport = useMemo(() => {
    const vocab = new Set<string>();
    const seedEntries: Array<{
      titleNorm: string;
      titleNoMarkersNorm: string;
      tags: string[];
    }> = [];

    for (const t of TRACKS_SEED as Track[]) {
      const tags = (t.tags ?? []).map(normalize).filter(Boolean);
      for (const tag of tags) vocab.add(tag);

      const titleNorm = normalize(t.title);
      const titleNoMarkersNorm = normalize(removeMarkers(t.title));

      seedEntries.push({
        titleNorm,
        titleNoMarkersNorm,
        tags,
      });
    }

    vocab.delete("");
    return { vocab, seedEntries };
  }, []);

  function getSeedTagsBestMatch(titleNoExt: string): string[] {
    const a = normalize(titleNoExt);
    const b = normalize(removeMarkers(titleNoExt));

    // 1) exact match
    let best: { score: number; tags: string[] } | null = null;

    for (const e of seedSupport.seedEntries) {
      if (e.titleNorm === a) return e.tags;
      if (e.titleNoMarkersNorm === b) return e.tags;

      // 2) fuzzy: containment of marker-stripped titles (pick longest)
      const score1 =
        b.includes(e.titleNoMarkersNorm) || e.titleNoMarkersNorm.includes(b)
          ? Math.min(b.length, e.titleNoMarkersNorm.length)
          : 0;

      if (score1 > 0 && (!best || score1 > best.score)) {
        best = { score: score1, tags: e.tags };
      }
    }

    return best?.tags ?? [];
  }

  // -----------------------------
  // Load MP3 list from Supabase
  // Tags: seed best-match + markers + folders + vocab-detection
  // -----------------------------
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setLoadError(null);

      try {
        const BUCKET = "audio";
        const files = await listAllFilesInBucket({ bucket: BUCKET });

        const mp3s = files
          .filter((f) => isMp3(f.name))
          .map((f) => {
            const { data } = supabase.storage.from(BUCKET).getPublicUrl(f.path);

            const titleNoExt = stripExt(f.name);

            const seedBest = getSeedTagsBestMatch(titleNoExt);
            const fromMarkers = deriveTagsFromTitleMarkers(titleNoExt);
            const fromFolders = deriveTagsFromPathFolders(f.path);
            const fromVocab = deriveTagsFromVocabulary({
              titleNoExt,
              path: f.path,
              vocab: seedSupport.vocab,
            });

            const tags = mergeTags(seedBest, fromMarkers, fromFolders, fromVocab);

            return {
              id: f.path,
              title: titleNoExt,
              artist: "The Muzes Garden",
              path: f.path,
              publicUrl: data.publicUrl,
              tags,
            } satisfies LibraryItem;
          })
          .sort((a, b) => a.title.localeCompare(b.title));

        if (!cancelled) {
          setItems(mp3s);
          setLoading(false);
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Unknown error loading audio files";
        if (!cancelled) {
          setLoadError(msg);
          setItems([]);
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedSupport]);

  // -----------------------------
  // Now-playing highlight state
  // -----------------------------
  useEffect(() => {
    const read = () => {
      try {
        setNowPlayingPublicUrl(
          localStorage.getItem(LS_LAST_TRACK_PUBLIC_URL) ?? ""
        );
      } catch {
        setNowPlayingPublicUrl("");
      }
    };

    read();

    const onFocus = () => read();
    const onVis = () => {
      if (document.visibilityState === "visible") read();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // -----------------------------
  // Preserve scroll (simple)
  // -----------------------------
  useEffect(() => {
    if (restoredScrollRef.current) return;
    restoredScrollRef.current = true;

    try {
      const yRaw = sessionStorage.getItem("tmz_library_scroll") ?? "0";
      const y = Number(yRaw);
      if (Number.isFinite(y) && y > 0) {
        requestAnimationFrame(() => window.scrollTo({ top: y, left: 0 }));
      }
    } catch {}

    const onScroll = () => {
      try {
        sessionStorage.setItem(
          "tmz_library_scroll",
          String(window.scrollY || 0)
        );
      } catch {}
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // -----------------------------
  // ✅ Tag Index (counts) — professional browsing foundation
  // -----------------------------
  const tagIndex = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const raw of item.tags) {
        const t = normalize(raw);
        if (!t) continue;
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }

    const all = Array.from(counts.entries()).map(([tag, count]) => ({
      tag,
      count,
    }));

    // sort: high count first, then alphabetically
    all.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

    return all;
  }, [items]);

  const visibleTags = useMemo(() => {
    const q = normalize(tagSearch);
    if (!q) return tagIndex;
    return tagIndex.filter((t) => t.tag.includes(q));
  }, [tagIndex, tagSearch]);

  // -----------------------------
  // ✅ Filter (selected tag + text query)
  // -----------------------------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((t) => {
      // tag filter first
      if (selectedTag) {
        if (!t.tags.some((x) => normalize(x) === selectedTag)) return false;
      }

      // then text search
      if (!q) return true;

      return (
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q))
      );
    });
  }, [items, query, selectedTag]);

  // -----------------------------
  // Helpers
  // -----------------------------
  function toggleSelectedTag(tag: string) {
    const t = normalize(tag);
    setSelectedTag((prev) => (prev === t ? null : t));
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Library</h1>
          <div className="mt-1 text-xs text-zinc-600">
            Tracks: {items.length}
            {tagIndex.length ? ` • Tags: ${tagIndex.length}` : ""}
            {selectedTag ? ` • Filtered by tag: "${selectedTag}"` : ""}
          </div>
        </div>

        {selectedTag && (
          <button
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
            onClick={() => setSelectedTag(null)}
            title="Clear tag filter"
          >
            Clear tag: {selectedTag}
          </button>
        )}
      </div>

      {/* Text search stays exactly as your “quick find” tool */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title, artist, or tags…"
        className="mb-4 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring"
      />

      {/* ✅ Tag Browser Panel */}
      <section className="mb-8 rounded-xl border bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-zinc-900">Browse by tag</div>
          <input
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Filter tags…"
            className="w-full max-w-xs rounded-lg border px-3 py-2 text-sm outline-none focus:ring"
          />
        </div>

        {!tagIndex.length ? (
          <div className="text-sm text-zinc-600">No tags detected yet.</div>
        ) : !visibleTags.length ? (
          <div className="text-sm text-zinc-600">No matching tags.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visibleTags.map(({ tag, count }) => {
              const active = selectedTag === tag;

              return (
                <button
                  key={tag}
                  onClick={() => toggleSelectedTag(tag)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                    active
                      ? "border-zinc-900 bg-zinc-100 text-zinc-900"
                      : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
                  ].join(" ")}
                  title={`Filter to tag: ${tag}`}
                >
                  {tag} <span className="opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {loading ? (
        <div className="text-sm text-zinc-600">Loading Library…</div>
      ) : loadError ? (
        <div className="text-sm text-red-600">Couldn’t load: {loadError}</div>
      ) : !filtered.length ? (
        <div className="text-sm text-zinc-600">No matches.</div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((track) => {
            const isNowPlaying =
              !!nowPlayingPublicUrl && track.publicUrl === nowPlayingPublicUrl;

            return (
              <li
                key={track.id}
                className={[
                  "group rounded-lg border px-4 py-3 transition-colors",
                  isNowPlaying
                    ? "border-zinc-900 bg-zinc-100 ring-2 ring-zinc-900/10"
                    : "bg-white hover:bg-zinc-100",
                ].join(" ")}
              >
                <button
                  className={[
                    "flex w-full items-center justify-between text-left",
                    "bg-transparent p-0",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/40",
                  ].join(" ")}
                  onClick={() => {
                    router.push(`/?track=${encodeURIComponent(track.path)}`);
                  }}
                >
                  <div>
                    <div className="font-medium text-zinc-900">{track.title}</div>
                    <div className="text-xs text-zinc-700">{track.artist}</div>
                  </div>

                  {isNowPlaying && (
                    <span className="rounded-full border border-zinc-400 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-900">
                      Now Playing
                    </span>
                  )}
                </button>

                {/* Tags (click = toggle tag filter) */}
                {track.tags.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {track.tags.map((tag) => {
                      const t = normalize(tag);
                      const active = selectedTag === t;

                      return (
                        <button
                          key={`${track.id}:${t}`}
                          className={[
                            "rounded-full border px-2 py-1 text-xs transition-colors",
                            active
                              ? "border-zinc-900 bg-zinc-100 text-zinc-900"
                              : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
                          ].join(" ")}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSelectedTag(t);
                          }}
                          title="Click to filter by this tag"
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-zinc-500">No tags detected</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}