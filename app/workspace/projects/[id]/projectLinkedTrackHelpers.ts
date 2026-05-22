"use client";

import { useEffect, type RefObject } from "react";
import { looksLikeUuid } from "./projectDetailsUtils";
import type { Tab } from "./projectDetailsTypes";
import { writeProjectPlayerBridge } from "./projectPlayerBridge";

export function getProjectBridgeTrackIds(tracks: unknown[]): string[] {
  return tracks.map((track: any) => String(track?.id ?? "")).filter(Boolean);
}

export function getProjectBridgeTitle(project: unknown) {
  const row = project as { title?: unknown } | null | undefined;
  return String(row?.title ?? "Untitled Project");
}

export function useProjectDetailsLifecycleEffects({
  id,
  loading,
  user,
  tab,
  project,
  orderedLinkedTracks,
  previewTrackId,
  nowPlayingCardRef,
  setMiniAutoVisible,
  setPreviewTrackId,
  loadProject,
  loadNotes,
  loadLibrary,
  loadOverviewDock,
}: {
  id: string;
  loading: boolean;
  user: unknown;
  tab: Tab;
  project: unknown;
  orderedLinkedTracks: unknown[];
  previewTrackId: string | null;
  nowPlayingCardRef: RefObject<HTMLDivElement | null>;
  setMiniAutoVisible: (value: boolean | ((previous: boolean) => boolean)) => void;
  setPreviewTrackId: (trackId: string | null) => void;
  loadProject: () => Promise<unknown> | unknown;
  loadNotes: () => Promise<unknown> | unknown;
  loadLibrary: () => Promise<unknown> | unknown;
  loadOverviewDock: () => Promise<unknown> | unknown;
}) {
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!looksLikeUuid(id)) return;
    void loadProject();
  }, [loading, user, id, loadProject]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (tab === "notes") {
      void loadNotes();
      return;
    }

    if (tab === "library") {
      void loadLibrary();
      return;
    }

    if (tab === "overview") {
      void loadOverviewDock();
    }
  }, [loading, user, tab, loadNotes, loadLibrary, loadOverviewDock]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!looksLikeUuid(id)) return;
    if (!project) return;

    const trackIds = getProjectBridgeTrackIds(orderedLinkedTracks);

    writeProjectPlayerBridge({
      projectId: String(id),
      projectTitle: getProjectBridgeTitle(project),
      trackIds,
      trackCount: trackIds.length,
      updatedAt: new Date().toISOString(),
      source: "project-page",
    });
  }, [loading, user, id, project, orderedLinkedTracks]);

  useEffect(() => {
    if (tab !== "overview") return;

    function onScroll() {
      if (!nowPlayingCardRef.current) return;
      const rect = nowPlayingCardRef.current.getBoundingClientRect();
      setMiniAutoVisible(rect.top < -10);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll as any);
  }, [tab, nowPlayingCardRef, setMiniAutoVisible]);

  useEffect(() => {
    if (tab !== "overview") return;
    if (previewTrackId) return;
    if (!orderedLinkedTracks.length) return;

    const firstTrack = orderedLinkedTracks[0] as { id?: unknown } | undefined;
    setPreviewTrackId(String(firstTrack?.id ?? ""));
  }, [tab, previewTrackId, orderedLinkedTracks, setPreviewTrackId]);
}
