"use client";

import { useEffect, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TRACKS_SEED } from "../../lib/tracksSeed";
import { supabase } from "../../lib/supabaseClient";
import { getUploadedTracks } from "../../lib/uploadedTracks";
import { getSupabaseTracks } from "../../lib/getSupabaseTracks";
import { LS_KEY } from "./libraryData";
import type { TrackLike } from "./libraryTypes";
import {
  ensureUnique,
  mergeTrackLists,
  normalizeTrack,
  safeParseJSON,
} from "./libraryUtils";

function getTagIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

type Args = {
  router: AppRouterInstance;
};

export function useLibraryTracks({ router }: Args) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [supabaseErr, setSupabaseErr] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackLike[]>(() => {
    return ((TRACKS_SEED as unknown as TrackLike[]) ?? [])
      .map((row) => normalizeTrack(row))
      .filter(Boolean) as TrackLike[];
  });

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
          return {
            ...t,
            tags: p.tags ?? t.tags,
          };
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
        return {
          ...t,
          tags: ensureUnique([...(t.tags ?? []), ...override]),
        };
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

  return {
    checkingSession,
    supabaseLoaded,
    supabaseErr,
    tracks,
    addTagToTrack,
    removeTagFromTrack,
    clearSavedTags,
  };
}