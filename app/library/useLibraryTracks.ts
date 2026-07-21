"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TRACKS_SEED } from "../../lib/tracksSeed";
import { useAuth } from "../components/AuthProvider";
import { getUploadedTracks } from "../../lib/uploadedTracks";
import { getSupabaseTracks } from "../../lib/getSupabaseTracks";
import { getUnifiedTrackLibrary } from "../../lib/tracks/unifiedTrackLibrary";
import {
  getSupabaseProjects,
  type ProjectRow,
} from "../../lib/getSupabaseProjects";
import { addTracksToSupabaseProject } from "../../lib/addTracksToSupabaseProject";
import { getPublicProjectTrackIds } from "../../lib/getPublicProjectTrackIds";
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
  void router;
  const { user, loading: checkingSession, error: sessionError } = useAuth();
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [supabaseErr, setSupabaseErr] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackLike[]>(() => {
    return ((TRACKS_SEED as unknown as TrackLike[]) ?? [])
      .map((row) => normalizeTrack(row))
      .filter(Boolean) as TrackLike[];
  });
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [publicProjectTrackIds, setPublicProjectTrackIds] = useState<string[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [sendingToProject, setSendingToProject] = useState(false);
  const [projectLinkMessage, setProjectLinkMessage] = useState<string | null>(
    null
  );

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setProjectLinkMessage(null);

    try {
      const [publicTrackIds, ownedProjects] = await Promise.all([
        getPublicProjectTrackIds(),
        user ? getSupabaseProjects(user.id) : Promise.resolve([]),
      ]);

      setPublicProjectTrackIds(publicTrackIds);
      setProjects(ownedProjects);
    } catch (err: any) {
      setProjects([]);
      setPublicProjectTrackIds([]);
      setProjectLinkMessage(
        err?.message ?? "Failed to load projects and their public songs.",
      );
    } finally {
      setLoadingProjects(false);
    }
  }, [user]);

  useEffect(() => {
    if (checkingSession) return;
    void loadProjects();
  }, [checkingSession, loadProjects]);

  useEffect(() => {
    if (checkingSession) return;

    let cancelled = false;

    async function loadLibraryTracks() {
      setSupabaseErr(null);

      try {
        const unifiedRows = await getUnifiedTrackLibrary();

        if (cancelled) return;

        const unifiedTracks = ((unifiedRows as unknown as TrackLike[]) ?? [])
          .map((row) => normalizeTrack(row))
          .filter(Boolean) as TrackLike[];

        console.log(
          "[Unified Track Engine]",
          unifiedTracks.length,
          "tracks loaded"
        );

        setTracks((prev) => {
          const prevById = new Map(prev.map((t) => [t.id, t]));

          return unifiedTracks.map((t) => {
            const p = prevById.get(t.id);

            if (!p) {
              return t;
            }

            return {
              ...t,
              tags: p.tags ?? t.tags,
            };
          });
        });

        setSupabaseLoaded(true);
      } catch (err: any) {
        if (cancelled) return;

        /*
        ============================================================
        LEGACY LOADER (TEMPORARILY KEPT AS FALLBACK)

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
        ============================================================
        */

        setSupabaseLoaded(false);
        setSupabaseErr(err?.message ?? "Failed to load Unified Track Library.");
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

        return {
          ...t,
          tags: next,
        };
      })
    );
  }

  function removeTagFromTrack(trackId: string, tagId: string) {
    setTracks((prev) =>
      prev.map((t) => {
        if (String(t.id) !== trackId) return t;

        const next = getTagIds(t.tags).filter((x) => x !== tagId);

        return {
          ...t,
          tags: next,
        };
      })
    );
  }

  async function addSelectedTracksToProject(
    projectId: string,
    trackIds: string[]
  ) {
    if (!user) {
      setProjectLinkMessage("Sign in before sending tracks to a project.");
      return false;
    }

    const cleanProjectId = String(projectId ?? "").trim();

    const cleanTrackIds = Array.from(
      new Set(trackIds.map((trackId) => String(trackId ?? "").trim()))
    ).filter(Boolean);

    if (!cleanProjectId) {
      setProjectLinkMessage("Choose a project first.");
      return false;
    }

    if (cleanTrackIds.length === 0) {
      setProjectLinkMessage("Choose at least one track first.");
      return false;
    }

    const destinationProject = projects.find(
      (project) => project.id === cleanProjectId,
    );

    if (!destinationProject) {
      setProjectLinkMessage(
        "That project is not in your owned-project list. Refresh projects and choose again.",
      );
      return false;
    }

    if (destinationProject.owner_id !== user.id) {
      setProjectLinkMessage("Only the project owner can send songs here.");
      return false;
    }

    setSendingToProject(true);
    setProjectLinkMessage(null);

    try {
      const result = await addTracksToSupabaseProject({
        projectId: cleanProjectId,
        trackIds: cleanTrackIds,
      });

      const projectTitle =
        projects.find((project) => project.id === cleanProjectId)?.title ??
        "project";

      setProjectLinkMessage(
        `Sent ${result.linkedCount} track${
          result.linkedCount === 1 ? "" : "s"
        } to ${projectTitle}.`
      );

      return true;
    } catch (err: any) {
      setProjectLinkMessage(err?.message ?? "Failed to send tracks to project.");
      return false;
    } finally {
      setSendingToProject(false);
    }
  }

  return {
    checkingSession,
    memberSignedIn: Boolean(user),
    memberUserId: user?.id ?? null,
    sessionError,
    supabaseLoaded,
    supabaseErr,
    tracks,
    publicProjectTrackIds,
    projects,
    loadingProjects,
    sendingToProject,
    projectLinkMessage,
    loadProjects,
    addSelectedTracksToProject,
    addTagToTrack,
    removeTagFromTrack,
    clearSavedTags,
  };
}