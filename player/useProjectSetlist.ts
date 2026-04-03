"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnyTrack } from "./playerTypes";

type UseProjectSetlistArgs = {
  onProjectPage: boolean;
  projectId: string;
  allTracks: AnyTrack[];
};

export function useProjectSetlist(args: UseProjectSetlistArgs) {
  const { onProjectPage, projectId, allTracks } = args;

  const [projectTracks, setProjectTracks] = useState<AnyTrack[]>([]);
  const [loadingProject, setLoadingProject] = useState(false);
  const [projectErr, setProjectErr] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  const cleanProjectId = useMemo(() => {
    return String(projectId ?? "").trim();
  }, [projectId]);

  const refreshProjectIds = useCallback(async () => {
    if (!cleanProjectId) return;

    try {
      setLoadingProject(true);
      setProjectErr(null);

      // Replace with your actual data fetch if needed
      const ids: string[] = []; // placeholder if your real logic is elsewhere

      const nextTracks = ids
        .map((id) => allTracks.find((t) => String(t.id) === String(id)))
        .filter(Boolean) as AnyTrack[];

      setProjectTracks(nextTracks);
    } catch (err: any) {
      setProjectErr(err?.message ?? "Failed to load project tracks");
    } finally {
      setLoadingProject(false);
    }
  }, [cleanProjectId, allTracks]);

  // 🔥 FIX: only refresh when actually on project page
  useEffect(() => {
    if (!onProjectPage) return;
    if (!cleanProjectId) return;
    refreshProjectIds();
  }, [onProjectPage, cleanProjectId, refreshProjectIds]);

  // 🔥 FIX: also guard event-driven refresh
  useEffect(() => {
    function onSync() {
      if (!onProjectPage) return;
      if (!cleanProjectId) return;
      refreshProjectIds();
    }

    if (typeof window !== "undefined") {
      window.addEventListener(
        "muzes:projectTracksChanged",
        onSync as EventListener
      );
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "muzes:projectTracksChanged",
          onSync as EventListener
        );
      }
    };
  }, [onProjectPage, cleanProjectId, refreshProjectIds]);

  const moveUp = useCallback((index: number) => {
    setProjectTracks((prev) => {
      if (index <= 0 || index >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setProjectTracks((prev) => {
      if (index < 0 || index >= prev.length - 1) return prev;
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  }, []);

  const moveToIndex = useCallback((from: number, to: number) => {
    setProjectTracks((prev) => {
      if (
        from < 0 ||
        from >= prev.length ||
        to < 0 ||
        to >= prev.length ||
        from === to
      )
        return prev;

      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }, []);

  const resetOrderToLinkedTruth = useCallback(() => {
    refreshProjectIds();
  }, [refreshProjectIds]);

  const jumpToNow = useCallback((trackId: string) => {
    if (!listRef.current) return;

    const el = listRef.current.querySelector(
      `[data-track-id="${trackId}"]`
    ) as HTMLElement | null;

    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  return {
    projectTracks,
    loadingProject,
    projectErr,
    refreshProjectIds,
    moveUp,
    moveDown,
    moveToIndex,
    resetOrderToLinkedTruth,
    jumpToNow,
    listRef,
  };
}