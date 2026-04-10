"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "../components/TopNav";
import { TRACKS_SEED } from "../../lib/tracksSeed";
import { supabase } from "../../lib/supabaseClient";
import { getUploadedTracks } from "../../lib/uploadedTracks";
import { getSupabaseTracks } from "../../lib/getSupabaseTracks";
import NestedTagPicker from "./NestedTagPicker";
import { LS_KEY } from "./libraryData";
import type { TrackLike } from "./libraryTypes";
import {
  displayTagLabel,
  ensureUnique,
  mergeTrackLists,
  normalizeTrack,
  safeParseJSON,
} from "./libraryUtils";
import { buildLibraryGroundworkTracks } from "./libraryTrackGroundwork";

function getTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

export default function LibraryPage() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [supabaseErr, setSupabaseErr] = useState<string | null>(null);

  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [tracks, setTracks] = useState<TrackLike[]>(() => {
    return ((TRACKS_SEED as unknown as TrackLike[]) ?? [])
      .map((row) => normalizeTrack(row))
      .filter(Boolean) as TrackLike[];
  });

  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (checkingSession) return;

    let cancelled = false;

    async function loadLibraryTracks() {
      setSupabaseErr(null);

      try {
        const supabaseRows = await getSupabaseTracks();

        if (cancelled) return;

        const supabaseTracks = ((supabaseRows as unknown as TrackLike[]) ?? [])
          .map((row) => normalizeTrack(row))
          .filter(Boolean) as TrackLike[];

        const uploaded = ((getUploadedTracks() as unknown as TrackLike[]) ?? [])
          .map((row) => normalizeTrack(row))
          .filter(Boolean) as TrackLike[];

        const seed = ((TRACKS_SEED as unknown as TrackLike[]) ?? [])
          .map((row) => normalizeTrack(row))
          .filter(Boolean) as TrackLike[];

        setTracks((prev) => {
          const prevById = new Map(prev.map((t) => [t.id, t]));
          const merged = mergeTrackLists(supabaseTracks, uploaded, seed);

          return merged.map((t) => {
            const p = prevById.get(t.id);
            if (!p) return t;
            return {
              ...t,
              tags: p.tags ?? t.tags,
            };
          });
        });

        setSupabaseLoaded(true);
      } catch (err: any) {
        if (cancelled) return;

        const uploaded = ((getUploadedTracks() as unknown as TrackLike[]) ?? [])
          .map((row) => normalizeTrack(row))
          .filter(Boolean) as TrackLike[];

        const seed = ((TRACKS_SEED as unknown as TrackLike[]) ?? [])
          .map((row) => normalizeTrack(row))
          .filter(Boolean) as TrackLike[];

        setTracks((prev) => {
          const prevById = new Map(prev.map((t) => [t.id, t]));
          const merged = mergeTrackLists(uploaded, seed);

          return merged.map((t) => {
            const p = prevById.get(t.id);
            if (!p) return t;
            return {
              ...t,
              tags: p.tags ?? t.tags,
            };
          });
        });

        setSupabaseLoaded(false);
        setSupabaseErr(err?.message ?? "Failed to load Daddy Library tracks.");
      }
    }

    loadLibraryTracks();

    return () => {
      cancelled = true;
    };
  }, [checkingSession]);

  useEffect(() => {
    const uploaded = ((getUploadedTracks() as unknown as TrackLike[]) ?? [])
      .map((row) => normalizeTrack(row))
      .filter(Boolean) as TrackLike[];

    if (!uploaded.length) return;

    setTracks((prev) => mergeTrackLists(uploaded, prev));
  }, []);

  useEffect(() => {
    async function onUploadedUpdated() {
      const uploaded = ((getUploadedTracks() as unknown as TrackLike[]) ?? [])
        .map((row) => normalizeTrack(row))
        .filter(Boolean) as TrackLike[];

      let supabaseTracks: TrackLike[] = [];

      try {
        const supabaseRows = await getSupabaseTracks();
        supabaseTracks = ((supabaseRows as unknown as TrackLike[]) ?? [])
          .map((row) => normalizeTrack(row))
          .filter(Boolean) as TrackLike[];
      } catch {
        supabaseTracks = [];
      }

      setTracks((prev) => {
        const seed = ((TRACKS_SEED as unknown as TrackLike[]) ?? [])
          .map((row) => normalizeTrack(row))
          .filter(Boolean) as TrackLike[];

        const merged = mergeTrackLists(supabaseTracks, uploaded, seed, prev);

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
    const saved = safeParseJSON<Record<string, string[]>>(
      localStorage.getItem(LS_KEY)
    );
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
    for (const t of tracks) {
      map[String(t.id)] = ensureUnique(getTagIds(t.tags));
    }
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  }, [tracks]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        optionsOpen &&
        optionsRef.current &&
        !optionsRef.current.contains(target)
      ) {
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
    setTracks((prev) =>
      prev.map((t) => ({
        ...t,
        tags: [],
      }))
    );
    setEditingTrackId(null);
  }

  function addTagToTrack(trackId: string, tagId: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (String(t.id) !== trackId) return t;
        const next = ensureUnique([...getTagIds(t.tags), tagId]);
        return { ...t, tags: next };
      })
    );
  }

  function removeTagFromTrack(trackId: string, tagId: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (String(t.id) !== trackId) return t;
        const next = getTagIds(t.tags).filter((x) => x !== tagId);
        return { ...t, tags: next };
      })
    );
  }

  const groundworkTracks = useMemo(() => {
    return buildLibraryGroundworkTracks(
      (tracks as unknown as Record<string, unknown>[]) ?? []
    );
  }, [tracks]);

  const visibleTracks = useMemo(() => {
    return groundworkTracks.filter(
      (track) => track.libraryAccess.visibility !== "private"
    );
  }, [groundworkTracks]);

  const filteredTracks = useMemo(() => {
    if (!activeTags.length) return visibleTracks;

    return visibleTracks.filter((t) => {
      const ids = getTagIds(t.tags);
      return activeTags.every((tag) => ids.includes(tag));
    });
  }, [visibleTracks, activeTags]);

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

      <div className="p-6 lg:pr-[32rem] max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-black">Library</h1>
            <div className="mt-1 text-sm text-zinc-600">
              {filteredTracks.length} track
              {filteredTracks.length === 1 ? "" : "s"}
              {supabaseLoaded
                ? " • Daddy Library connected"
                : " • Local fallback only"}
            </div>
            {supabaseErr ? (
              <div className="mt-1 text-xs text-amber-700">
                Supabase load note: {supabaseErr}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <NestedTagPicker
              title="Tags"
              onPickTagId={(tagId) => addFilterTag(tagId)}
              excludeTagIds={activeTags}
            />

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

        <div className="space-y-3">
          {filteredTracks.map((track) => {
            const trackId = String(track.id ?? "");
            const trackTitle = String(track.title ?? "Untitled track");
            const trackArtist = String(track.artist ?? "");
            const trackSourceProjectTitle = track.sourceProjectTitle
              ? String(track.sourceProjectTitle)
              : "";
            const tagIds = getTagIds(track.tags);
            const isEditing = editingTrackId === trackId;

            return (
              <div
                key={trackId}
                className="border rounded-2xl p-4 bg-white text-black hover:shadow-sm hover:ring-2 hover:ring-black/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-black">{trackTitle}</div>
                    <div className="text-sm text-gray-700">{trackArtist}</div>

                    <div className="mt-1 text-xs text-zinc-500">
                      Source: {track.librarySourceLabel}
                      {" • "}
                      Visibility: {track.libraryVisibilityLabel}
                      {trackSourceProjectTitle
                        ? ` • Project: ${trackSourceProjectTitle}`
                        : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTrackId((cur) =>
                          cur === trackId ? null : trackId
                        )
                      }
                      className="text-sm px-3 py-2 border rounded-lg bg-white hover:bg-gray-50"
                    >
                      {isEditing ? "Done" : "Edit tags"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingTrackId(trackId)}
                      className="text-sm px-3 py-2 border rounded-lg bg-white hover:bg-gray-50"
                    >
                      Add tag
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {tagIds.length === 0 ? (
                    <span className="text-xs text-gray-500">
                      No tags yet. Use the Add tag button.
                    </span>
                  ) : (
                    tagIds.map((tagId) => (
                      <div key={`${trackId}-${tagId}`} className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => addFilterTag(tagId)}
                          className="text-xs px-2 py-1 border rounded-full bg-white text-black hover:bg-gray-100"
                          title="Filter by this tag"
                        >
                          {displayTagLabel(tagId)}
                        </button>

                        {tagId !== "uploaded" && (
                          <button
                            type="button"
                            onClick={() => removeTagFromTrack(trackId, tagId)}
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

                {isEditing && (
                  <div className="mt-4 flex items-center justify-between gap-3 border rounded-xl p-3 bg-gray-50">
                    <div className="text-sm text-gray-800">
                      Add a tag to this track:
                    </div>

                    <NestedTagPicker
                      title="Add tag"
                      onPickTagId={(tagId) => addTagToTrack(trackId, tagId)}
                      excludeTagIds={tagIds}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {filteredTracks.length === 0 && (
            <div className="border rounded-2xl p-6 bg-white text-sm text-zinc-600">
              No tracks found in the Daddy Library yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}