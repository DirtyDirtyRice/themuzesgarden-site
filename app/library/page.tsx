"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../components/TopNav";
import { TRACKS_SEED } from "../../lib/tracksSeed";
import { supabase } from "../../lib/supabaseClient";
import { getUploadedTracks } from "../../lib/uploadedTracks";
import {
  TAGS,
  findTag,
  type TagCategory,
  type TagDefinition,
} from "../../lib/tagSystem";

type TrackLike = {
  id: string;
  title: string;
  artist: string;
  url?: string;
  tags?: string[];
  createdAt?: string;
};

const LS_KEY = "muzes.library.trackTags.v1";

const CATEGORY_ORDER: TagCategory[] = [
  "genre",
  "mood",
  "instrument",
  "production",
  "energy",
  "era",
  "use",
  "reference",
];

const CATEGORY_LABEL: Record<TagCategory, string> = {
  genre: "Genre",
  mood: "Mood",
  instrument: "Instrument",
  production: "Production",
  energy: "Energy",
  era: "Era",
  use: "Use",
  reference: "Sounds Like",
};

function ensureUnique(arr: string[]) {
  return Array.from(new Set(arr));
}

function safeParseJSON<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function displayTagLabel(tagId: string) {
  const tag = findTag(tagId);
  if (!tag) return tagId;
  if (tag.category === "reference") return `Sounds Like: ${tag.label}`;
  return tag.label;
}

