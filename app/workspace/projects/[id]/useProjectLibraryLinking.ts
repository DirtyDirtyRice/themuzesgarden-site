"use client";

import { useCallback, useMemo, useState } from "react";
import type { MetadataTargetType } from "../../../../lib/metadata/metadataTypes";
import { getSupabaseTracks } from "../../../../lib/getSupabaseTracks";
import { logProjectActivity } from "../../../../lib/projectActivity";
import { looksLikeUuid } from "./projectDetailsUtils";

type UseProjectLibraryLinkingArgs = {
  projectId: string;
  supabase: any;
  userId?: string | null; // 🔥 NEW
  projectOwnerId?: string | null; // 🔥 NEW

  setSetlistOrder?: React.Dispatch<React.SetStateAction<string[]>>;
  setNowPlayingId?: React.Dispatch<React.SetStateAction<string | null>>;
  setPreviewTrackId?: React.Dispatch<React.SetStateAction<string | null>>;
  metadataTargetType?: MetadataTargetType;
  metadataTargetId?: string | null;
  setMetadataTargetId?: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useProjectLibraryLinking(args: UseProjectLibraryLinkingArgs) {
  const {
    projectId,
    supabase,
    userId,
    projectOwnerId,

    setSetlistOrder,
    setNowPlayingId,
    setPreviewTrackId,
    metadataTargetType,
    metadataTargetId,
    setMetadataTargetId,
  } = args;

  const [allTracks, setAllTracks] = useState<any[]>([]);
  const [linkedTrackIds, setLinkedTrackIds] = useState<Set<string>>(new Set());
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [libraryErr, setLibraryErr] = useState<string | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewErr, setOverviewErr] = useState<string | null>(null);
  const [linkBusyId, setLinkBusyId] = useState<string | null>(null);

  const linkedTracks = useMemo(() => {
    if (!allTracks?.length) return [];
    return allTracks.filter((t) => linkedTrackIds.has(String(t.id)));
  }, [allTracks, linkedTrackIds]);

  const ensureProjectExists = useCallback(async () => {
    if (!supabase) throw new Error("Supabase client not found.");
    if (!looksLikeUuid(projectId)) throw new Error("Invalid project id format.");

    const { data, error } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .limit(1);

    if (error) throw new Error(error.message);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Project not found. Cannot link tracks to a missing project.");
    }

    return true;
  }, [supabase, projectId]);

  const ensureTracksLoadedOnce = useCallback(async () => {
    if (allTracks.length > 0) return allTracks;

    const tracks = await getSupabaseTracks();
    let safeTracks = Array.isArray(tracks) ? tracks : [];

    // 🔥 NEW: OWNER PERMISSION LOGIC
    const isOwner =
      userId && projectOwnerId && String(userId) === String(projectOwnerId);

    if (!isOwner) {
      safeTracks = safeTracks.filter((t: any) => t.visibility !== "private");
    }

    setAllTracks(safeTracks);
    return safeTracks;
  }, [allTracks, userId, projectOwnerId]);

  const refreshLinkedIdsOnly = useCallback(async () => {
    if (!supabase) throw new Error("Supabase client not found.");
    if (!looksLikeUuid(projectId)) throw new Error("Invalid project id format.");

    const { data, error } = await supabase
      .from("project_tracks")
      .select("track_id")
      .eq("project_id", projectId);

    if (error) throw new Error(error.message);

    const ids = new Set<string>((data ?? []).map((r: any) => String(r.track_id)));
    setLinkedTrackIds(ids);

    setSetlistOrder?.((prev) => prev.filter((tid) => ids.has(String(tid))));
    setNowPlayingId?.((cur) => (!cur ? cur : ids.has(String(cur)) ? cur : null));
    setPreviewTrackId?.((cur) => (!cur ? cur : ids.has(String(cur)) ? cur : null));

    if (
      metadataTargetType === "track" &&
      metadataTargetId &&
      !ids.has(String(metadataTargetId))
    ) {
      setMetadataTargetId?.(null);
    }

    return ids;
  }, [
    supabase,
    projectId,
    setSetlistOrder,
    setNowPlayingId,
    setPreviewTrackId,
    metadataTargetType,
    metadataTargetId,
    setMetadataTargetId,
  ]);

  const loadLibrary = useCallback(async () => {
    setLibraryErr(null);
    setLoadingLibrary(true);

    try {
      await ensureTracksLoadedOnce();
      await refreshLinkedIdsOnly();
    } catch (e: any) {
      setLibraryErr(e?.message ?? "Failed to load library links");
      setLinkedTrackIds(new Set());
    } finally {
      setLoadingLibrary(false);
    }
  }, [ensureTracksLoadedOnce, refreshLinkedIdsOnly]);

  const loadOverviewDock = useCallback(async () => {
    setOverviewErr(null);
    setOverviewLoading(true);

    try {
      await ensureTracksLoadedOnce();
      await refreshLinkedIdsOnly();
    } catch (e: any) {
      setOverviewErr(e?.message ?? "Failed to load project library dock");
    } finally {
      setOverviewLoading(false);
    }
  }, [ensureTracksLoadedOnce, refreshLinkedIdsOnly]);

  const linkTrack = useCallback(
    async (trackId: string) => {
      setLibraryErr(null);
      setOverviewErr(null);

      try {
        if (!supabase) throw new Error("Supabase client not found.");
        if (!looksLikeUuid(projectId)) throw new Error("Invalid project id format.");
        if (linkedTrackIds.has(trackId)) return;

        await ensureProjectExists();

        setLinkBusyId(trackId);

        setLinkedTrackIds((prev) => {
          const next = new Set(prev);
          next.add(trackId);
          return next;
        });

        const { data: existing, error: existingErr } = await supabase
          .from("project_tracks")
          .select("track_id")
          .eq("project_id", projectId)
          .eq("track_id", trackId)
          .limit(1);

        if (existingErr) throw new Error(existingErr.message);
        if (Array.isArray(existing) && existing.length > 0) return;

        const { error } = await supabase
          .from("project_tracks")
          .insert({ project_id: projectId, track_id: trackId });

        if (error) throw new Error(error.message);

        const linkedTrack =
          allTracks.find((t: any) => String(t?.id) === String(trackId)) ?? null;

        logProjectActivity(
          projectId,
          "link",
          `Linked track: ${linkedTrack?.title ?? "Untitled"}`,
          { trackId }
        );

        setSetlistOrder?.((prev) => (prev.includes(trackId) ? prev : [...prev, trackId]));
      } catch (e: any) {
        setLinkedTrackIds((prev) => {
          const next = new Set(prev);
          next.delete(trackId);
          return next;
        });

        const msg = e?.message ?? "Link failed";
        setLibraryErr(msg);
        setOverviewErr(msg);
      } finally {
        setLinkBusyId(null);
      }
    },
    [supabase, projectId, linkedTrackIds, ensureProjectExists, allTracks, setSetlistOrder]
  );

  const unlinkTrack = useCallback(
    async (trackId: string) => {
      setLibraryErr(null);
      setOverviewErr(null);

      try {
        if (!supabase) throw new Error("Supabase client not found.");
        if (!looksLikeUuid(projectId)) throw new Error("Invalid project id format.");
        if (!linkedTrackIds.has(trackId)) return;

        setLinkBusyId(trackId);

        setLinkedTrackIds((prev) => {
          const next = new Set(prev);
          next.delete(trackId);
          return next;
        });

        setSetlistOrder?.((prev) => prev.filter((tid) => tid !== trackId));

        const { error } = await supabase
          .from("project_tracks")
          .delete()
          .eq("project_id", projectId)
          .eq("track_id", trackId);

        if (error) throw new Error(error.message);

        const unlinkedTrack =
          allTracks.find((t: any) => String(t?.id) === String(trackId)) ?? null;

        logProjectActivity(
          projectId,
          "unlink",
          `Unlinked track: ${unlinkedTrack?.title ?? "Untitled"}`,
          { trackId }
        );
      } catch (e: any) {
        setLinkedTrackIds((prev) => {
          const next = new Set(prev);
          next.add(trackId);
          return next;
        });

        const msg = e?.message ?? "Unlink failed";
        setLibraryErr(msg);
        setOverviewErr(msg);
      } finally {
        setLinkBusyId(null);
      }
    },
    [supabase, projectId, linkedTrackIds, allTracks, setSetlistOrder]
  );

  return {
    allTracks,
    setAllTracks,
    linkedTrackIds,
    setLinkedTrackIds,
    linkedTracks,
    loadingLibrary,
    libraryErr,
    overviewLoading,
    overviewErr,
    linkBusyId,
    ensureProjectExists,
    ensureTracksLoadedOnce,
    refreshLinkedIdsOnly,
    loadLibrary,
    loadOverviewDock,
    linkTrack,
    unlinkTrack,
  };
}