// Small reusable nested picker (Category -> Tag)
function NestedTagPicker(props: {
  title: string;
  onPickTagId: (tagId: string) => void;
  excludeTagIds?: string[];
}) {
  const { title, onPickTagId, excludeTagIds = [] } = props;

  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TagCategory>("reference");
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (open && rootRef.current && !rootRef.current.contains(t)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const tagsByCategory = useMemo(() => {
    const map: Record<TagCategory, TagDefinition[]> = {
      genre: [],
      mood: [],
      instrument: [],
      production: [],
      energy: [],
      era: [],
      use: [],
      reference: [],
    };
    for (const t of TAGS) map[t.category].push(t);
    return map;
  }, []);

  const visibleTags = useMemo(() => {
    const list = tagsByCategory[activeCategory] ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q ? list.filter((t) => t.label.toLowerCase().includes(q)) : list;

    return filtered.filter((t) => !excludeTagIds.includes(t.id));
  }, [tagsByCategory, activeCategory, search, excludeTagIds]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border rounded-lg px-3 py-2 text-sm bg-white text-black hover:bg-gray-50 shadow-sm"
      >
        {title} ▾
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[520px] max-w-[92vw] border rounded-2xl bg-white shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b bg-white">
            <div className="text-sm font-semibold text-black">{title}</div>
            <div className="text-xs text-gray-600 mt-1">
              Step 1: choose a category. Step 2: choose a tag.
            </div>
          </div>

          <div className="grid grid-cols-12">
            {/* LEFT: Categories */}
            <div className="col-span-5 border-r bg-gray-50">
              <div className="p-2">
                {CATEGORY_ORDER.map((cat) => {
                  const isActive = cat === activeCategory;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setSearch("");
                      }}
                      className={[
                        "w-full text-left px-3 py-2 rounded-xl text-sm",
                        isActive
                          ? "bg-white text-black shadow-sm border"
                          : "text-gray-800 hover:bg-white/70",
                      ].join(" ")}
                    >
                      {CATEGORY_LABEL[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Tags */}
            <div className="col-span-7 bg-white">
              <div className="p-3 border-b">
                <div className="text-xs font-semibold text-gray-700">
                  {CATEGORY_LABEL[activeCategory]}
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search within this category…"
                  className="mt-2 w-full border rounded-lg p-2 text-sm text-black bg-white"
                />
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {visibleTags.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-gray-600">No tags found.</div>
                ) : (
                  visibleTags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onPickTagId(t.id);
                        // keep open for multi-add; user can Esc or click outside to close
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 flex items-center justify-between"
                    >
                      <span className="text-sm text-black">
                        {t.category === "reference"
                          ? `Sounds Like: ${t.label}`
                          : t.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {CATEGORY_LABEL[t.category]}
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="p-2 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-sm px-3 py-2 border rounded-lg bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  // Global filter tags (AND)
  const [activeTags, setActiveTags] = useState<string[]>([]);

  // Tracks with local edits
  const [tracks, setTracks] = useState<TrackLike[]>(() => {
    return TRACKS_SEED as unknown as TrackLike[];
  });

  // Per-track editor
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

  // Options menu
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);

  // ✅ Member Protection: require an authenticated session to use /library
  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data.session;
        if (!session) {
          router.replace("/members");
          return;
        }
      } catch {
        router.replace("/members");
        return;
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ✅ Merge uploaded tracks from localStorage into library list (no duplicates)
  useEffect(() => {
    const uploaded = (getUploadedTracks() as unknown as TrackLike[]) ?? [];
    if (!uploaded.length) return;

    setTracks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const merged = [
        ...uploaded.filter((t) => t && t.id && !existingIds.has(t.id)),
        ...prev,
      ];
      return merged;
    });
  }, []);

  // ✅ Auto-refresh when uploads change in same tab (uploadedTracks.ts dispatches this event)
  useEffect(() => {
    function onUploadedUpdated() {
      const uploaded = (getUploadedTracks() as unknown as TrackLike[]) ?? [];
      setTracks((prev) => {
        const base = TRACKS_SEED as unknown as TrackLike[];
        const existingIds = new Set(base.map((t) => t.id));
        const merged = [
          ...uploaded.filter((t) => t && t.id && !existingIds.has(t.id)),
          ...base,
        ];

        // Preserve any current tag edits already applied in `prev` by overlaying tags from prev where IDs match
        const prevById = new Map(prev.map((t) => [t.id, t]));
        return merged.map((t) => {
          const p = prevById.get(t.id);
          if (!p) return t;
          return { ...t, tags: p.tags ?? t.tags };
        });
      });
    }

    window.addEventListener("tmz_tracks_updated", onUploadedUpdated);
    return () => {
      window.removeEventListener("tmz_tracks_updated", onUploadedUpdated);
    };
  }, []);

  useEffect(() => {
    const saved = safeParseJSON<Record<string, string[]>>(localStorage.getItem(LS_KEY));
    if (!saved) return;

    setTracks((prev) =>
      prev.map((t) => {
        const override = saved[t.id];
        if (!override) return t;
        return { ...t, tags: ensureUnique([...(t.tags ?? []), ...override]) };
      })
    );
  }, []);

  useEffect(() => {
    const map: Record<string, string[]> = {};
    for (const t of tracks) map[t.id] = ensureUnique(t.tags ?? []);
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  }, [tracks]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (optionsOpen && optionsRef.current && !optionsRef.current.contains(target)) {
        setOptionsOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOptionsOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [optionsOpen]);

  function addFilterTag(tagId: string) {
    setActiveTags((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
  }

  function removeFilterTag(tagId: string) {
    setActiveTags((prev) => prev.filter((t) => t !== tagId));
  }

  function clearFilters() {
    setActiveTags([]);
  }

  function clearSavedTags() {
    const ok = window.confirm(
      "Clear ALL saved per-track tags from this browser?\n(This does not change TRACKS_SEED — only local saved edits.)"
    );
    if (!ok) return;

    localStorage.removeItem(LS_KEY);
    setTracks(TRACKS_SEED as unknown as TrackLike[]);
    setEditingTrackId(null);
  }

  function addTagToTrack(trackId: string, tagId: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const next = ensureUnique([...(t.tags ?? []), tagId]);
        return { ...t, tags: next };
      })
    );
  }

  function removeTagFromTrack(trackId: string, tagId: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== trackId) return t;
        const next = (t.tags ?? []).filter((x) => x !== tagId);
        return { ...t, tags: next };
      })
    );
  }

  const filteredTracks = useMemo(() => {
    if (!activeTags.length) return tracks;
    return tracks.filter((t) => {
      const ids = t.tags ?? [];
      return activeTags.every((tag) => ids.includes(tag));
    });
  }, [tracks, activeTags]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <TopNav />
        <div className="p-6 max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-black">Library</h1>
          <p className="mt-2 text-sm text-zinc-600">Checking session…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopNav />

      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-black">Library</h1>

          <div className="flex items-center gap-2">
            {/* Nested tag picker for GLOBAL FILTERS */}
            <NestedTagPicker
              title="Tags"
              onPickTagId={(tagId) => addFilterTag(tagId)}
              excludeTagIds={activeTags}
            />

            {/* Options */}
            <div className="relative" ref={optionsRef}>
              <button
                type="button"
                onClick={() => setOptionsOpen((v) => !v)}
                className="border rounded-lg px-3 py-2 text-sm bg-white text-black hover:bg-gray-50 shadow-sm"
              >
                Options ▾
              </button>

              {optionsOpen && (
                <div className="absolute right-0 mt-2 w-64 border rounded-2xl bg-white shadow-xl z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      clearFilters();
                      setOptionsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-100"
                  >
                    Clear filters
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      clearSavedTags();
                      setOptionsOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-black hover:bg-gray-100"
                  >
                    Clear saved track tags
                  </button>

                  <div className="border-t">
                    <button
                      type="button"
                      onClick={() => setOptionsOpen(false)}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {activeTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeTags.map((tagId) => (
              <button
                key={tagId}
                type="button"
                onClick={() => removeFilterTag(tagId)}
                className="px-3 py-1 bg-black text-white rounded-full text-sm"
                title="Remove filter"
              >
                {displayTagLabel(tagId)} ✕
              </button>
            ))}
          </div>
        )}

        {/* Track list */}
        <div className="space-y-3">
          {filteredTracks.map((track) => {
            const tagIds = track.tags ?? [];
            const isEditing = editingTrackId === track.id;

            return (
              <div
                key={track.id}
                className="border rounded-2xl p-4 bg-white text-black hover:shadow-sm hover:ring-2 hover:ring-black/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-black">{track.title}</div>
                    <div className="text-sm text-gray-700">{track.artist}</div>
                  </div>

                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setEditingTrackId(track.id)}
                      className="text-sm px-3 py-2 border rounded-lg bg-white hover:bg-gray-50"
                    >
                      Edit tags
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingTrackId(null)}
                      className="text-sm px-3 py-2 border rounded-lg bg-white hover:bg-gray-50"
                    >
                      Done
                    </button>
                  )}
                </div>

                {/* Tags under track */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {tagIds.length === 0 ? (
                    <span className="text-xs text-gray-500">No tags yet.</span>
                  ) : (
                    tagIds.map((tagId) => (
                      <div key={`${track.id}-${tagId}`} className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => addFilterTag(tagId)}
                          className="text-xs px-2 py-1 border rounded-full bg-white text-black hover:bg-gray-100"
                          title="Filter by this tag"
                        >
                          {displayTagLabel(tagId)}
                        </button>

                        {/* 🔒 CHANGE: do NOT allow removing the system tag "uploaded" */}
                        {tagId !== "uploaded" && (
                          <button
                            type="button"
                            onClick={() => removeTagFromTrack(track.id, tagId)}
                            className="text-xs px-2 py-1 border rounded-full bg-white text-black hover:bg-gray-100"
                            title="Remove tag from this track"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Inline nested picker for THIS TRACK */}
                {isEditing && (
                  <div className="mt-4 flex items-center justify-between gap-3 border rounded-xl p-3 bg-gray-50">
                    <div className="text-sm text-gray-800">Add a tag to this track:</div>

                    <NestedTagPicker
                      title="Add tag"
                      onPickTagId={(tagId) => addTagToTrack(track.id, tagId)}
                      excludeTagIds={tagIds}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}